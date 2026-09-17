# Atomic - Desktop Zettelkasten Application

A desktop Zettelkasten note-taking application built with **React**, **FastAPI (Python)**, and **Tauri v2**.

---

## 🏗️ Project Architecture

- **`frontend/`**: Vite + React + TypeScript interface using D3 Force Graph for note linking, bundled into a desktop application via Tauri.
- **`backend/`**: FastAPI server managing SQLite database storage (`sqlmodel`), CRUD endpoints, and note relationships.
- **`frontend/src-tauri/`**: Tauri v2 desktop wrapper configuring the native application window and sidecar process integration.

---

## 🛠️ Prerequisites

Before building the application from source, make sure you have the following installed:

1. **Node.js** (v18 or higher) & **npm**
2. **Python** (v3.12 or higher) & [uv](https://docs.astral.sh/uv/) (Python package manager)
3. **Rust Toolchain**: Required by Tauri ([Install Rust](https://www.rust-lang.org/tools/install))
4. **C++ Build Tools**:
   - **Windows:** Visual Studio C++ Build Tools (with "Desktop development with C++" workload)
   - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
   - **Linux:** `build-essential`, `libssl-dev`, `libgtk-3-dev`, `webkit2gtk-4.1`

---

## 🚀 Setting Up for Development

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd zettelkasten
```

### 2. Set Up & Run Backend (FastAPI)
Open a terminal in the `backend/` folder:
```bash
cd backend

# Create virtual environment and install dependencies using uv
uv venv
uv sync

# Run the FastAPI server in development mode
uv run python main.py
```
*The backend API will start at `http://127.0.0.1:8000`.*

### 3. Set Up & Run Frontend / Tauri Desktop App
Open a separate terminal in the `frontend/` folder:
```bash
cd frontend

# Install Node dependencies
npm install

# Option A: Run Vite Web Frontend in Browser
npm run dev

# Option B: Run Tauri Desktop App in Development Mode
npx tauri dev
```

---

## 📦 Building the Desktop Executable (.exe / .app / .deb)

To build a standalone executable installer from scratch:

### Step 1: Package the Backend Binary (Sidecar)
First, compile the FastAPI Python backend into a single executable binary using PyInstaller so Tauri can embed it:

```bash
cd backend
uv run pyinstaller --onefile main.py -n atomic-backend
```

Move/copy the built binary into Tauri's expected `binaries` directory:
- **Windows:** Rename `dist/atomic-backend.exe` to `atomic-backend-x86_64-pc-windows-msvc.exe` and place it in `frontend/src-tauri/binaries/`.
- **macOS / Linux:** Append target triple to binary name according to Tauri sidecar naming conventions.

### Step 2: Build Desktop Bundle via Tauri
```bash
cd frontend
npx tauri build
```

The output installers (`.msi` / `.exe` for Windows, `.dmg` for macOS, `.deb` for Linux) will be generated in:
```
frontend/src-tauri/target/release/bundle/
```

---

## 📁 Repository Structure & `.gitignore` Rules

The repository includes a root [.gitignore](file:///C:/Users/Acer/Desktop/project/zettelkasten/.gitignore) file configured to exclude environment-specific binaries, dependencies, and build outputs:

- ❌ `backend/.venv/`, `__pycache__/`, `build/`, `dist/`
- ❌ `frontend/node_modules/`, `dist/`
- ❌ `frontend/src-tauri/target/`, `frontend/src-tauri/binaries/`
