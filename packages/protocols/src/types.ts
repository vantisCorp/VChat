/**
 * @fileoverview Type definitions for protocol implementations
 * @module @vcomm/protocols/types
 */

// ============================================================================
// RTP TYPES
// ============================================================================

/**
 * RTP packet header
 */
export interface RTPHeader {
  /** Version (always 2) */
  version: number;
  /** Padding flag */
  padding: boolean;
  /** Extension flag */
  extension: boolean;
  /** CSRC count */
  csrcCount: number;
  /** Marker bit */
  marker: boolean;
  /** Payload type */
  payloadType: number;
  /** Sequence number */
  sequenceNumber: number;
  /** Timestamp */
  timestamp: number;
  /** SSRC */
  ssrc: number;
  /** CSRC list */
  csrcList: number[];
  /** Header extensions */
  extensions?: RTPExtension[];
}

/**
 * RTP header extension
 */
export interface RTPExtension {
  /** Extension ID */
  id: number;
  /** Extension data */
  data: Uint8Array;
}

/**
 * RTP packet
 */
export interface RTPPacket {
  /** RTP header */
  header: RTPHeader;
  /** Payload data */
  payload: Uint8Array;
  /** Original packet bytes */
  raw?: Uint8Array;
}

/**
 * RTP payload types
 */
export enum RTPPayloadType {
  PCMU = 0,
  GSM = 3,
  G723 = 4,
  DVI4_8000 = 5,
  DVI4_16000 = 6,
  LPC = 7,
  PCMA = 8,
  G722 = 9,
  L16_STEREO = 10,
  L16_MONO = 11,
  QCELP = 12,
  CN = 13,
  MPA = 14,
  G728 = 15,
  DVI4_11025 = 16,
  DVI4_22050 = 17,
  G729 = 18,
  H263 = 34,
  JPEG = 26,
  NV = 28,
  H261 = 31,
  MPV = 32,
  MP2T = 33,
  H264 = 96,
  H265 = 97,
  VP8 = 98,
  VP9 = 99,
  OPUS = 111,
  AV1 = 99,
}

/**
 * RTP statistics
 */
export interface RTPStats {
  /** Packets sent */
  packetsSent: number;
  /** Bytes sent */
  bytesSent: number;
  /** Packets received */
  packetsReceived: number;
  /** Bytes received */
  bytesReceived: number;
  /** Packets lost */
  packetsLost: number;
  /** Jitter in milliseconds */
  jitter: number;
  /** Round trip time in milliseconds */
  rtt: number;
}

// ============================================================================
// RTCP TYPES
// ============================================================================

/**
 * RTCP packet types
 */
export enum RTCPPacketType {
  SENDER_REPORT = 200,
  RECEIVER_REPORT = 201,
  SOURCE_DESCRIPTION = 202,
  BYE = 203,
  APPLICATION_DEFINED = 204,
  RTP_FEEDBACK = 205,
  PAYLOAD_SPECIFIC_FEEDBACK = 206,
  EXTENDED_REPORT = 207,
}

/**
 * RTCP common header
 */
export interface RTCPHeader {
  /** Version (always 2) */
  version: number;
  /** Padding flag */
  padding: boolean;
  /** Report count */
  reportCount: number;
  /** Packet type */
  packetType: RTCPPacketType;
  /** Length in 32-bit words minus one */
  length: number;
}

/**
 * RTCP Sender Report
 */
export interface RTCPSenderReport {
  /** SSRC of sender */
  ssrc: number;
  /** NTP timestamp (most significant word) */
  ntpMsw: number;
  /** NTP timestamp (least significant word) */
  ntpLsw: number;
  /** RTP timestamp */
  rtpTimestamp: number;
  /** Sender's packet count */
  senderPacketCount: number;
  /** Sender's octet count */
  senderOctetCount: number;
  /** Report blocks */
  reportBlocks: RTCPReportBlock[];
}

/**
 * RTCP Receiver Report
 */
export interface RTCPReceiverReport {
  /** SSRC of sender */
  ssrc: number;
  /** Report blocks */
  reportBlocks: RTCPReportBlock[];
}

/**
 * RTCP report block
 */
