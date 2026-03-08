//! Core Types for V-COMM
//!
//! Fundamental data types used throughout the V-COMM platform.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// User ID (cryptographically random)
pub type UserId = String;

/// Server ID
pub type ServerId = String;

/// Channel ID
pub type ChannelId = String;

/// Message ID
pub type MessageId = String;

/// Session ID
pub type SessionId = String;

/// User role in a server
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    /// Regular user
    User,
    /// Moderator
    Moderator,
    /// Administrator
    Admin,
    /// Server owner
    Owner,
}

impl UserRole {
    /// Check if role has moderation permissions
    pub fn can_moderate(&self) -> bool {
        matches!(self, UserRole::Moderator | UserRole::Admin | UserRole::Owner)
    }

    /// Check if role has administrative permissions
    pub fn is_admin(&self) -> bool {
        matches!(self, UserRole::Admin | UserRole::Owner)
    }

    /// Check if role is owner
    pub fn is_owner(&self) -> bool {
        matches!(self, UserRole::Owner)
    }
}

/// Channel type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ChannelType {
    /// Text channel (V-TXT)
    Text,
    /// Voice channel (V-ROOM)
    Voice,
    /// Feedback channel (V-FEEDBACK)
    Feedback,
    /// Forum channel (V-FORUM)
    Forum,
    /// Announcement channel (V-ANNOUNCE)
    Announcement,
}

/// Message type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MessageType {
    /// Regular message
    Text,
    /// Image message
    Image,
    /// Video message
    Video,
    /// Audio message
    Audio,
    /// File attachment
    File,
    /// System message
    System,
    /// Encrypted message
    Encrypted,
}

/// Encryption level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EncryptionLevel {
    /// No encryption (development only)
    None,
    /// Transport layer encryption (TLS)
    Transport,
    /// End-to-end encryption (Signal)
    Signal,
    /// Group encryption (MLS)
    Mls,
    /// Post-quantum encryption
    PostQuantum,
}

/// Connection status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConnectionStatus {
    /// Disconnected
    Disconnected,
    /// Connecting
    Connecting,
    /// Connected
    Connected,
    /// Reconnecting
    Reconnecting,
    /// Connection failed
    Failed,
}

/// User presence status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PresenceStatus {
    /// Online
    Online,
    /// Away
    Away,
    /// Do not disturb
    DoNotDisturb,
    /// Invisible
    Invisible,
    /// Offline
    Offline,
}

/// Message flags
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct MessageFlags {
    /// Message is edited
    pub edited: bool,
    /// Message is pinned
    pub pinned: bool,
    /// Message is a reply
    pub is_reply: bool,
    /// Message contains mentions
    pub has_mentions: bool,
}

impl Default for MessageFlags {
    fn default() -> Self {
        Self {
            edited: false,
            pinned: false,
            is_reply: false,
            has_mentions: false,
        }
    }
}

/// User profile information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    /// User ID
    pub user_id: UserId,
    /// Username
    pub username: String,
    /// Display name
    pub display_name: Option<String>,
    /// Avatar URL
    pub avatar_url: Option<String>,
    /// Bio
    pub bio: Option<String>,
    /// Custom status
    pub status: Option<String>,
    /// Presence status
    pub presence: PresenceStatus,
    /// Roles (server-specific)
    pub roles: HashMap<ServerId, UserRole>,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

impl UserProfile {
    /// Create a new user profile
    pub fn new(user_id: UserId, username: String) -> Self {
        Self {
            user_id,
            username,
            display_name: None,
            avatar_url: None,
            bio: None,
            status: None,
            presence: PresenceStatus::Offline,
            roles: HashMap::new(),
            metadata: HashMap::new(),
        }
    }

    /// Get user's role in a specific server
    pub fn role_in_server(&self, server_id: &ServerId) -> Option<UserRole> {
        self.roles.get(server_id).copied()
    }

    /// Set user's role in a specific server
    pub fn set_role(&mut self, server_id: ServerId, role: UserRole) {
        self.roles.insert(server_id, role);
    }
}

/// Server information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerInfo {
    /// Server ID
    pub server_id: ServerId,
    /// Server name
    pub name: String,
    /// Description
    pub description: Option<String>,
    /// Icon URL
    pub icon_url: Option<String>,
    /// Owner ID
    pub owner_id: UserId,
    /// Member count
    pub member_count: usize,
    /// Encryption level
    pub encryption_level: EncryptionLevel,
    /// Verification level
    pub verification_level: VerificationLevel,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

impl ServerInfo {
    /// Create a new server
    pub fn new(server_id: ServerId, name: String, owner_id: UserId) -> Self {
        Self {
            server_id,
            name,
            description: None,
            icon_url: None,
            owner_id,
            member_count: 1,
            encryption_level: EncryptionLevel::PostQuantum,
            verification_level: VerificationLevel::High,
            metadata: HashMap::new(),
        }
    }
}

