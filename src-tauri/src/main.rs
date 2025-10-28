// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;
mod error;
mod state;
mod scanner;
mod search;
mod thumbnail;

use database::{Database, migrations};
use state::AppState;
use tauri::Manager;

fn main() {
    env_logger::init();
    log::info!("Starting PhotoMan application");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
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
            commands::get_database_info,
            commands::scan_folder,
            commands::generate_thumbnail,
            commands::generate_thumbnails_batch,
            commands::cleanup_thumbnail_cache,
            commands::get_thumbnail_cache_size,
            commands::create_tag,
            commands::get_all_tags,
            commands::search_tags,
            commands::get_most_used_tags,
            commands::update_tag,
            commands::delete_tag,
            commands::get_tag_stats,
            commands::add_tag_to_photo,
            commands::add_tag_to_photos,
            commands::remove_tag_from_photo,
            commands::remove_tag_from_photos,
            commands::get_photo_tags,
            commands::get_photos_by_tag,
            commands::get_photos_by_any_tags,
            commands::get_photos_by_all_tags,
            commands::search_photos,
            commands::quick_search_photos,
            commands::soft_delete_photos,
            commands::restore_photos,
            commands::permanently_delete_photos,
            commands::get_recycle_bin_photos,
            commands::clean_expired_recycle_bin,
            commands::empty_recycle_bin,
            commands::get_recycle_bin_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

