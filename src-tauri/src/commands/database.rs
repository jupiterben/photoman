/// Database health check command
use crate::error::AppResult;
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
    let conn = state.db.lock().unwrap();
    
    // Check if photos table exists
    let initialized: bool = {
        let count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='photos'",
            [],
            |row| row.get(0),
        )?;
        count > 0
    };
    
    // Get schema version
    let schema_version: i32 = {
        let table_exists: i64 = conn.query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
            [],
            |row| row.get(0),
        )?;

        if table_exists == 0 {
            0
        } else {
            match conn.query_row(
                "SELECT MAX(version) FROM schema_migrations",
                [],
                |row| row.get(0),
            ) {
                Ok(v) => v,
                Err(rusqlite::Error::QueryReturnedNoRows) => 0,
                Err(e) => return Err(e.into()),
            }
        }
    };
    
    let path = state.db_path.to_string_lossy().to_string();
    
    Ok(DatabaseInfo {
        initialized,
        schema_version,
        path,
    })
}

