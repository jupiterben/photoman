// Tauri commands module
// This module exports all command handlers

pub mod database;
pub mod greet;
pub mod scan;
pub mod search;
pub mod thumbnail;
pub mod tags;
pub mod recycle;

// Re-export commands for easy access
pub use database::*;
pub use greet::*;
pub use scan::*;
pub use search::*;
pub use thumbnail::*;
pub use tags::*;
pub use recycle::*;

