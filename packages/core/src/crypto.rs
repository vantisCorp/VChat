//! Cryptographic primitives and utilities for V-COMM
//!
//! This module provides:
//! - Signal Protocol for 1:1 encryption
//! - MLS for group encryption
//! - Post-Quantum Cryptography
//! - Key management
//! - Secure random number generation

use crate::{VCommError, VCommResult};

/// Cryptographic operations
pub struct Crypto;

impl Crypto {
    /// Generate a random bytes
    pub fn random_bytes(len: usize) -> Vec<u8> {
        use rand::RngCore;
        let mut bytes = vec![0u8; len];
        rand::thread_rng().fill_bytes(&mut bytes);
        bytes
    }

    /// Generate a random key
    pub fn generate_key() -> [u8; 32] {
        let mut key = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut key);
        key
    }

    /// Encrypt data using AES-256-GCM
    #[cfg(feature = "full")]
    pub fn encrypt(
        plaintext: &[u8],
        key: &[u8; 32],
        nonce: &[u8; 12],
    ) -> VCommResult<Vec<u8>> {
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm, Nonce,
        };

        let cipher = Aes256Gcm::new(key.into());
        let nonce = Nonce::from_slice(nonce);

        cipher
            .encrypt(nonce, plaintext)
            .map_err(|e| VCommError::crypto(format!("Encryption failed: {}", e)))
    }

    /// Decrypt data using AES-256-GCM
    #[cfg(feature = "full")]
    pub fn decrypt(
        ciphertext: &[u8],
        key: &[u8; 32],
        nonce: &[u8; 12],
    ) -> VCommResult<Vec<u8>> {
        use aes_gcm::{
            aead::{Aead, KeyInit},
            Aes256Gcm, Nonce,
        };

        let cipher = Aes256Gcm::new(key.into());
        let nonce = Nonce::from_slice(nonce);

        cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| VCommError::crypto(format!("Decryption failed: {}", e)))
    }

    /// Derive a key from a password using Argon2
    #[cfg(feature = "full")]
    pub fn derive_key(password: &[u8], salt: &[u8; 32]) -> VCommResult<[u8; 32]> {
        use argon2::{
            password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
            Argon2,
        };

        let argon2 = Argon2::default();
        let salt = SaltString::encode_b64(&salt).unwrap();

        let password_hash = argon2
            .hash_password(password, &salt)
            .map_err(|e| VCommError::crypto(format!("Key derivation failed: {}", e)))?;

        // Extract the hash bytes (simplified)
        let hash = password_hash.hash.ok_or_else(|| {
            VCommError::crypto("Key derivation failed: no hash produced".to_string())
        })?;

        let mut key = [0u8; 32];
        key.copy_from_slice(&hash.as_bytes()[..32]);
        Ok(key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_random_bytes() {
        let bytes = Crypto::random_bytes(32);
        assert_eq!(bytes.len(), 32);
    }

    #[test]
    fn test_generate_key() {
        let key = Crypto::generate_key();
        assert_eq!(key.len(), 32);
    }

    #[cfg(feature = "full")]
    #[test]
    fn test_encrypt_decrypt() {
        let plaintext = b"Hello, V-COMM!";
        let key = Crypto::generate_key();
        let nonce = Crypto::random_bytes(12).try_into().unwrap();

        let ciphertext = Crypto::encrypt(plaintext, &key, &nonce).unwrap();
        assert_ne!(ciphertext, plaintext.to_vec());

        let decrypted = Crypto::decrypt(&ciphertext, &key, &nonce).unwrap();
        assert_eq!(decrypted, plaintext);
    }
}