---
title: API Overview
---

# API Overview

V-COMM provides multiple API interfaces to suit different use cases:

- **REST API**: Traditional HTTP endpoints for CRUD operations
- **GraphQL API**: Flexible query language for complex data fetching
- **WebSocket API**: Real-time communication for live updates

## Base URLs

| Environment | Base URL |
|------------|----------|
| Production | `https://api.vcomm.app/v1` |
| Staging | `https://api.staging.vcomm.app/v1` |
| Development | `http://localhost:3001/v1` |

## Authentication

All API requests require authentication using JWT tokens.

### Getting Tokens

```bash
POST /v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "secure_password"
}
```

**Response**:

```json
{
  "access_token": "eyJhbGciOiJ...",
  "refresh_token": "eyJhbGciOiJ...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Using Tokens

Include the access token in the Authorization header:

```bash
Authorization: Bearer eyJhbGciOiJ...
```

## API Comparison

| Feature | REST API | GraphQL API | WebSocket API |
|---------|----------|-------------|---------------|
| Real-time | ❌ | ⚠️ Subscriptions | ✅ Yes |
| Over-fetching | ❌ Yes | ✅ No | N/A |
| Caching | ✅ Yes | ⚠️ Complex | ❌ No |
| Complexity | ✅ Simple | ⚠️ Medium | ⚠️ Medium |
| Best For | CRUD | Complex Queries | Live Updates |

## Quick Examples

### REST API

```bash
# List channels
curl https://api.vcomm.app/v1/channels \
  -H "Authorization: Bearer TOKEN"

# Create channel
curl -X POST https://api.vcomm.app/v1/channels \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "general", "type": "txt"}'
```

### GraphQL API

```bash
curl -X POST https://api.vcomm.app/graphql \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { channels { id name } }"
  }'
```

### WebSocket API

```javascript
const ws = new WebSocket('wss://api.vcomm.app/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    op: 1, // Identify
    d: { token: 'Bearer TOKEN' }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.t, 'Data:', data.d);
};
```

## Rate Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Auth endpoints | 10 | 1 minute |
| API endpoints | 100 | 1 minute |
| WebSocket messages | 50 | 1 second |
| File uploads | 10 | 1 minute |

## Error Handling

All APIs return errors in a consistent format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request was invalid",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_REQUEST | 400 | Request validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Permission denied |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Rate limit exceeded |
| INTERNAL_ERROR | 500 | Server error |

## SDKs

Official SDKs are available for:

- **JavaScript/TypeScript**: `@vcomm/sdk`
- **Rust**: `vcomm-client`
- **Python**: `vcomm-python`
- **Go**: `vcomm-go`

## Related Topics

- [REST API Reference](./rest/authentication.md)
- [WebSocket API Reference](./websocket/connection.md)
- [GraphQL API Reference](./graphql/queries.md)