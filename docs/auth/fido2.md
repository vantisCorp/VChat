# FIDO2 Passwordless Authentication

## Overview

V-COMM supports FIDO2 (WebAuthn) for passwordless authentication, providing a secure and user-friendly alternative to traditional passwords.

## Features

- **No Passwords**: Eliminate password-related vulnerabilities
- **Biometric Support**: Use fingerprint, Face ID, or Windows Hello
- **Hardware Keys**: Support for YubiKey and other security keys
- **Phishing Resistance**: Cannot be phished due to origin binding

## Implementation

### Registration

```typescript
import { FIDO2Auth } from '@vcomm/auth';

const fido2 = new FIDO2Auth();

// Start registration
const registrationOptions = await fido2.startRegistration(userId);

// Complete registration
const credential = await fido2.completeRegistration(registrationResponse);
```

### Authentication

```typescript
// Start authentication
const authOptions = await fido2.startAuthentication(userId);

// Complete authentication
const isValid = await fido2.completeAuthentication(authResponse);
```

## Supported Authenticators

| Type | Example | Security Level |
|------|---------|----------------|
| Platform | Touch ID, Windows Hello | Medium |
| Cross-platform | YubiKey, Titan Key | High |
| Biometric | Face ID, Fingerprint | Medium-High |

## Configuration

```yaml
fido2:
  rp:
    name: "V-COMM"
    id: "vcomm.dev"
  attestation: "direct"
  userVerification: "required"
</yaml>

## Best Practices

1. **Require User Verification**: Always require `userVerification: "required"`
2. **Resident Credentials**: Enable for passwordless experience
3. **Backup Codes**: Provide backup authentication methods
4. **Multiple Keys**: Allow users to register multiple authenticators

## References

- [FIDO Alliance](https://fidoalliance.org/)
- [WebAuthn Specification](https://www.w3.org/TR/webauthn/)
- [MDN WebAuthn API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)