/// Database health check command
use crate::error::{AppError, AppResult};
use crate::state::AppState;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseInfo {
    pub initialized: bool,
    pub schema_version: i32,
    pub path: String,
}

#[tauri::command]
pub fn get_database_info(state: tauri::State<AppState>) -> AppResult<DatabaseInfo> {
    let db = state.get_db();
    
    let initialized = db.is_initialized()?;
    let schema_version = db.get_schema_version()?;
    let path = db.get_path().to_string_lossy().to_string();
    
    Ok(DatabaseInfo {
        initialized,
        schema_version,
        path,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_database_info_structure() {
        let info = DatabaseInfo {
            initialized: true,
            schema_version: 1,
            path: "/path/to/db".to_string(),
        };
        
        assert_eq!(info.initialized, true);
        assert_eq!(info.schema_version, 1);
    }
}