export interface RTCPReportBlock {
  /** SSRC of source */
  ssrc: number;
  /** Fraction lost */
  fractionLost: number;
  /** Cumulative packets lost */
  cumulativePacketsLost: number;
  /** Extended highest sequence number */
  extendedHighestSequenceNumber: number;
  /** Interarrival jitter */
  jitter: number;
  /** Last SR timestamp */
  lastSenderReportTimestamp: number;
  /** Delay since last SR */
  delaySinceLastSenderReport: number;
}

/**
 * RTCP SDES (Source Description)
 */
export interface RTCPSDES {
  /** SSRC/CSRC */
  ssrc: number;
  /** SDES items */
  items: SDESItem[];
}

/**
 * SDES item
 */
export interface SDESItem {
  /** Item type */
  type: SDESType;
  /** Item value */
  value: string;
}

/**
 * SDES item types
 */
export enum SDESType {
  END = 0,
  CNAME = 1,
  NAME = 2,
  EMAIL = 3,
  PHONE = 4,
  LOC = 5,
  TOOL = 6,
  NOTE = 7,
  PRIV = 8,
}

/**
 * RTCP BYE
 */
export interface RTCPBye {
  /** SSRCs to leave */
  ssrcs: number[];
  /** Optional reason */
  reason?: string;
}

/**
 * RTCP Feedback (RTPFB/PSFB)
 */
export interface RTCPFeedback {
  /** Feedback message type */
  feedbackType: RTCPFeedbackType;
  /** Sender SSRC */
  senderSsrc: number;
  /** Media source SSRC */
  mediaSourceSsrc: number;
  /** Feedback Control Information */
  fci: Uint8Array;
}

/**
 * RTCP Feedback types
 */
export enum RTCPFeedbackType {
  // RTPFB
  NACK = 1,
  NACK_PLI = 1,
  NACK_SLI = 2,
  NACK_RPSI = 3,
  TRANSPORT_WIDE_FEEDBACK = 15,
  
  // PSFB
  PLI = 1,
  SLI = 2,
  RPSI = 3,
  FIR = 4,
  TSTR = 5,
  TSTN = 6,
  VBCM = 7,
  PSLEI = 8,
  ROI = 9,
  LRR = 10,
  REMB = 15,
}

// ============================================================================
// WEBRTC TYPES
// ============================================================================

/**
 * ICE candidate types
 */
export type ICECandidateType = 'host' | 'srflx' | 'prflx' | 'relay';

/**
 * ICE protocol
 */
export type ICEProtocol = 'udp' | 'tcp';

/**
 * ICE candidate
 */
export interface ICECandidate {
  /** Foundation */
  foundation: string;
  /** Component ID */
  component: number;
  /** Protocol */
  protocol: ICEProtocol;
  /** IP address */
  ip: string;
  /** Port */
  port: number;
  /** Priority */
  priority: number;
  /** Connection address */
  relatedAddress?: string;
  /** Related port */
  relatedPort?: number;
  /** Candidate type */
  type: ICECandidateType;
  /** TCP type */
  tcpType?: 'active' | 'passive' | 'so';
  /** Candidate ID */
  ufrag?: string;
}

/**
 * ICE connection state
 */
export type ICEConnectionState = 
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'disconnected'
  | 'failed'
  | 'closed';

/**
 * ICE gathering state
 */
export type ICEGatheringState = 'new' | 'gathering' | 'complete';

/**
 * DTLS role
 */
export type DTLSRole = 'client' | 'server';

/**
 * DTLS state
 */
export type DTLSState = 'new' | 'connecting' | 'connected' | 'closed' | 'failed';

/**
 * SDP media description
 */
