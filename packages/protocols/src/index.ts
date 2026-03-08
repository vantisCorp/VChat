/**
 * @fileoverview Main exports for @vcomm/protocols package
 * @module @vcomm/protocols
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export {
  // RTP Types
  RTPHeader,
  RTPExtension,
  RTPPacket,
  RTPPayloadType,
  RTPStats,
  RTPMap,

  // RTCP Types
  RTCPPacketType,
  RTCPHeader,
  RTCPSenderReport,
  RTCPReceiverReport,
  RTCPReportBlock,
  RTCPSDES,
  SDESItem,
  SDESType,
  RTCPBye,
  RTCPFeedback,
  RTCPFeedbackType,

  // WebRTC Types
  ICECandidate,
  ICECandidateType,
  ICEProtocol,
  ICEConnectionState,
  ICEGatheringState,
  DTLSRole,
  DTLSState,
  SDPMediaDescription,
  SDPSessionDescription,
  WebRTCStats,
  InboundRTPStats,
  OutboundRTPStats,

  // WebSocket Types
  WSMessageType,
  WSMessage,
  WSMessageHeader,
  WSAuthPayload,
  WSVoiceDataPayload,
  WSTextMessagePayload,
  WSUserPresence,

  // Signaling Types
  SignalingMessageType,
  SignalingMessage,
  SDPOffer,
  SDPAnswer,
  ICECandidateMessage,

  // UDP Types
  UDPPacket,
  UDPSocketOptions,

  // Error Types
  ProtocolError,
  RTPError,
  RTCPError,
  ICEError,
  SDPError,
  WSError,
  SignalingError,
} from './types';

// ============================================================================
// MODULE EXPORTS
// ============================================================================

// RTP Module
export {
  RTPPacketHandler,
  RTPStatsTracker,
  createSequenceGenerator,
  createTimestampGenerator,
} from './rtp';

// RTCP Module
export {
  RTCPPacketHandler,
  getNTPTime,
  ntpToDate,
} from './rtcp';

// WebRTC Module
export {
  SDPParser,
  ICEHandler,
  DTLSHandler,
  SDPUtils,
  WebRTCSession,
} from './webrtc';

// WebSocket Module
export {
  WSMessageBuilder,
  WSMessageParser,
  WSMessageValidator,
  WSHeartbeatManager,
  WSReconnectManager,
  WSMessageQueue,
} from './websocket';

// UDP Module
export {
  UDPPacketHandler,
  UDPPacketBuffer,
  UDPStatistics,
  UDPQoSManager,
  UDPCongestionControl,
  UDPSequenceManager,
  UDPAddressUtils,
} from './udp';

// Signaling Module
export {
  SignalingMessageBuilder,
  SignalingMessageParser,
  CallSession,
  SignalingSessionManager,
  SignalingStateMachine,
  SignalingHeartbeat,
  SignalingNegotiator,
  SignalingUtils,
  CallState,
} from './signaling';