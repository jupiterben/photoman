// Database module
// This module handles all database operations

pub mod connection;
pub mod migrations;
pub mod models;

pub use connection::Database;