export interface SDPMediaDescription {
  /** Media type */
  type: 'audio' | 'video' | 'application';
  /** Port */
  port: number;
  /** Protocol */
  protocol: string;
  /** Payload types */
  payloads: number[];
  /** Connection info */
  connection?: {
    ip: string;
    version: 4 | 6;
  };
  /** Bandwidth */
  bandwidth?: { type: string; value: number }[];
  /** RTP maps */
  rtpmap: Map<number, RTPMap>;
  /** FMTP parameters */
  fmtp: Map<number, string>;
  /** RTCP attributes */
  rtcp?: {
    port: number;
    netType?: string;
    ipType?: string;
    ip?: string;
  };
  /** ICE candidates */
  candidates: ICECandidate[];
  /** ICE ufrag */
  iceUfrag?: string;
  /** ICE password */
  icePwd?: string;
  /** DTLS fingerprint */
  fingerprint?: { algorithm: string; value: string };
  /** Setup role */
  setup?: DTLSRole;
  /** Direction */
  direction?: 'sendrecv' | 'sendonly' | 'recvonly' | 'inactive';
  /** SSRCs */
  ssrcs: Map<number, { attribute: string; value: string }>;
  /** SSRC groups */
  ssrcGroups: { semantics: string; ssrcs: number[] }[];
  /** RIDs */
  rids: Map<string, { id: string; direction: 'send' | 'recv'; params?: Map<string, string> }>;
  /** Simulcast */
  simulcast?: { send: string[]; recv: string[] };
  /** MID */
  mid?: string;
  /** Other attributes */
  attributes: string[];
}

/**
 * RTP map
 */
export interface RTPMap {
  /** Payload type */
  payloadType: number;
  /** Codec name */
  name: string;
  /** Clock rate */
  clockRate: number;
  /** Encoding parameters (channels for audio) */
  encodingParameters?: number;
  /** Format parameters */
  fmtp?: string;
}

/**
 * SDP session description
 */
export interface SDPSessionDescription {
  /** Protocol version */
  version: number;
  /** Origin */
  origin: {
    username: string;
    sessionId: number;
    sessionVersion: number;
    netType: string;
    ipType: string;
    ip: string;
  };
  /** Session name */
  name: string;
  /** Session info */
  info?: string;
  /** Connection info */
  connection?: {
    ip: string;
    version: 4 | 6;
  };
  /** Timing */
  timing: {
    start: number;
    stop: number;
  };
  /** Media descriptions */
  media: SDPMediaDescription[];
  /** Group */
  group?: { semantics: string; mids: string[] };
  /** Other attributes */
  attributes: string[];
}

/**
 * WebRTC statistics
 */
export interface WebRTCStats {
  /** Timestamp */
  timestamp: number;
  /** Stats type */
  type: string;
  /** Stats ID */
  id: string;
}

/**
 * Inbound RTP stats
 */
export interface InboundRTPStats extends WebRTCStats {
  type: 'inbound-rtp';
  /** SSRC */
  ssrc: number;
  /** Kind */
  kind: 'audio' | 'video';
  /** Codec ID */
  codecId: string;
  /** Packets received */
  packetsReceived: number;
  /** Packets lost */
  packetsLost: number;
  /** Bytes received */
  bytesReceived: number;
  /** Jitter */
  jitter: number;
  /** Fraction lost */
  fractionLost: number;
  /** Round trip time */
  roundTripTime?: number;
}

/**
 * Outbound RTP stats
 */
export interface OutboundRTPStats extends WebRTCStats {
  type: 'outbound-rtp';
  /** SSRC */
  ssrc: number;
  /** Kind */
  kind: 'audio' | 'video';
  /** Codec ID */
  codecId: string;
  /** Packets sent */
  packetsSent: number;
  /** Bytes sent */
  bytesSent: number;
  /** Target bitrate */
  targetBitrate?: number;
}

// ============================================================================
// WEBSOCKET TYPES
// ============================================================================

/**
 * WebSocket message types
 */
export enum WSMessageType {
  AUTH = 'auth',
  AUTH_RESPONSE = 'auth_response',
  JOIN = 'join',
  LEAVE = 'leave',
  USER_LIST = 'user_list',
  VOICE_DATA = 'voice_data',
  TEXT_MESSAGE = 'text_message',
  TYPING = 'typing',
  PRESENCE = 'presence',
  ERROR = 'error',
  PING = 'ping',
  PONG = 'pong',
  CHANNEL_CREATE = 'channel_create',
  CHANNEL_DELETE = 'channel_delete',
  CHANNEL_UPDATE = 'channel_update',
  USER_UPDATE = 'user_update',
  SERVER_UPDATE = 'server_update',
}

/**
 * WebSocket message header
 */
export interface WSMessageHeader {
  /** Message type */
  type: WSMessageType;
  /** Message ID */
  id: string;
  /** Timestamp */
  timestamp: number;
  /** Sequence number */
  sequence?: number;
}

