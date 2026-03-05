---
sidebar_position: 5
title: Files API
description: REST API endpoints for file upload, management, and sharing
keywords: [files, REST API, upload, storage, sharing]
tags: [api, files, rest]
---

# Files API

The Files API provides endpoints for uploading, managing, and sharing files through V-COMM Drive. All files are encrypted at rest and in transit.

## Overview

V-COMM Drive provides secure file storage with the following features:

- **End-to-end encryption** for private files
- **Automatic virus scanning** for all uploads
- **Version control** with unlimited history
- **Granular permissions** for sharing
- **CDN delivery** for fast access

## Base URL

```
https://api.vcomm.io/v1/files
```

---

## Endpoints

### Upload File

Uploads a file to V-COMM Drive.

**Endpoint**: `POST /upload`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body**:
```
file: <binary file>
folder_id: folder_abc123
name: custom_name.pdf (optional)
description: File description (optional)
```

**File Requirements**:

| Property | Limit |
|----------|-------|
| Max size | 100 MB (free), 500 MB (premium) |
| Supported formats | All common formats |
| Filename length | 1-255 characters |

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "file_abc123",
    "name": "document.pdf",
    "size": 1024000,
    "mime_type": "application/pdf",
    "extension": "pdf",
    "folder_id": "folder_xyz789",
    "url": "https://cdn.vcomm.io/files/usr_abc123/file_abc123",
    "download_url": "https://cdn.vcomm.io/files/usr_abc123/file_abc123/download",
    "thumbnail_url": "https://cdn.vcomm.io/files/usr_abc123/file_abc123/thumbnail",
    "checksum": "sha256:abc123...",
    "encrypted": true,
    "virus_scan_status": "clean",
    "created_at": "2024-01-20T16:00:00Z",
    "uploaded_by": "usr_abc123"
  }
}
```

---

### Upload to Channel

Uploads a file directly to a channel message.

**Endpoint**: `POST /upload/channel/{channel_id}`

**Request Body**:
```
file: <binary file>
message_content: Message text (optional)
spoiler: false (optional)
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "attachment": {
      "id": "att_abc123",
      "filename": "image.png",
      "size": 102400,
      "url": "https://cdn.vcomm.io/attachments/ch_xyz789/att_abc123",
      "proxy_url": "https://media.vcomm.io/attachments/ch_xyz789/att_abc123",
      "width": 1920,
      "height": 1080,
      "content_type": "image/png"
    },
    "message": {
      "id": "msg_abc123",
      "channel_id": "ch_xyz789",
      "content": "Message text"
    }
  }
}
```

---

### Get File

Retrieves file metadata.

**Endpoint**: `GET /{file_id}`

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `file_id` | string | File ID (file_xxx format) |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "file_abc123",
    "name": "document.pdf",
    "size": 1024000,
    "mime_type": "application/pdf",
    "extension": "pdf",
    "folder_id": "folder_xyz789",
    "url": "https://cdn.vcomm.io/files/usr_abc123/file_abc123",
    "download_url": "https://cdn.vcomm.io/files/usr_abc123/file_abc123/download",
    "thumbnail_url": null,
    "checksum": "sha256:abc123...",
    "encrypted": true,
    "virus_scan_status": "clean",
    "versions": [
      {
        "id": "ver_abc123",
        "version": 1,
        "size": 1024000,
        "created_at": "2024-01-20T16:00:00Z",
        "uploaded_by": "usr_abc123"
      }
    ],
    "permissions": {
      "read": true,
      "write": true,
      "delete": true,
      "share": true
    },
    "shared": false,
    "created_at": "2024-01-20T16:00:00Z",
    "updated_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Download File

Downloads file content.

**Endpoint**: `GET /{file_id}/download`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `version` | integer | Specific version (optional) |

**Response**: Binary file content

**Headers**:
```
Content-Type: application/octet-stream
Content-Disposition: attachment; filename="document.pdf"
Content-Length: 1024000
```

---

### Update File

Updates file metadata.

**Endpoint**: `PATCH /{file_id}`

**Request Body**:
```json
{
  "name": "renamed-file.pdf",
  "description": "Updated description",
  "folder_id": "folder_new456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "file_abc123",
    "name": "renamed-file.pdf",
    "updated_at": "2024-01-20T17:00:00Z"
  }
}
```

---

### Delete File

Deletes a file.

**Endpoint**: `DELETE /{file_id}`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `permanent` | boolean | Permanently delete (bypass trash) |
| `reason` | string | Reason for deletion |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "File moved to trash"
}
```

