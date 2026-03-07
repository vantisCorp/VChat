---
sidebar_position: 4
title: Drive (File Storage)
description: V-COMM's secure file storage and sharing system with E2E encryption
keywords: [drive, files, storage, sharing, encryption, cloud storage]
tags: [features, drive, storage]
---

# Drive (File Storage)

## Overview

V-COMM Drive provides secure, encrypted file storage and sharing directly integrated with your conversations. All files are encrypted at rest and in transit, with optional end-to-end encryption for maximum security.

## Features

### Security

| Feature | Description |
|---------|-------------|
| Encryption at Rest | AES-256-GCM encryption for all stored files |
| Encryption in Transit | TLS 1.3 for all file transfers |
| E2E Encryption | Optional Signal Protocol E2E encryption |
| Perfect Forward Secrecy | Key rotation on every file access |
| Post-Quantum | Hybrid Kyber+X25519 key exchange |

### Sharing

| Feature | Description |
|---------|-------------|
| Link Sharing | Generate time-limited, password-protected links |
| Channel Sharing | Share files directly in channels |
| Direct Sharing | Share files with specific users |
| Permission Levels | View, download, edit permissions |
| Access Control | IP allowlisting, domain restrictions |

### Organization

| Feature | Description |
|---------|-------------|
| Folders | Nested folder structure |
| Tags | Custom tags for organization |
| Search | Full-text search within files |
| Versions | File version history |
| Favorites | Quick access to important files |

## File Structure

```typescript
interface VCommFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  
  // Location
  spaceId?: string;
  channelId?: string;
  folderId?: string;
  
  // Owner
  ownerId: string;
  uploadedBy: string;
  uploadedAt: Date;
  
  // Encryption
  encryption: {
    algorithm: 'AES-256-GCM' | 'Signal-Protocol';
    keyId: string;
    e2eEnabled: boolean;
  };
  
  // Metadata
  metadata: {
    tags: string[];
    description?: string;
    customFields?: Record<string, any>;
  };
  
  // Access
  sharing: {
    public: boolean;
    links: ShareLink[];
    permissions: FilePermissions;
  };
  
  // Versions
  versions: FileVersion[];
}

interface ShareLink {
  id: string;
  url: string;
  createdAt: Date;
  expiresAt?: Date;
  password?: string;
  permissions: {
    view: boolean;
    download: boolean;
  };
  restrictions: {
    allowedIPs?: string[];
    allowedDomains?: string[];
    maxDownloads?: number;
  };
}
```

## Uploading Files

### Basic Upload

```typescript
import { VComm } from '@vcomm/sdk';

const client = new VComm({ token });

// Upload a file
const file = await client.files.upload({
  file: fileData,
  name: 'document.pdf',
  spaceId: 'space_123',
  folderId: 'folder_456'
});

console.log('File uploaded:', file.id);
```

### Encrypted Upload

```typescript
// Upload with E2E encryption
const file = await client.files.upload({
  file: fileData,
  name: 'confidential.pdf',
  encryption: {
    algorithm: 'Signal-Protocol',
    e2eEnabled: true,
    recipients: ['user_123', 'user_456']
  },
  metadata: {
    tags: ['confidential', 'project-x'],
    description: 'Project X confidential document'
  }
});
```

### Multipart Upload

```typescript
// Large file upload using chunks
const upload = await client.files.createMultipartUpload({
  name: 'large-video.mp4',
  size: 1073741824,  // 1 GB
  chunkSize: 5242880  // 5 MB chunks
});

// Upload chunks
for (let i = 0; i < upload.totalChunks; i++) {
  const chunk = getChunk(fileData, i, upload.chunkSize);
  await client.files.uploadChunk(upload.id, i, chunk);
}

// Complete upload
const file = await client.files.completeMultipartUpload(upload.id);
```

## File Management

### Organizing Files

```typescript
// Create folders
const folder = await client.files.createFolder({
  name: 'Documents',
  spaceId: 'space_123',
  parentId: null  // Top-level folder
});

const subfolder = await client.files.createFolder({
  name: '2024',
  spaceId: 'space_123',
  parentId: folder.id
});

// Move files
await client.files.move(fileId, {
  folderId: subfolder.id
});

// Copy files
const copy = await client.files.copy(fileId, {
  folderId: folder.id,
  name: 'Copy of document.pdf'
});
```

### File Versions

```typescript
// Upload new version
const newVersion = await client.files.uploadVersion(fileId, {
  file: newFileData,
  comment: 'Updated with latest changes'
});

// List versions
const versions = await client.files.listVersions(fileId);

// Restore previous version
await client.files.restoreVersion(fileId, versions[1].id);

// Compare versions
const diff = await client.files.compareVersions(
  fileId,
  versions[0].id,
  versions[1].id
);
```

### Tags and Metadata

```typescript
// Add tags
await client.files.addTags(fileId, [
  'important',
  'quarterly-report',
  '2024-q1'
]);

// Remove tags
await client.files.removeTags(fileId, ['2024-q1']);

// Update metadata
await client.files.updateMetadata(fileId, {
  description: 'Quarterly financial report for Q1 2024',
  customFields: {
    department: 'Finance',
    quarter: 'Q1',
    year: 2024
  }
});
```

## File Sharing

### Link Sharing

```typescript
// Create public share link
const link = await client.files.createShareLink(fileId, {
  expiresAt: new Date('2024-12-31'),
  password: 'secure123',
  permissions: {
    view: true,
    download: true
  },
  restrictions: {
    maxDownloads: 10,
    allowedDomains: ['company.com']
  }
});

console.log('Share link:', link.url);

// Disable link
await client.files.disableShareLink(link.id);
```

