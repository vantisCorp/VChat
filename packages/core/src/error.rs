//! V-COMM Error Types
//!
//! Comprehensive error handling for the V-COMM platform with detailed error categories
//! and security-focused error messages.

use thiserror::Error;

/// Result type alias for V-COMM operations
pub type VCommResult<T> = Result<T, VCommError>;

/// Main error type for V-COMM
///
/// All errors in V-COMM should use this type for consistent error handling
/// and security-aware error messages.
#[derive(Error, Debug)]
pub enum VCommError {
    /// Cryptographic errors
    #[error("Cryptographic error: {0}")]
    Crypto(String),

    /// Key management errors
    #[error("Key management error: {0}")]
    KeyManagement(String),

    /// Authentication errors
    #[error("Authentication failed: {0}")]
    Authentication(String),

    /// Authorization errors
    #[error("Authorization failed: {0}")]
    Authorization(String),

    /// Network errors
    #[error("Network error: {0}")]
    Network(String),

    /// Protocol errors
    #[error("Protocol error: {0}")]
    Protocol(String),

    /// Serialization errors
    #[error("Serialization error: {0}")]
    Serialization(String),

    /// Storage errors
    #[error("Storage error: {0}")]
    Storage(String),

    /// Configuration errors
    #[error("Configuration error: {0}")]
    Configuration(String),

    /// Validation errors
    #[error("Validation error: {0}")]
    Validation(String),

    /// Rate limiting errors
    #[error("Rate limit exceeded: {0}")]
    RateLimit(String),

    /// Quota exceeded errors
    #[error("Quota exceeded: {0}")]
    QuotaExceeded(String),

    /// Invalid state errors
    #[error("Invalid state: {0}")]
    InvalidState(String),

    /// Not implemented errors
    #[error("Not implemented: {0}")]
    NotImplemented(String),

    /// Internal errors (should not be exposed to users)
    #[error("Internal error: {0}")]
    Internal(String),

    /// IO errors
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON errors
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    /// Base64 errors
    #[error("Base64 error: {0}")]
    Base64(#[from] base64::DecodeError),

    /// UUID errors
    #[error("UUID error: {0}")]
    Uuid(#[from] uuid::Error),

    /// Time errors
    #[error("Time error: {0}")]
    Time(#[from] chrono::ParseError),

    /// UTF-8 errors
    #[error("UTF-8 error: {0}")]
    Utf8(#[from] std::str::Utf8Error),

    /// Anyhow errors (for external library errors)
    #[error("Error: {0}")]
    Anyhow(#[from] anyhow::Error),
}

impl VCommError {
    /// Create a cryptographic error
    pub fn crypto<S: Into<String>>(msg: S) -> Self {
        VCommError::Crypto(msg.into())
    }

    /// Create a key management error
    pub fn key_management<S: Into<String>>(msg: S) -> Self {
        VCommError::KeyManagement(msg.into())
    }

    /// Create an authentication error
    pub fn authentication<S: Into<String>>(msg: S) -> Self {
        VCommError::Authentication(msg.into())
    }

    /// Create an authorization error
    pub fn authorization<S: Into<String>>(msg: S) -> Self {
        VCommError::Authorization(msg.into())
    }

    /// Create a network error
    pub fn network<S: Into<String>>(msg: S) -> Self {
        VCommError::Network(msg.into())
    }

    /// Create a protocol error
    pub fn protocol<S: Into<String>>(msg: S) -> Self {
        VCommError::Protocol(msg.into())
    }

    /// Create a storage error
    pub fn storage<S: Into<String>>(msg: S) -> Self {
        VCommError::Storage(msg.into())
    }

    /// Create a configuration error
    pub fn configuration<S: Into<String>>(msg: S) -> Self {
        VCommError::Configuration(msg.into())
    }

    /// Create a validation error
    pub fn validation<S: Into<String>>(msg: S) -> Self {
        VCommError::Validation(msg.into())
    }

    /// Create a rate limit error
    pub fn rate_limit<S: Into<String>>(msg: S) -> Self {
        VCommError::RateLimit(msg.into())
    }

    /// Create an invalid state error
    pub fn invalid_state<S: Into<String>>(msg: S) -> Self {
        VCommError::InvalidState(msg.into())
    }

    /// Create an internal error
    pub fn internal<S: Into<String>>(msg: S) -> Self {
        VCommError::Internal(msg.into())
    }

    /// Check if error is recoverable
    pub fn is_recoverable(&self) -> bool {
        matches!(
            self,
            VCommError::Network(_)
                | VCommError::RateLimit(_)
                | VCommError::Protocol(_)
                | VCommError::Configuration(_)
        )
    }

    /// Check if error requires user action
    pub fn requires_user_action(&self) -> bool {
        matches!(
            self,
            VCommError::Authentication(_)
                | VCommError::Authorization(_)
                | VCommError::QuotaExceeded(_)
                | VCommError::Validation(_)
        )
    }

    /// Get error code for logging/monitoring
    pub fn error_code(&self) -> &'static str {
        match self {
            VCommError::Crypto(_) => "CRYPTO_ERROR",
            VCommError::KeyManagement(_) => "KEY_ERROR",
            VCommError::Authentication(_) => "AUTH_ERROR",
            VCommError::Authorization(_) => "AUTHZ_ERROR",
            VCommError::Network(_) => "NETWORK_ERROR",
            VCommError::Protocol(_) => "PROTOCOL_ERROR",
            VCommError::Serialization(_) => "SERIALIZATION_ERROR",
            VCommError::Storage(_) => "STORAGE_ERROR",
            VCommError::Configuration(_) => "CONFIG_ERROR",
            VCommError::Validation(_) => "VALIDATION_ERROR",
            VCommError::RateLimit(_) => "RATE_LIMIT_ERROR",
            VCommError::QuotaExceeded(_) => "QUOTA_ERROR",
            VCommError::InvalidState(_) => "STATE_ERROR",
            VCommError::NotImplemented(_) => "NOT_IMPLEMENTED",
            VCommError::Internal(_) => "INTERNAL_ERROR",
            VCommError::Io(_) => "IO_ERROR",
            VCommError::Json(_) => "JSON_ERROR",
            VCommError::Base64(_) => "BASE64_ERROR",
            VCommError::Uuid(_) => "UUID_ERROR",
            VCommError::Time(_) => "TIME_ERROR",
            VCommError::Utf8(_) => "UTF8_ERROR",
            VCommError::Anyhow(_) => "UNKNOWN_ERROR",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_creation() {
        let err = VCommError::authentication("Invalid credentials");
        assert!(matches!(err, VCommError::Authentication(_)));
        assert_eq!(err.error_code(), "AUTH_ERROR");
    }

    #[test]
    fn test_recoverable_errors() {
        assert!(VCommError::network("Connection timeout").is_recoverable());
        assert!(!VCommError::authentication("Invalid").is_recoverable());
    }

    #[test]
    fn test_user_action_required() {
        assert!(VCommError::authentication("Invalid").requires_user_action());
        assert!(!VCommError::network("Timeout").requires_user_action());
    }

    #[test]
    fn test_error_display() {
        let err = VCommError::crypto("Encryption failed");
        let msg = format!("{}", err);
        assert!(msg.contains("Cryptographic"));
        assert!(msg.contains("Encryption failed"));
    }
}
