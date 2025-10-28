// Database module
// This module handles all database operations

pub mod connection;
pub mod migrations;
pub mod models;
pub mod photos;
pub mod scan_jobs;
pub mod tags;
pub mod photo_tags;
pub mod watched_directories;

pub use connection::Database;

