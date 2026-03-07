# @vcomm/protocols

Protocol definitions and implementations for V-COMM voice communication platform.

## Overview

This package provides comprehensive protocol implementations for real-time communication, including RTP, RTCP, WebRTC, WebSocket, UDP, and Signaling protocols. It is designed for building voice and video communication applications.

## Installation

```bash
npm install @vcomm/protocols
```

## Features

### RTP (Real-time Transport Protocol)
- Packet parsing and building
- Header extension support (RFC 5285)
- Statistics tracking
- Sequence and timestamp generation

### RTCP (Real-time Control Protocol)
- Sender/Receiver Reports
- SDES (Source Description)
- Feedback messages (NACK, PLI)
- Compound packet parsing

### WebRTC
- SDP parsing and generation
- ICE candidate handling
- DTLS fingerprint management
- Session management

### WebSocket
- Message protocols for voice applications
- Heartbeat management
- Reconnection handling
- Message queuing

### UDP
- Packet handling utilities
- Buffer management
- Congestion control
- QoS management

### Signaling
- SDP offer/answer handling
- ICE candidate exchange
- Session management
- State machine for call flows

## Usage

### RTP Packet Handling

```typescript
import { RTPPacketHandler, RTPPayloadType } from '@vcomm/protocols';

// Build RTP packet
const packet = RTPPacketHandler.build({
  version: 2,
  padding: false,
  extension: false,
  csrcCount: 0,
  marker: false,
  payloadType: RTPPayloadType.OPUS,
  sequenceNumber: 123,
  timestamp: 45678,
  ssrc: 12345678,
  csrcList: [],
}, audioData);

// Parse RTP packet
const parsed = RTPPacketHandler.parse(receivedData);
console.log(parsed.header.sequenceNumber);
```

### RTCP Reports

```typescript
import { RTCPPacketHandler } from '@vcomm/protocols';

// Build Sender Report
const sr = RTCPPacketHandler.buildSenderReport(
  12345678,  // SSRC
  ntpTimestamp,
  rtpTimestamp,
  packetCount,
  octetCount,
  reportBlocks
);

// Parse compound RTCP packet
const packets = RTCPPacketHandler.parse(rtcpData);
```

### SDP Parsing

```typescript
import { SDPParser, SDPUtils } from '@vcomm/protocols';

// Parse SDP
const session = SDPParser.parse(sdpString);

// Access media sections
for (const media of session.media) {
  console.log(`Media: ${media.type}, Port: ${media.port}`);
  console.log(`Codecs: ${SDPUtils.getCodecs(media).map(c => c.name).join(', ')}`);
}

// Build SDP
const sdpString = SDPParser.build(session);
```

### ICE Candidates

```typescript
import { ICEHandler } from '@vcomm/protocols';

// Parse candidate from SDP
const candidate = ICEHandler.parseCandidate(
  'candidate:1 1 udp 2122260223 192.168.1.1 54321 typ host'
);

// Create host candidate
const host = ICEHandler.createHostCandidate('192.168.1.1', 54321);

// Sort candidates by priority
const sorted = ICEHandler.sortByPriority(candidates);
```

### WebSocket Messages

```typescript
import { WSMessageBuilder, WSMessageParser } from '@vcomm/protocols';

// Build voice data message
const message = WSMessageBuilder.buildVoiceData(
  'channel-123',
  'user-456',
  audioData,
  sequence,
  timestamp
);

// Serialize
const json = WSMessageParser.stringify(message);

// Parse received message
const parsed = WSMessageParser.parse(receivedJson);
```

### Signaling

```typescript
import {
  SignalingMessageBuilder,
  SignalingSessionManager,
  CallSession
} from '@vcomm/protocols';

// Create session manager
const sessionManager = new SignalingSessionManager();

// Create new call session
const session = sessionManager.createSession(
  'call-123',
  'local-user',
  'remote-user'
);

// Build offer
const offer = SignalingMessageBuilder.buildOffer(
  'local-user',
  'remote-user',
  'call-123',
  sdpString,
  ['audio', 'video']
);

// Handle state transitions
session.setState('ringing');
session.setState('connecting');
session.setState('connected');
```

### UDP Utilities

```typescript
import { UDPPacketHandler, UDPStatistics } from '@vcomm/protocols';

// Create packet
const packet = UDPPacketHandler.createPacket(
  '192.168.1.1',
  5000,
  '192.168.1.2',
  5001,
  payload
);

// Track statistics
const stats = new UDPStatistics();
stats.recordSent(1024);
stats.recordReceived(512);
console.log(stats.getStats());
```

## API Reference

### RTP Module

- `RTPPacketHandler` - Parse and build RTP packets
- `RTPStatsTracker` - Track RTP statistics
- `RTPSequenceGenerator` - Generate sequence numbers
- `RTPTimestampGenerator` - Generate timestamps

### RTCP Module

- `RTCPPacketHandler` - Parse and build RTCP packets
- `RTCPReportBuilder` - Build RTCP report blocks
- `NTPTimeUtils` - NTP timestamp utilities

### WebRTC Module

- `SDPParser` - Parse and build SDP
- `ICEHandler` - ICE candidate utilities
- `DTLSHandler` - DTLS fingerprint handling
- `SDPUtils` - SDP manipulation utilities
- `WebRTCSession` - Session management

### WebSocket Module

- `WSMessageBuilder` - Build WebSocket messages
- `WSMessageParser` - Parse WebSocket messages
- `WSMessageValidator` - Validate message payloads
- `WSHeartbeatManager` - Heartbeat management
- `WSReconnectManager` - Reconnection handling
- `WSMessageQueue` - Message queuing

### UDP Module

- `UDPPacketHandler` - Packet utilities
- `UDPPacketBuffer` - Buffer management
- `UDPStatistics` - Statistics tracking
- `UDPQoSManager` - Quality of Service
- `UDPCongestionControl` - Congestion control
- `UDPSequenceManager` - Sequence management
- `UDPAddressUtils` - Address utilities

### Signaling Module

- `SignalingMessageBuilder` - Build signaling messages
- `SignalingMessageParser` - Parse signaling messages
- `CallSession` - Call session management
- `SignalingSessionManager` - Multi-session management
- `SignalingStateMachine` - State transitions
- `SignalingHeartbeat` - Heartbeat monitoring
- `SignalingNegotiator` - SDP negotiation
- `SignalingUtils` - Utility functions

## Protocol Support

### RTP Payload Types
- PCMU (G.711 μ-law)
- PCMA (G.711 A-law)
- Opus
- H.264
- H.265
- VP8
- VP9
- AV1

### RTCP Packet Types
- Sender Report (SR)
- Receiver Report (RR)
- Source Description (SDES)
- Bye
- RTP Feedback (RTPFB)
- Payload-Specific Feedback (PSFB)

### ICE Candidate Types
- host
- srflx (server reflexive)
- prflx (peer reflexive)
- relay

## License

MIT