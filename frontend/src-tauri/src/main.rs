use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
use std::sync::Mutex;
use tauri_plugin_shell::process::CommandChild;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|app| {
            let sidecar = app
                .shell()
                .sidecar("atomic-backend")
                .expect("failed to create sidecar command");

            let (mut rx, child) = sidecar.spawn().expect("failed to spawn sidecar");

            app.manage(Mutex::new(Some(child)));

            tauri::async_runtime::spawn(async move {
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => log::info!("{}", String::from_utf8_lossy(&line)),
                        CommandEvent::Stderr(line) => log::error!("{}", String::from_utf8_lossy(&line)),
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
        let state = window.app_handle().state::<Mutex<Option<CommandChild>>>();
        let child_opt = state.lock().unwrap().take();
        if let Some(child) = child_opt {
            let _ = child.kill();
          }
        }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}