# Cedar Desktop Application

This directory contains the Tauri configuration for building Cedar as a native desktop application.

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Rust** (latest stable)
- **Tauri CLI**: `cargo install tauri-cli`
- **macOS**: Xcode Command Line Tools
- **Windows**: Microsoft Visual Studio C++ Build Tools
- **Linux**: Build essentials and WebKit2GTK

### Development

1. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   # From the project root
   cargo tauri dev
   ```

   This will:
   - Start the Vite dev server on `http://localhost:3000`
   - Build and run the Tauri application
   - Enable hot reload for both frontend and backend

### Building for Production

```bash
# Build for current platform
cargo tauri build

# Build for specific platform
cargo tauri build --target x86_64-apple-darwin  # macOS Intel
cargo tauri build --target aarch64-apple-darwin # macOS Apple Silicon
cargo tauri build --target x86_64-unknown-linux-gnu  # Linux
cargo tauri build --target x86_64-pc-windows-msvc    # Windows
```

## 📁 Project Structure

```
src-tauri/
├── src/
│   └── main.rs              # Tauri application entry point
├── icons/                   # Application icons
├── capabilities/            # Tauri security capabilities
├── tauri.conf.json         # Tauri configuration
├── Cargo.toml              # Rust dependencies
└── build.rs                # Build script

frontend/
├── src/
│   ├── components/         # React components
│   ├── api.ts             # Tauri API integration
│   └── ...
├── dist/                  # Built frontend (generated)
└── package.json           # Frontend dependencies
```

## 🔧 Configuration

### Tauri Configuration (`src-tauri/tauri.conf.json`)

- **Window Settings**: 1400x900 with minimum 1000x700
- **Security**: CSP configured for fonts and API access
- **Build**: Automatic frontend build integration
- **Bundle**: macOS, Windows, and Linux targets

### Frontend Integration

The frontend uses Tauri's `invoke` API to communicate with the Rust backend:

```typescript
import { invoke } from '@tauri-apps/api/tauri'

// Start research
const response = await invoke('start_research', { request })

// Execute code
const result = await invoke('execute_code', { request })
```

## 🔌 Backend Integration

### Current Implementation

The Tauri backend currently provides mock implementations for:

- `start_research` - Creates research sessions
- `execute_code` - Simulates Python code execution
- `save_session` - Stores session data in memory
- `load_session` - Retrieves session data

### Integration with Cedar Core

To integrate with your existing `cedar-core`:

1. **Add cedar-core as dependency:**
   ```toml
   # src-tauri/Cargo.toml
   [dependencies]
   cedar-core = { path = "../cedar-core" }
   ```

2. **Update main.rs to use cedar-core:**
   ```rust
   use cedar_core::{agent, cell, context, executor, llm};
   
   #[tauri::command]
   async fn start_research(request: ResearchRequest) -> Result<serde_json::Value, String> {
       let mut context = context::NotebookContext::new();
       let cells = agent::generate_plan_from_goal(&request.goal, &mut context).await?;
       // Convert cells to JSON response
       Ok(serde_json::to_value(cells)?)
   }
   ```

3. **Environment Variables:**
   - Copy `.env` to `src-tauri/` for Tauri to access
   - Or use Tauri's environment variable handling

## 🎨 Customization

### Icons

Replace icons in `src-tauri/icons/`:
- `32x32.png` - Small icon
- `128x128.png` - Medium icon
- `128x128@2x.png` - High DPI icon
- `icon.icns` - macOS icon
- `icon.ico` - Windows icon

### Window Configuration

Modify `tauri.conf.json`:
```json
{
  "app": {
    "windows": [
      {
        "title": "Cedar - AI Research Assistant",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 700,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ]
  }
}
```

### Security

Configure Content Security Policy in `tauri.conf.json`:
```json
{
  "security": {
    "csp": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.openai.com"
  }
}
```

## 🚀 Deployment

### macOS

```bash
# Build for macOS
cargo tauri build --target aarch64-apple-darwin

# Create DMG (requires create-dmg)
cargo tauri build --target aarch64-apple-darwin --config tauri.bundle.macOS.dmg.active=true
```

### Code Signing

For macOS App Store distribution:

1. **Get Apple Developer Certificate**
2. **Configure in tauri.conf.json:**
   ```json
   {
     "bundle": {
       "macOS": {
         "codeSigningIdentity": "Apple Development: Your Name (TEAM_ID)",
         "hardenedRuntime": true,
         "entitlements": "entitlements.plist"
       }
     }
   }
   ```

### Notarization

For macOS distribution outside App Store:

```bash
# Notarize the app
xcrun notarytool submit target/release/bundle/macos/Cedar.app \
  --apple-id "your-apple-id@example.com" \
  --password "app-specific-password" \
  --team-id "TEAM_ID"
```

## 🔍 Debugging

### Development Logs

```bash
# Enable debug logging
RUST_LOG=debug cargo tauri dev
```

### Frontend Debugging

- Use browser dev tools in development
- Tauri provides webview inspector in debug builds

### Backend Debugging

```bash
# Run with full logging
RUST_LOG=cedar_core=debug cargo tauri dev
```

## 📦 Distribution

### macOS

- **App Store**: Use Xcode for submission
- **Direct Distribution**: DMG or PKG installer
- **Homebrew**: Create a cask formula

### Windows

- **Microsoft Store**: Use MSIX packaging
- **Direct Distribution**: MSI installer or portable exe

### Linux

- **Snap**: Create snapcraft.yaml
- **Flatpak**: Create flatpak manifest
- **AppImage**: Use appimagetool

## 🤝 Contributing

1. Follow the existing code style
2. Test on multiple platforms
3. Update documentation for new features
4. Ensure security best practices

## 📄 License

Same as the main Cedar project. 