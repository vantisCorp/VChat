//! V-COMM Identity Management
//!
//! User identity and authentication handling with Zero Trust principles.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// User identity
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Identity {
    /// User ID
    pub user_id: crate::UserId,
    /// Public key (X25519 for encryption)
    pub public_key: String,
    /// Signing key (Ed25519 for signatures)
    pub signing_key: String,
    /// Device info
    pub devices: Vec<DeviceInfo>,
    /// Verification status
    pub verified: bool,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

/// Device information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    /// Device ID
    pub device_id: String,
    /// Device name
    pub device_name: String,
    /// Device type
    pub device_type: DeviceType,
    /// Platform
    pub platform: String,
    /// Last active
    pub last_active: chrono::DateTime<chrono::Utc>,
    /// Is trusted
    pub trusted: bool,
}

/// Device type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DeviceType {
    /// Desktop
    Desktop,
    /// Mobile
    Mobile,
    /// Tablet
    Tablet,
    /// Web
    Web,
    /// Console
    Console,
}

/// Identity provider
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum IdentityProvider {
    /// Email
    Email,
    /// FIDO2/WebAuthn
    Fido2,
    /// GitHub
    Github,
    /// Steam
    Steam,
    /// PlayStation Network
    Psn,
    /// Xbox
    Xbox,
}

impl Identity {
    /// Create a new identity
    pub fn new(user_id: crate::UserId, public_key: String, signing_key: String) -> Self {
        Self {
            user_id,
            public_key,
            signing_key,
            devices: Vec::new(),
            verified: false,
            metadata: HashMap::new(),
        }
    }

    /// Add a device
    pub fn add_device(&mut self, device: DeviceInfo) {
        self.devices.push(device);
    }

    /// Verify identity
    pub fn verify(&mut self) {
        self.verified = true;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_identity_creation() {
        let identity = Identity::new(
            "user123".to_string(),
            "pubkey".to_string(),
            "signkey".to_string(),
        );
        assert_eq!(identity.user_id, "user123");
        assert!(!identity.verified);
    }
}