/// Channel information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelInfo {
    /// Channel ID
    pub channel_id: ChannelId,
    /// Server ID
    pub server_id: ServerId,
    /// Channel name
    pub name: String,
    /// Channel type
    pub channel_type: ChannelType,
    /// Topic
    pub topic: Option<String>,
    /// Position (ordering)
    pub position: i32,
    /// Permission overwrites
    pub permission_overwrites: HashMap<UserId, Vec<String>>,
    /// Is NSFW
    pub nsfw: bool,
}

impl ChannelInfo {
    /// Create a new channel
    pub fn new(
        channel_id: ChannelId,
        server_id: ServerId,
        name: String,
        channel_type: ChannelType,
    ) -> Self {
        Self {
            channel_id,
            server_id,
            name,
            channel_type,
            topic: None,
            position: 0,
            permission_overwrites: HashMap::new(),
            nsfw: false,
        }
    }
}

/// Message information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    /// Message ID
    pub message_id: MessageId,
    /// Channel ID
    pub channel_id: ChannelId,
    /// Author ID
    pub author_id: UserId,
    /// Content
    pub content: String,
    /// Message type
    pub message_type: MessageType,
    /// Timestamp
    pub timestamp: chrono::DateTime<chrono::Utc>,
    /// Edited timestamp
    pub edited_timestamp: Option<chrono::DateTime<chrono::Utc>>,
    /// Reply to message
    pub reply_to: Option<MessageId>,
    /// Attachments
    pub attachments: Vec<Attachment>,
    /// Embeds
    pub embeds: Vec<Embed>,
    /// Flags
    pub flags: MessageFlags,
    /// Metadata
    pub metadata: HashMap<String, String>,
}

impl Message {
    /// Create a new message
    pub fn new(
        message_id: MessageId,
        channel_id: ChannelId,
        author_id: UserId,
        content: String,
    ) -> Self {
        Self {
            message_id,
            channel_id,
            author_id,
            content,
            message_type: MessageType::Text,
            timestamp: chrono::Utc::now(),
            edited_timestamp: None,
            reply_to: None,
            attachments: Vec::new(),
            embeds: Vec::new(),
            flags: MessageFlags::default(),
            metadata: HashMap::new(),
        }
    }

    /// Check if message is encrypted
    pub fn is_encrypted(&self) -> bool {
        self.message_type == MessageType::Encrypted
    }
}

/// File attachment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    /// Attachment ID
    pub id: String,
    /// Filename
    pub filename: String,
    /// URL
    pub url: String,
    /// Size in bytes
    pub size: u64,
    /// MIME type
    pub content_type: String,
    /// Width (for images/videos)
    pub width: Option<u32>,
    /// Height (for images/videos)
    pub height: Option<u32>,
    /// Is ephemeral
    pub ephemeral: bool,
}

/// Rich embed
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Embed {
    /// Title
    pub title: Option<String>,
    /// Description
    pub description: Option<String>,
    /// URL
    pub url: Option<String>,
    /// Thumbnail URL
    pub thumbnail_url: Option<String>,
    /// Image URL
    pub image_url: Option<String>,
    /// Color (hex)
    pub color: Option<String>,
    /// Footer text
    pub footer: Option<String>,
    /// Timestamp
    pub timestamp: Option<chrono::DateTime<chrono::Utc>>,
}

/// Verification level
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum VerificationLevel {
    /// None
    None,
    /// Low
    Low,
    /// Medium
    Medium,
    /// High
    High,
    /// Very High
    VeryHigh,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_profile_creation() {
        let profile = UserProfile::new("user123".to_string(), "testuser".to_string());
        assert_eq!(profile.user_id, "user123");
        assert_eq!(profile.username, "testuser");
        assert_eq!(profile.presence, PresenceStatus::Offline);
    }

    #[test]
    fn test_user_role_permissions() {
        assert!(UserRole::Admin.can_moderate());
        assert!(UserRole::Moderator.can_moderate());
        assert!(!UserRole::User.can_moderate());

        assert!(UserRole::Owner.is_admin());
        assert!(UserRole::Admin.is_admin());
        assert!(!UserRole::Moderator.is_admin());
    }

    #[test]
    fn test_message_creation() {
        let message = Message::new(
            "msg123".to_string(),
            "channel123".to_string(),
            "user123".to_string(),
            "Hello, world!".to_string(),
        );
        assert_eq!(message.message_id, "msg123");
        assert_eq!(message.content, "Hello, world!");
        assert_eq!(message.message_type, MessageType::Text);
    }

    #[test]
    fn test_server_creation() {
        let server = ServerInfo::new(
            "server123".to_string(),
            "Test Server".to_string(),
            "user123".to_string(),
        );
        assert_eq!(server.server_id, "server123");
        assert_eq!(server.name, "Test Server");
        assert_eq!(server.owner_id, "user123");
        assert_eq!(server.member_count, 1);
    }
}