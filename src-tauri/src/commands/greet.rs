use crate::error::AppResult;

/// Greet command - example command for testing
#[tauri::command]
pub fn greet(name: &str) -> AppResult<String> {
    if name.trim().is_empty() {
        return Err(crate::error::invalid_input("Name cannot be empty"));
    }
    Ok(format!("Hello, {}! Welcome to PhotoMan!", name))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet() {
        let result = greet("Test");
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Hello, Test! Welcome to PhotoMan!");
    }

    #[test]
    fn test_greet_empty_name() {
        let result = greet("");
        assert!(result.is_err());
    }
}