/**
 * WebSocket message
 */
export interface WSMessage<T = any> {
  /** Message header */
  header: WSMessageHeader;
  /** Message payload */
  payload: T;
}

/**
 * Auth message payload
 */
export interface WSAuthPayload {
  /** Auth token */
  token: string;
  /** Protocol version */
  version: string;
}

/**
 * Voice data payload
 */
export interface WSVoiceDataPayload {
  /** Channel ID */
  channelId: string;
  /** User ID */
  userId: string;
  /** Audio data */
  data: Uint8Array;
  /** Sequence number */
  sequence: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Text message payload
 */
export interface WSTextMessagePayload {
  /** Channel ID */
  channelId: string;
  /** User ID */
  userId: string;
  /** Message content */
  content: string;
  /** Reply to message ID */
  replyTo?: string;
}

/**
 * User presence
 */
export interface WSUserPresence {
  /** User ID */
  userId: string;
  /** Online status */
  online: boolean;
  /** Status message */
  status?: string;
  /** Current channel */
  channelId?: string;
}

// ============================================================================
// SIGNALING TYPES
// ============================================================================

/**
 * Signaling message types
 */
export enum SignalingMessageType {
  OFFER = 'offer',
  ANSWER = 'answer',
  CANDIDATE = 'candidate',
  RENEGOTIATE = 'renegotiate',
  BYE = 'bye',
  ERROR = 'error',
}

/**
 * Signaling message
 */
export interface SignalingMessage {
  /** Message type */
  type: SignalingMessageType;
  /** Source user ID */
  from: string;
  /** Target user ID */
  to: string;
  /** Call ID */
  callId: string;
  /** Message payload */
  payload: any;
  /** Timestamp */
  timestamp: number;
}

/**
 * SDP offer
 */
export interface SDPOffer {
  /** SDP content */
  sdp: string;
  /** Media types offered */
  mediaTypes: ('audio' | 'video')[];
}

/**
 * SDP answer
 */
export interface SDPAnswer {
  /** SDP content */
  sdp: string;
}

/**
 * ICE candidate message
 */
export interface ICECandidateMessage {
  /** Candidate string */
  candidate: string;
  /** SDP MID */
  sdpMid: string | null;
  /** SDP M-line index */
  sdpMLineIndex: number | null;
}

// ============================================================================
// UDP TYPES
// ============================================================================

/**
 * UDP packet
 */
export interface UDPPacket {
  /** Source address */
  sourceAddress: string;
  /** Source port */
  sourcePort: number;
  /** Destination address */
  destinationAddress: string;
  /** Destination port */
  destinationPort: number;
  /** Payload */
  payload: Uint8Array;
  /** Timestamp */
  timestamp: number;
}

/**
 * UDP socket options
 */
export interface UDPSocketOptions {
  /** Local address to bind */
  address?: string;
  /** Local port to bind */
  port?: number;
  /** Reuse address */
  reuseAddr?: boolean;
  /** Receive buffer size */
  recvBufferSize?: number;
  /** Send buffer size */
  sendBufferSize?: number;
  /** IPv6 only */
  ipv6Only?: boolean;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Protocol error base
 */
export class ProtocolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProtocolError';
  }
}

/**
 * RTP error
 */
export class RTPError extends ProtocolError {
  constructor(message: string) {
    super(message);
    this.name = 'RTPError';
  }
}

/**
 * RTCP error
 */
export class RTCPError extends ProtocolError {
  constructor(message: string) {
    super(message);
    this.name = 'RTCPError';
  }
}

/**
 * ICE error
 */
export class ICEError extends ProtocolError {
  constructor(message: string) {
    super(message);
    this.name = 'ICEError';
  }
}

/**
 * SDP error
 */
export class SDPError extends ProtocolError {
  constructor(message: string) {
    super(message);
    this.name = 'SDPError';
  }
}

/**
 * WebSocket error
 */
export class WSError extends ProtocolError {
  /** Error code */
  code?: number;
  
  constructor(message: string, code?: number) {
    super(message);
    this.name = 'WSError';
    this.code = code;
  }
}

/**
 * Signaling error
 */
export class SignalingError extends ProtocolError {
  constructor(message: string) {
    super(message);
    this.name = 'SignalingError';
  }
}