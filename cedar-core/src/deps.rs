// src/deps.rs
use regex::Regex;
use std::process::Command;

/// Parses stderr for import-related errors and attempts to install missing packages.
/// Returns: Ok(package_installed) or Err(error_message)
pub fn auto_install_if_missing(stderr: &str) -> Result<Option<String>, String> {
    if let Some(pkg) = parse_missing_module(stderr) {
        println!("📦 Auto-installing missing package: {}", pkg);
        install_package(&pkg)?;
        Ok(Some(pkg))
    } else {
        Ok(None)
    }
}

/// Attempts to install a package via `pip install <pkg>`
fn install_package(pkg: &str) -> Result<(), String> {
    let output = Command::new("python3")
        .arg("-m")
        .arg("pip")
        .arg("install")
        .arg("--break-system-packages")
        .arg(pkg)
        .output()
        .map_err(|e| format!("Failed to run pip: {}", e))?;

    if output.status.success() {
        Ok(())
    } else {
        let error_msg = String::from_utf8_lossy(&output.stderr).to_string();
        Err(format!("Failed to install {}: {}", pkg, error_msg))
    }
}

/// Extracts missing package name from ModuleNotFoundError or ImportError messages
fn parse_missing_module(stderr: &str) -> Option<String> {
    // Match: ModuleNotFoundError: No module named 'pandas'
    let re_1 = Regex::new(r#"No module named ['"]([^'"]+)['"]"#).ok()?;

    // Match: ImportError: cannot import name 'X' from 'Y'
    let re_2 = Regex::new(r#"cannot import name ['"].+['"] from ['"]([^'"]+)['"]"#).ok()?;

    if let Some(caps) = re_1.captures(stderr) {
        return Some(caps.get(1)?.as_str().to_string());
    }

    if let Some(caps) = re_2.captures(stderr) {
        return Some(caps.get(1)?.as_str().to_string());
    }

    None
}
