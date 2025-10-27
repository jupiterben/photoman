// Error types for PhotoMan application
use serde::{Deserialize, Serialize};

/// Application-wide error type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppError {
    pub code: ErrorCode,
    pub message: String,
    pub details: Option<String>,
}

/// Error codes for different error types
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    // Database errors
    DatabaseError,
    DatabaseConnectionError,
    DatabaseMigrationError,
    DatabaseQueryError,
    
    // File system errors
    FileNotFound,
    FileAccessDenied,
    FileReadError,
    FileWriteError,
    InvalidFilePath,
    
    // Image processing errors
    ImageProcessingError,
    InvalidImageFormat,
    ThumbnailGenerationError,
    
    // EXIF errors
    ExifParsingError,
    ExifReadError,
    
    // Validation errors
    ValidationError,
    InvalidInput,
    DuplicateEntry,
    
    // Scan errors
    ScanError,
    ScanCancelled,
    
    // General errors
    InternalError,
    UnknownError,
}

impl AppError {
    /// Create a new AppError
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: None,
        }
    }

    /// Create a new AppError with details
    pub fn with_details(code: ErrorCode, message: impl Into<String>, details: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: Some(details.into()),
        }
    }

    /// Convert to a JSON string for Tauri commands
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|_| {
            format!(r#"{{"code":"UNKNOWN_ERROR","message":"{}"}}"#, self.message)
        })
    }
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if let Some(details) = &self.details {
            write!(f, "{:?}: {} ({})", self.code, self.message, details)
        } else {
            write!(f, "{:?}: {}", self.code, self.message)
        }
    }
}

impl std::error::Error for AppError {}

// Conversions from common error types

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::with_details(
            ErrorCode::DatabaseError,
            "Database operation failed",
            err.to_string(),
        )
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        use std::io::ErrorKind;
        
        let code = match err.kind() {
            ErrorKind::NotFound => ErrorCode::FileNotFound,
            ErrorKind::PermissionDenied => ErrorCode::FileAccessDenied,
            _ => ErrorCode::FileReadError,
        };
        
        AppError::with_details(
            code,
            "File operation failed",
            err.to_string(),
        )
    }
}

impl From<image::ImageError> for AppError {
    fn from(err: image::ImageError) -> Self {
        AppError::with_details(
            ErrorCode::ImageProcessingError,
            "Image processing failed",
            err.to_string(),
        )
    }
}

impl From<String> for AppError {
    fn from(err: String) -> Self {
        AppError::new(ErrorCode::UnknownError, err)
    }
}

impl From<&str> for AppError {
    fn from(err: &str) -> Self {
        AppError::new(ErrorCode::UnknownError, err)
    }
}

/// Result type alias for PhotoMan operations
pub type AppResult<T> = std::result::Result<T, AppError>;

/// Alias for AppError (for consistency across codebase)
pub type PhotoManError = AppError;

/// Alias for Result type (for consistency across codebase)
pub type Result<T> = std::result::Result<T, AppError>;

// Helper functions for common error scenarios

/// Create a database error
pub fn db_error(message: impl Into<String>) -> AppError {
    AppError::new(ErrorCode::DatabaseError, message)
}

/// Create a file not found error
pub fn file_not_found(path: impl Into<String>) -> AppError {
    AppError::new(ErrorCode::FileNotFound, format!("File not found: {}", path.into()))
}

/// Create a validation error
pub fn validation_error(message: impl Into<String>) -> AppError {
    AppError::new(ErrorCode::ValidationError, message)
}

/// Create an invalid input error
pub fn invalid_input(message: impl Into<String>) -> AppError {
    AppError::new(ErrorCode::InvalidInput, message)
}

impl AppError {
    /// Create a database error
    pub fn database_error(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::DatabaseError, message)
    }
    
    /// Create an IO error
    pub fn io_error(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::FileReadError, message)
    }
    
    /// Create an image error
    pub fn image_error(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::ImageProcessingError, message)
    }
    
    /// Create an invalid path error
    pub fn invalid_path(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::InvalidFilePath, message)
    }
    
    /// Create a Tauri error
    pub fn tauri_error(message: impl Into<String>) -> Self {
        Self::new(ErrorCode::InternalError, message)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_error_creation() {
        let error = AppError::new(ErrorCode::DatabaseError, "Test error");
        assert_eq!(error.message, "Test error");
        assert!(error.details.is_none());
    }

    #[test]
    fn test_app_error_with_details() {
        let error = AppError::with_details(
            ErrorCode::FileNotFound,
            "File missing",
            "Path: /test/file.jpg",
        );
        assert_eq!(error.message, "File missing");
        assert_eq!(error.details.unwrap(), "Path: /test/file.jpg");
    }

    #[test]
    fn test_error_display() {
        let error = AppError::new(ErrorCode::ValidationError, "Invalid data");
        let display = format!("{}", error);
        assert!(display.contains("ValidationError"));
        assert!(display.contains("Invalid data"));
    }

    #[test]
    fn test_error_to_json() {
        let error = AppError::new(ErrorCode::DatabaseError, "DB error");
        let json = error.to_json();
        assert!(json.contains("DATABASE_ERROR"));
        assert!(json.contains("DB error"));
    }

    #[test]
    fn test_rusqlite_error_conversion() {
        let sqlite_err = rusqlite::Error::InvalidQuery;
        let app_err: AppError = sqlite_err.into();
        assert!(matches!(app_err.code, ErrorCode::DatabaseError));
    }

    #[test]
    fn test_io_error_conversion() {
        let io_err = std::io::Error::new(std::io::ErrorKind::NotFound, "not found");
        let app_err: AppError = io_err.into();
        assert!(matches!(app_err.code, ErrorCode::FileNotFound));
    }

    #[test]
    fn test_helper_functions() {
        let err1 = db_error("Database issue");
        assert!(matches!(err1.code, ErrorCode::DatabaseError));

        let err2 = file_not_found("/path/to/file");
        assert!(matches!(err2.code, ErrorCode::FileNotFound));

        let err3 = validation_error("Invalid field");
        assert!(matches!(err3.code, ErrorCode::ValidationError));

        let err4 = invalid_input("Bad parameter");
        assert!(matches!(err4.code, ErrorCode::InvalidInput));
    }
}

