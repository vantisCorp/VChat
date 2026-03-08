//! V-COMM Client
//!
//! Main client interface for V-COMM secure communication platform.

use crate::{Config, VCommError, VCommResult};
use std::sync::Arc;
use tokio::sync::RwLock;

/// V-COMM client
pub struct VCommClient {
    config: Config,
    state: Arc<RwLock<ClientState>>,
    // More fields will be added as we implement features
}

/// Client state
#[derive(Debug, Default)]
struct ClientState {
    connected: bool,
    authenticated: bool,
    // More state fields will be added
}

impl VCommClient {
    /// Create a new V-COMM client
    pub async fn new(config: Config) -> VCommResult<Self> {
        tracing::info!("Creating V-COMM client with config: {:?}", config);

        Ok(Self {
            config,
            state: Arc::new(RwLock::new(ClientState::default())),
        })
    }

    /// Connect to the V-COMM server
    pub async fn connect(&self) -> VCommResult<()> {
        tracing::info!("Connecting to {}", self.config.server_url);

        // Connection logic will be implemented
        let mut state = self.state.write().await;
        state.connected = true;

        tracing::info!("Connected successfully");
        Ok(())
    }

    /// Disconnect from the server
    pub async fn disconnect(&self) -> VCommResult<()> {
        tracing::info!("Disconnecting");

        let mut state = self.state.write().await;
        state.connected = false;
        state.authenticated = false;

        tracing::info!("Disconnected successfully");
        Ok(())
    }

    /// Check if connected
    pub async fn is_connected(&self) -> bool {
        self.state.read().await.connected
    }

    /// Check if authenticated
    pub async fn is_authenticated(&self) -> bool {
        self.state.read().await.authenticated
    }

    /// Get client configuration
    pub fn config(&self) -> &Config {
        &self.config
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_client_creation() {
        let config = Config::default();
        let client = VCommClient::new(config).await.unwrap();
        assert!(!client.is_connected().await);
    }

    #[tokio::test]
    async fn test_client_connect() {
        let config = Config::default();
        let client = VCommClient::new(config).await.unwrap();
        client.connect().await.unwrap();
        assert!(client.is_connected().await);
    }
}