---

## Folders

### List Files

Lists files in a folder.

**Endpoint**: `GET /folders/{folder_id}/files`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | integer | Results per page (1-100) |
| `offset` | integer | Pagination offset |
| `sort` | string | Sort field (name, size, created, modified) |
| `order` | string | Sort order (asc, desc) |
| `type` | string | Filter by MIME type prefix |
| `search` | string | Search by filename |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file_abc123",
        "name": "document.pdf",
        "size": 1024000,
        "mime_type": "application/pdf",
        "thumbnail_url": null,
        "created_at": "2024-01-20T16:00:00Z",
        "updated_at": "2024-01-20T16:00:00Z"
      }
    ],
    "folders": [
      {
        "id": "folder_def456",
        "name": "Projects",
        "parent_id": "folder_xyz789",
        "file_count": 15,
        "created_at": "2024-01-15T10:00:00Z"
      }
    ],
    "total_files": 42,
    "total_folders": 5,
    "total_size": 104857600
  }
}
```

---

### Create Folder

Creates a new folder.

**Endpoint**: `POST /folders`

**Request Body**:
```json
{
  "name": "New Folder",
  "parent_id": "folder_xyz789"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "folder_new123",
    "name": "New Folder",
    "parent_id": "folder_xyz789",
    "path": "/My Files/New Folder",
    "created_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Get Folder

Retrieves folder details.

**Endpoint**: `GET /folders/{folder_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "folder_abc123",
    "name": "Documents",
    "parent_id": "folder_xyz789",
    "path": "/My Files/Documents",
    "file_count": 42,
    "folder_count": 3,
    "total_size": 104857600,
    "permissions": {
      "read": true,
      "write": true,
      "delete": true
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-20T15:00:00Z"
  }
}
```

---

### Update Folder

Updates folder metadata.

**Endpoint**: `PATCH /folders/{folder_id}`

**Request Body**:
```json
{
  "name": "Renamed Folder",
  "parent_id": "folder_new456"
}
```

---

### Delete Folder

Deletes a folder and its contents.

**Endpoint**: `DELETE /folders/{folder_id}`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `recursive` | boolean | Delete all contents |
| `permanent` | boolean | Permanently delete |

---

## Versioning

### List Versions

Lists all versions of a file.

**Endpoint**: `GET /{file_id}/versions`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "ver_abc123",
        "version": 3,
        "size": 1024000,
        "checksum": "sha256:abc123...",
        "changes": "Updated content",
        "created_at": "2024-01-20T16:00:00Z",
        "uploaded_by": {
          "id": "usr_abc123",
          "username": "johndoe"
        }
      },
      {
        "id": "ver_def456",
        "version": 2,
        "size": 1020000,
        "checksum": "sha256:def456...",
        "changes": "Minor fixes",
        "created_at": "2024-01-19T14:00:00Z",
        "uploaded_by": {
          "id": "usr_abc123",
          "username": "johndoe"
        }
      }
    ],
    "total": 3,
    "current_version": 3
  }
}
```

---

### Download Version

Downloads a specific file version.

**Endpoint**: `GET /{file_id}/versions/{version_id}/download`

**Response**: Binary file content

---

### Restore Version

Restores a file to a previous version.

**Endpoint**: `POST /{file_id}/versions/{version_id}/restore`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "file_abc123",
    "current_version": 4,
    "restored_from": 2
  }
}
```

---

### Delete Version

Deletes a specific file version.

**Endpoint**: `DELETE /{file_id}/versions/{version_id}`

**Note**: Cannot delete the current version.

---

## Sharing

