// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;
mod error;
mod state;

use database::{Database, migrations};
use state::AppState;
use tauri::Manager;

fn main() {
    env_logger::init();
    log::info!("Starting PhotoMan application");

    tauri::Builder::default()
        .setup(|app| {
            // Get app data directory
            let app_dir = app.path().app_data_dir()
                .expect("Failed to get app data directory");
            
            log::info!("App data directory: {:?}", app_dir);
            
            // Create database path
            let mut db_path = app_dir.clone();
            db_path.push("photoman.db");
            
            // Initialize database
            let db = Database::new(db_path.clone())
                .expect("Failed to initialize database");
            
            log::info!("Database initialized at: {:?}", db_path);
            
            // Run migrations
            let conn = db.get_connection();
            let conn = conn.lock().unwrap();
            migrations::run_migrations(&conn)
                .expect("Failed to run database migrations");
            drop(conn);
            
            log::info!("Database migrations completed");
            
            // Store database in app state
            app.manage(AppState::new(db));
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_database_info
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

