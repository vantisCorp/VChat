//! # V-COMM Core Library
//!
//! This is the core Rust library for V-COMM, a next-generation secure communication platform
//! built on Zero Trust architecture with military-grade security standards.
//!
//! ## Architecture
//!
//! - **Zero Trust**: Every request is authenticated and authorized
//! - **End-to-End Encryption**: Signal Protocol for 1:1, MLS for servers
//! - **Post-Quantum Cryptography**: Resistant to quantum computer attacks
//! - **Hardware Security**: Keys stored in secure enclaves
//!
//! ## Features
//!
//! - Signal Protocol for 1:1 encrypted conversations
//! - MLS (Messaging Layer Security) for group chats
//! - Post-Quantum Cryptography (NIST standards)
//! - WebRTC for real-time communication
//! - WASM support for browser environments
//! - Zero-knowledge proof authentication
//! - Duress PIN for emergency situations
//! - Ghost mode for ephemeral messaging
//! - Mesh networking for offline communication
//!
//! ## Security Standards
//!
//! - FIPS 140-3 (Cryptographic Modules)
//! - FedRAMP Authorized (Cloud Security)
//! - OWASP ASVS Level 3 (Application Security)
//! - HIPAA Compliant (Medical Data)
//! - GDPR Compliant (EU Data Protection)
//!
//! ## License
//!
//! AGPL-3.0 for open-source version
//! Commercial license available for enterprise use
//!
//! ## Example
//!
//! ```rust,no_run
//! use vcomm_core::{VCommClient, Config};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     let config = Config::builder()
//!         .server_url("wss://secure.vcomm.dev")
//!         .enable_mls(true)
//!         .enable_pqc(true)
//!         .build()?;
//!
//!     let client = VCommClient::new(config).await?;
//!
//!     client.connect().await?;
//!
//!     Ok(())
//! }
//! ```

#![deny(
    warnings,
    missing_docs,
    missing_debug_implementations,
    missing_copy_implementations,
    trivial_casts,
    trivial_numeric_casts,
    unsafe_code,
    unstable_features,
    unused_import_braces,
    unused_qualifications,
    unused_extern_crates
)]
#![warn(clippy::all, clippy::pedantic)]
#![cfg_attr(docsrs, feature(doc_cfg))]

// Public API modules
pub mod client;
pub mod config;
pub mod crypto;
pub mod error;
pub mod identity;
pub mod messaging;
pub mod networking;
pub mod protocols;
pub mod security;
pub mod storage;
pub mod types;
pub mod utils;

// Re-export common types
pub use client::VCommClient;
pub use config::Config;
pub use error::{VCommError, VCommResult};
pub use identity::Identity;
pub use types::*;

/// V-COMM version information
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const NAME: &str = env!("CARGO_PKG_NAME");

/// Initialize V-COMM core library
///
/// This function sets up logging, panic handlers, and other global state.
/// It must be called before using any other V-COMM functionality.
///
/// # Example
///
/// ```rust,no_run
/// use vcomm_core::init;
///
/// init();
/// // Now you can use V-COMM
/// ```
pub fn init() {
    // Set up global panic handler
    std::panic::set_hook(Box::new(|panic_info| {
        let backtrace = std::backtrace::Backtrace::new();
        tracing::error!(
            panic = ?panic_info,
            backtrace = %backtrace,
            "V-COMM panic occurred"
        );
        
        // In production, we might want to securely wipe memory
        // before panicking to prevent data leaks
        #[cfg(feature = "telemetry")]
        {
            if let Some(location) = panic_info.location() {
                sentry::capture_event(
                    sentry::protocol::Event {
                        level: sentry::Level::Fatal,
                        message: Some(panic_info.to_string()),
                        extra: {
                            let mut map = std::collections::HashMap::new();
                            map.insert("file".to_string(), location.file().to_string());
                            map.insert("line".to_string(), location.line().to_string());
                            map.insert("column".to_string(), location.column().to_string());
                            map.insert("backtrace".to_string(), backtrace.to_string());
                            map
                        },
                        ..Default::default()
                    }
                );
            }
        }
    }));

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive(tracing::Level::INFO.into())
                .add_directive("vcomm_core=debug".parse().unwrap())
        )
        .with_target(true)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .init();

    tracing::info!("V-COMM Core v{} initialized", VERSION);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        assert!(!VERSION.is_empty());
        assert_eq!(NAME, "vcomm-core");
    }

    #[test]
    fn test_init() {
        init();
        // If we reach here, init() didn't panic
        assert!(true);
    }
}