### Share File

Creates a share link for a file.

**Endpoint**: `POST /{file_id}/share`

**Request Body**:
```json
{
  "type": "link",
  "password": "optional_password",
  "expires_at": "2024-01-27T16:00:00Z",
  "max_downloads": 10,
  "allow_download": true,
  "allow_comment": false
}
```

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Share type (link, user, channel) |
| `password` | string | Optional password protection |
| `expires_at` | string | Expiration timestamp |
| `max_downloads` | integer | Maximum downloads allowed |
| `allow_download` | boolean | Allow file download |
| `allow_comment` | boolean | Allow comments |

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "share_abc123",
    "type": "link",
    "url": "https://vcomm.io/share/abc123xyz",
    "file": {
      "id": "file_abc123",
      "name": "document.pdf",
      "size": 1024000
    },
    "password_protected": false,
    "expires_at": "2024-01-27T16:00:00Z",
    "max_downloads": 10,
    "downloads": 0,
    "created_at": "2024-01-20T16:00:00Z"
  }
}
```

---

### Share with User

Shares a file directly with another user.

**Endpoint**: `POST /{file_id}/share/user`

**Request Body**:
```json
{
  "user_id": "usr_xyz789",
  "permission": "read",
  "message": "Check out this file!",
  "notify": true
}
```

**Permissions**:

| Permission | Description |
|------------|-------------|
| `read` | View and download |
| `write` | Edit and upload new versions |
| `manage` | Full control including sharing |

---

### Share with Channel

Shares a file in a channel.

**Endpoint**: `POST /{file_id}/share/channel`

**Request Body**:
```json
{
  "channel_id": "ch_xyz789",
  "message": "Here's the file you requested"
}
```

---

### List Shares

Lists all shares for a file.

**Endpoint**: `GET /{file_id}/shares`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "shares": [
      {
        "id": "share_abc123",
        "type": "link",
        "url": "https://vcomm.io/share/abc123xyz",
        "downloads": 5,
        "expires_at": "2024-01-27T16:00:00Z",
        "created_at": "2024-01-20T16:00:00Z"
      }
    ],
    "total": 1
  }
}
```

---

### Revoke Share

Revokes a share.

**Endpoint**: `DELETE /{file_id}/shares/{share_id}`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Share revoked successfully"
}
```

---

## Permissions

### Get Permissions

Gets file permissions.

**Endpoint**: `GET /{file_id}/permissions`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "owner": {
      "id": "usr_abc123",
      "username": "johndoe"
    },
    "permissions": [
      {
        "type": "user",
        "id": "usr_xyz789",
        "username": "janedoe",
        "permission": "read",
        "granted_at": "2024-01-20T16:00:00Z"
      }
    ],
    "link_access": false
  }
}
```

---

### Set Permissions

Sets file permissions.

**Endpoint**: `PUT /{file_id}/permissions`

**Request Body**:
```json
{
  "permissions": [
    {
      "type": "user",
      "id": "usr_xyz789",
      "permission": "write"
    },
    {
      "type": "role",
      "id": "role_abc123",
      "permission": "read"
    }
  ]
}
```

---

## Search

### Search Files

Searches for files.

**Endpoint**: `GET /search`

**Query Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `type` | string | Filter by MIME type |
| `min_size` | integer | Minimum file size |
| `max_size` | integer | Maximum file size |
| `created_after` | string | Created after date |
| `created_before` | string | Created before date |
| `folder_id` | string | Search in folder |
| `shared` | boolean | Only shared files |
| `limit` | integer | Results per page |
| `offset` | integer | Pagination offset |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "id": "file_abc123",
        "name": "report.pdf",
        "size": 1024000,
        "mime_type": "application/pdf",
        "folder_path": "/Documents/Reports",
        "created_at": "2024-01-20T16:00:00Z"
      }
    ],
    "total": 10
  }
}
```

---

## Storage

### Get Storage Info

Gets storage usage information.

**Endpoint**: `GET /storage`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "used": 1048576000,
    "total": 10737418240,
    "available": 9688834240,
    "percent_used": 9.77,
    "limits": {
      "max_file_size": 104857600,
      "max_files": 10000
    },
    "breakdown": {
      "documents": 524288000,
      "images": 314572800,
      "videos": 157286400,
      "other": 52428800
    }
  }
}
```

