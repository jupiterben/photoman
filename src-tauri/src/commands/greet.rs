use crate::error::AppResult;

/// Greet command - example command for testing
#[tauri::command]
pub fn greet(name: &str) -> AppResult<String> {
    if name.trim().is_empty() {
        return Err(crate::error::invalid_input("Name cannot be empty"));
    }
    Ok(format!("Hello, {}! Welcome to PhotoMan!", name))
}

