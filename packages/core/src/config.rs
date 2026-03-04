//! V-COMM Configuration
//!
//! Configuration management for V-COMM client and server.

use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Main configuration for V-COMM
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Server URL
    pub server_url: String,
    /// Enable MLS (Messaging Layer Security)
    pub enable_mls: bool,
    /// Enable Post-Quantum Cryptography
    pub enable_pqc: bool,
    /// Enable WebRTC
    pub enable_webrtc: bool,
    /// Enable mesh networking
    pub enable_mesh: bool,
    /// Enable ghost mode
    pub enable_ghost_mode: bool,
    /// Connection timeout
    pub connection_timeout: Duration,
    /// Keep-alive interval
    pub keep_alive_interval: Duration,
    /// Maximum retry attempts
    pub max_retry_attempts: u32,
    /// Log level
    pub log_level: String,
    /// Custom metadata
    pub metadata: std::collections::HashMap<String, String>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server_url: "wss://secure.vcomm.dev".to_string(),
            enable_mls: true,
            enable_pqc: true,
            enable_webrtc: true,
            enable_mesh: true,
            enable_ghost_mode: false,
            connection_timeout: Duration::from_secs(30),
            keep_alive_interval: Duration::from_secs(60),
            max_retry_attempts: 3,
            log_level: "info".to_string(),
            metadata: std::collections::HashMap::new(),
        }
    }
}

/// Configuration builder
#[derive(Debug, Clone)]
pub struct ConfigBuilder {
    config: Config,
}

impl Default for ConfigBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl ConfigBuilder {
    /// Create a new configuration builder
    pub fn new() -> Self {
        Self {
            config: Config::default(),
        }
    }

    /// Set server URL
    pub fn server_url(mut self, url: impl Into<String>) -> Self {
        self.config.server_url = url.into();
        self
    }

    /// Enable MLS
    pub fn enable_mls(mut self, enable: bool) -> Self {
        self.config.enable_mls = enable;
        self
    }

    /// Enable PQC
    pub fn enable_pqc(mut self, enable: bool) -> Self {
        self.config.enable_pqc = enable;
        self
    }

    /// Enable WebRTC
    pub fn enable_webrtc(mut self, enable: bool) -> Self {
        self.config.enable_webrtc = enable;
        self
    }

    /// Enable mesh networking
    pub fn enable_mesh(mut self, enable: bool) -> Self {
        self.config.enable_mesh = enable;
        self
    }

    /// Enable ghost mode
    pub fn enable_ghost_mode(mut self, enable: bool) -> Self {
        self.config.enable_ghost_mode = enable;
        self
    }

    /// Set connection timeout
    pub fn connection_timeout(mut self, timeout: Duration) -> Self {
        self.config.connection_timeout = timeout;
        self
    }

    /// Build the configuration
    pub fn build(self) -> crate::VCommResult<Config> {
        Ok(self.config)
    }
}