---

## Trash

### List Trash

Lists files in trash.

**Endpoint**: `GET /trash`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "file_abc123",
        "name": "old_document.pdf",
        "type": "file",
        "size": 1024000,
        "deleted_at": "2024-01-19T10:00:00Z",
        "expires_at": "2024-02-19T10:00:00Z"
      }
    ],
    "total": 5
  }
}
```

---

### Restore from Trash

Restores a file from trash.

**Endpoint**: `POST /trash/{file_id}/restore`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "file_abc123",
    "restored_at": "2024-01-20T17:00:00Z"
  }
}
```

---

### Empty Trash

Permanently deletes all items in trash.

**Endpoint**: `DELETE /trash`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deleted": 5,
    "freed_bytes": 5120000
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `FILE_NOT_FOUND` | 404 | File does not exist |
| `FOLDER_NOT_FOUND` | 404 | Folder does not exist |
| `INSUFFICIENT_PERMISSIONS` | 403 | Missing required permission |
| `FILE_TOO_LARGE` | 413 | File exceeds size limit |
| `INVALID_FILE_TYPE` | 415 | File type not allowed |
| `STORAGE_EXCEEDED` | 507 | Storage limit exceeded |
| `FILE_NAME_TAKEN` | 409 | Filename already exists |
| `VIRUS_DETECTED` | 400 | Virus detected in file |
| `VERSION_NOT_FOUND` | 404 | Version does not exist |
| `SHARE_NOT_FOUND` | 404 | Share does not exist |

---

## SDK Examples

### JavaScript/TypeScript

```typescript
import { VCommClient } from '@vcomm/sdk';
import fs from 'fs';

const client = new VCommClient({ accessToken: 'your-token' });

// Upload file
const file = fs.readFileSync('./document.pdf');
const uploaded = await client.files.upload({
  file: new File([file], 'document.pdf'),
  folderId: 'folder_xyz789'
});

// Upload to channel
const attachment = await client.files.uploadToChannel('ch_xyz789', {
  file: imageFile,
  spoiler: false
});

// Create share link
const share = await client.files.share('file_abc123', {
  type: 'link',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

// Download file
const content = await client.files.download('file_abc123');

// Search files
const results = await client.files.search({
  q: 'report',
  type: 'application/pdf'
});
```

### Python

```python
from vcomm import VCommClient

client = VCommClient(access_token='your-token')

# Upload file
with open('document.pdf', 'rb') as f:
    uploaded = client.files.upload(
        file=f,
        folder_id='folder_xyz789'
    )

# Create folder
folder = client.files.create_folder(
    name='New Folder',
    parent_id='folder_xyz789'
)

# List versions
versions = client.files.list_versions('file_abc123')

# Share with user
share = client.files.share_with_user(
    'file_abc123',
    user_id='usr_xyz789',
    permission='read'
)

# Get storage info
storage = client.files.get_storage_info()
print(f"Used: {storage.used / 1024 / 1024:.2f} MB")
```

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Upload | 20 | 1 minute |
| Download | 100 | 1 minute |
| Share creation | 10 | 1 minute |
| Search | 30 | 1 minute |

---

## Supported File Types

### Documents
- PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- TXT, RTF, ODT, ODS, ODP
- MD, CSV, JSON, XML

### Images
- JPEG, PNG, GIF, WEBP
- SVG, BMP, TIFF, ICO

### Video
- MP4, WEBM, MOV, AVI
- MKV, FLV, WMV

### Audio
- MP3, WAV, OGG, FLAC
- AAC, M4A, WMA

### Archives
- ZIP, RAR, 7Z, TAR
- GZ, BZ2

---

## Related Documentation

- [Messages API](./messages) - Message attachments
- [Drive Feature](../../features/drive) - Feature overview
- [Security Overview](../../security/overview) - Encryption details