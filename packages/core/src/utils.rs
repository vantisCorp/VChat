//! Utility functions for V-COMM
//!
//! Common utility functions and helpers.

use std::time::{SystemTime, UNIX_EPOCH};

/// Utility functions
pub struct Utils;

impl Utils {
    /// Get current timestamp in milliseconds
    pub fn current_timestamp_ms() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64
    }

    /// Get current timestamp in seconds
    pub fn current_timestamp_sec() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs()
    }

    /// Generate a unique ID
    pub fn generate_id() -> String {
        uuid::Uuid::new_v4().to_string()
    }

    /// Convert bytes to hex string
    pub fn bytes_to_hex(bytes: &[u8]) -> String {
        hex::encode(bytes)
    }

    /// Convert hex string to bytes
    pub fn hex_to_bytes(hex: &str) -> Result<Vec<u8>, hex::FromHexError> {
        hex::decode(hex)
    }

    /// Convert bytes to base64 string
    pub fn bytes_to_base64(bytes: &[u8]) -> String {
        base64::encode(bytes)
    }

    /// Convert base64 string to bytes
    pub fn base64_to_bytes(base64: &str) -> Result<Vec<u8>, base64::DecodeError> {
        base64::decode(base64)
    }

    /// Validate email format
    pub fn is_valid_email(email: &str) -> bool {
        // Simple email validation
        email.contains('@') && email.contains('.')
    }

    /// Validate username format
    pub fn is_valid_username(username: &str) -> bool {
        // Username validation: 3-32 chars, alphanumeric, underscores, hyphens
        let len = username.len();
        len >= 3 && len <= 32 && username.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-')
    }

    /// Sleep for specified duration
    pub async fn sleep_ms(ms: u64) {
        tokio::time::sleep(tokio::time::Duration::from_millis(ms)).await;
    }

    /// Retry a function with exponential backoff
    pub async fn retry_with_backoff<F, Fut, T, E>(
        mut func: F,
        max_attempts: u32,
        initial_delay_ms: u64,
    ) -> Result<T, E>
    where
        F: FnMut() -> Fut,
        Fut: std::future::Future<Output = Result<T, E>>,
    {
        let mut delay = initial_delay_ms;

        for attempt in 1..=max_attempts {
            match func().await {
                Ok(result) => return Ok(result),
                Err(e) if attempt < max_attempts => {
                    tracing::warn!("Attempt {} failed, retrying in {}ms", attempt, delay);
                    Self::sleep_ms(delay).await;
                    delay *= 2;
                }
                Err(e) => return Err(e),
            }
        }

        unreachable!()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_id() {
        let id1 = Utils::generate_id();
        let id2 = Utils::generate_id();
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_bytes_to_hex() {
        let bytes = vec![0x01, 0x02, 0x03];
        let hex = Utils::bytes_to_hex(&bytes);
        assert_eq!(hex, "010203");
    }

    #[test]
    fn test_hex_to_bytes() {
        let hex = "010203";
        let bytes = Utils::hex_to_bytes(hex).unwrap();
        assert_eq!(bytes, vec![0x01, 0x02, 0x03]);
    }

    #[test]
    fn test_is_valid_email() {
        assert!(Utils::is_valid_email("test@example.com"));
        assert!(!Utils::is_valid_email("invalid"));
    }

    #[test]
    fn test_is_valid_username() {
        assert!(Utils::is_valid_username("test_user"));
        assert!(Utils::is_valid_username("test-user"));
        assert!(!Utils::is_valid_username("a")); // Too short
        assert!(!Utils::is_valid_username("a".repeat(33).as_str())); // Too long
    }
}