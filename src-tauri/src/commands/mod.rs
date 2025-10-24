// Tauri commands module
// This module exports all command handlers

pub mod database;
pub mod greet;

// Re-export commands for easy access
pub use database::*;
pub use greet::*;