### Direct Sharing

```typescript
// Share with users
await client.files.shareWithUsers(fileId, {
  users: [
    { userId: 'user_123', permission: 'view' },
    { userId: 'user_456', permission: 'edit' }
  ],
  message: 'Please review this document'
});

// Share with channel
await client.files.shareInChannel(fileId, {
  channelId: 'channel_789',
  message: 'Here is the latest report'
});
```

### Permission Management

```typescript
// Update user permissions
await client.files.updateUserPermission(fileId, 'user_123', {
  permission: 'edit'
});

// Revoke access
await client.files.revokeAccess(fileId, 'user_123');

// List users with access
const users = await client.files.listAccess(fileId);
```

## File Search

### Search Files

```typescript
// Basic search
const results = await client.files.search({
  query: 'quarterly report',
  spaceId: 'space_123'
});

// Advanced search
const advanced = await client.files.search({
  query: 'financial',
  filters: {
    mimeType: ['application/pdf'],
    tags: ['quarterly', '2024'],
    size: { min: 1024, max: 10485760 },
    uploadedAfter: new Date('2024-01-01'),
    uploadedBefore: new Date('2024-12-31')
  },
  sort: 'relevance',
  limit: 50
});
```

### Search Within Files

```typescript
// Search for text within files
const withinFiles = await client.files.searchWithin({
  query: 'revenue growth',
  fileTypes: ['application/pdf', 'application/msword'],
  spaceId: 'space_123'
});

// Search in specific files
const inSpecificFiles = await client.files.searchInFiles({
  fileIds: ['file_1', 'file_2', 'file_3'],
  query: 'project deadline'
});
```

## File Preview

### Preview Generation

```typescript
// Get preview URL
const preview = await client.files.getPreview(fileId, {
  size: 'large',  // small, medium, large
  page: 1  // for PDFs and presentations
});

console.log('Preview URL:', preview.url);

// Preview in browser
const thumbnail = await client.files.getThumbnail(fileId, {
  width: 200,
  height: 200
});
```

### Embedding Files

```typescript
// Get embed code for documents
const embed = await client.files.getEmbedCode(fileId, {
  width: 800,
  height: 600,
  showHeader: true,
  showControls: true
});

// Embed HTML
document.getElementById('file-embed').innerHTML = embed.html;
```

## File Operations

### Downloading Files

```typescript
// Download file
const download = await client.files.download(fileId, {
  versionId: 'version_123'  // Optional: download specific version
});

// Download as stream (for large files)
const stream = await client.files.downloadStream(fileId);
```

### Converting Files

```typescript
// Convert file to different format
const converted = await client.files.convert(fileId, {
  toFormat: 'pdf',
  options: {
    quality: 'high',
    optimize: true
  }
});

// Convert image
const image = await client.files.convertImage(fileId, {
  toFormat: 'webp',
  width: 1920,
  height: 1080,
  quality: 85
});
```

### Zipping Files

```typescript
// Create zip archive
const zip = await client.files.createZip({
  fileIds: ['file_1', 'file_2', 'file_3'],
  name: 'archive.zip'
});

// Download zip
await client.files.download(zip.id);
```

## Storage Quotas

### Quota Management

```typescript
// Check storage usage
const quota = await client.files.getQuota();

console.log({
  used: quota.used,          // bytes used
  total: quota.total,        // total quota
  percentage: quota.used / quota.total * 100,
  breakdown: quota.breakdown  // by space/folder
});

// Get space quota
const spaceQuota = await client.files.getSpaceQuota('space_123');
```

## Security Features

### Virus Scanning

```typescript
// File upload automatically triggers virus scan
const file = await client.files.upload({ file: fileData });

// Check scan status
const scan = await client.files.getScanStatus(file.id);

if (scan.status === 'clean') {
  console.log('File is safe');
} else if (scan.status === 'infected') {
  console.log('File contains malware:', scan.threat);
  await client.files.quarantine(file.id);
}
```

### Access Logs

```typescript
// Get file access logs
const logs = await client.files.getAccessLogs(fileId, {
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  events: ['view', 'download', 'share', 'delete']
});

logs.forEach(log => {
  console.log({
    user: log.userId,
    action: log.action,
    timestamp: log.timestamp,
    ipAddress: log.ipAddress,
    details: log.details
  });
});
```

## Integration

### File Previews in Messages

```typescript
// Attach file to message
await client.messages.send(channelId, {
  content: 'Here is the document',
  attachments: [
    {
      type: 'file',
      fileId: fileId,
      name: 'document.pdf'
    }
  ]
});

// Preview will be automatically generated and displayed
```

### Webhook Events

```typescript
// File events webhook
const webhook = await client.webhooks.create('space', {
  events: ['file_uploaded', 'file_downloaded', 'file_shared'],
  url: 'https://your-server.com/webhook'
});

// Handle file upload event
{
  "event": "file_uploaded",
  "file": {
    "id": "file_123",
    "name": "document.pdf",
    "size": 1024000,
    "uploadedBy": "user_123"
  }
}
```

## Best Practices

### File Organization

1. **Use folders**: Organize files in nested folders
2. **Add tags**: Use descriptive tags for easy searching
3. **Set permissions**: Follow principle of least privilege
4. **Regular cleanup**: Archive or delete old files

### Security

1. **Use E2E encryption** for sensitive files
2. **Set expiration** on share links
3. **Monitor access logs** regularly
4. **Encrypt at rest** is enabled by default

## See Also

- [Channels](./channels)
- [Spaces](./spaces)
- [Security Overview](../security/overview)
- [API Reference](../api/index)