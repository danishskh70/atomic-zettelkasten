import threading
import webview
import uvicorn
from main import app

def run_server():
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")

if __name__ == "__main__":
    threading.Thread(target=run_server, daemon=True).start()
    webview.create_window("Zettelkasten", "http://127.0.0.1:8000/", width=1000, height=700)
    webview.start()