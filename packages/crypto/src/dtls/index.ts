/**
 * @fileoverview DTLS (Datagram Transport Layer Security) utilities
 * @module @vcomm/crypto/dtls
 */

import {
  DTLSVersion,
  DTLSCipherSuite,
  DTLSFingerprint,
  DTLSRole,
  DTLSState,
  DTLSSessionParams,
  DTLError,
} from '../types';
import { sha256, sha384, sha512 } from '../hash';
import { randomBytes } from '../random';

/**
 * DTLS version constants
 */
export const DTLS_VERSION_1_0: DTLSVersion = { major: 254, minor: 255 }; // DTLS 1.0
export const DTLS_VERSION_1_2: DTLSVersion = { major: 253, minor: 253 }; // DTLS 1.2
export const DTLS_VERSION_1_3: DTLSVersion = { major: 253, minor: 254 }; // DTLS 1.3

/**
 * Supported cipher suites for WebRTC
 */
export const WEBRTC_CIPHERER_SUITES: DTLSCipherSuite[] = [
  'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
  'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
  'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
];

/**
 * DTLS fingerprint generator
 */
export class DTLSFingerprintGenerator {
  /**
   * Generate a SHA-256 fingerprint from a certificate
   */
  static sha256(certificate: Uint8Array | string): DTLSFingerprint {
    const certData = typeof certificate === 'string' 
      ? new TextEncoder().encode(certificate) 
      : certificate;
    
    const hash = sha256(certData);
    const hexValue = this.formatFingerprint(hash);
    
    return {
      algorithm: 'sha256',
      value: hexValue,
    };
  }
  
  /**
   * Generate a SHA-384 fingerprint from a certificate
   */
  static sha384(certificate: Uint8Array | string): DTLSFingerprint {
    const certData = typeof certificate === 'string' 
      ? new TextEncoder().encode(certificate) 
      : certificate;
    
    const hash = sha384(certData);
    const hexValue = this.formatFingerprint(hash);
    
    return {
      algorithm: 'sha384',
      value: hexValue,
    };
  }
  
  /**
   * Format fingerprint as colon-separated hex string
   */
  static formatFingerprint(hash: Uint8Array): string {
    return Array.from(hash)
      .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
      .join(':');
  }
  
  /**
   * Parse fingerprint from colon-separated hex string
   */
  static parseFingerprint(fingerprint: string): Uint8Array {
    const hex = fingerprint.replace(/:/g, '');
    const bytes = new Uint8Array(hex.length / 2);
    
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    
    return bytes;
  }
  
  /**
   * Verify a fingerprint matches a certificate
   */
  static verify(
    certificate: Uint8Array | string,
    fingerprint: DTLSFingerprint
  ): boolean {
    const certData = typeof certificate === 'string' 
      ? new TextEncoder().encode(certificate) 
      : certificate;
    
    let computed: Uint8Array;
    
    switch (fingerprint.algorithm) {
      case 'sha256':
        computed = sha256(certData);
        break;
      case 'sha384':
        computed = sha384(certData);
        break;
      case 'sha512':
        computed = sha512(certData);
        break;
      default:
        throw new DTLError(`Unsupported fingerprint algorithm: ${fingerprint.algorithm}`);
    }
    
    const expected = this.parseFingerprint(fingerprint.value);
    
    if (computed.length !== expected.length) {
      return false;
    }
    
    // Constant-time comparison
    let result = 0;
    for (let i = 0; i < computed.length; i++) {
      result |= computed[i] ^ expected[i];
    }
    
    return result === 0;
  }
}

/**
 * DTLS session state manager
 */
export class DTLSSession {
  private state: DTLSState = 'closed';
  private localFingerprint: DTLSFingerprint | null = null;
  private remoteFingerprint: DTLSFingerprint | null = null;
  private role: DTLSRole = 'client';
  private selectedCipherSuite: DTLSCipherSuite | null = null;
  
  // DTLS parameters
  private clientRandom: Uint8Array | null = null;
  private serverRandom: Uint8Array | null = null;
  private masterSecret: Uint8Array | null = null;
  
  // Replay protection
  private receiveWindow: bigint = BigInt(0);
  private maxReceiveSequence: bigint = BigInt(0);
  
  constructor(private sessionId: string = generateSessionId()) {}
  
  /**
   * Initialize session with local fingerprint
   */
  initialize(localFingerprint: DTLSFingerprint, role: DTLSRole = 'client'): void {
    this.localFingerprint = localFingerprint;
    this.role = role;
    this.state = 'connecting';
    
    // Generate random value
    if (role === 'client') {
      this.clientRandom = randomBytes(32);
    } else {
      this.serverRandom = randomBytes(32);
    }
  }
  
  /**
   * Set remote fingerprint
   */
  setRemoteFingerprint(fingerprint: DTLSFingerprint): void {
    this.remoteFingerprint = fingerprint;
  }
  
  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
  
  /**
   * Get current state
   */
  getState(): DTLSState {
    return this.state;
  }
  
  /**
   * Get session parameters
   */
  getParams(): DTLSSessionParams {
    return {
      localFingerprint: this.localFingerprint!,
      remoteFingerprint: this.remoteFingerprint!,
      role: this.role,
      cipherSuite: this.selectedCipherSuite ?? undefined,
      state: this.state,
    };
  }
  
  /**
   * Process incoming DTLS packet
   */
  processIncomingPacket(packet: Uint8Array): Uint8Array | null {
    if (packet.length < 13) {
      throw new DTLError('DTLS packet too short');
    }
    
    // Check for replay
    const epoch = (packet[3] << 8) | packet[4];
    const sequence = readBigUInt48(packet, 5);
    
    if (this.isReplay(epoch, sequence)) {
      return null; // Drop replayed packet
    }
    
    // Update receive window
    this.updateReceiveWindow(sequence);
    
    // Process based on content type
    const contentType = packet[0];
    
    switch (contentType) {
      case 20: // ChangeCipherSpec
        return this.handleChangeCipherSpec(packet);
      case 21: // Alert
        return this.handleAlert(packet);
      case 22: // Handshake
        return this.handleHandshake(packet);
      case 23: // Application Data
        return this.handleApplicationData(packet);
      default:
        throw new DTLError(`Unknown DTLS content type: ${contentType}`);
    }
  }
  
  /**
   * Create outgoing DTLS packet
   */
  createOutgoingPacket(data: Uint8Array, contentType: number = 23): Uint8Array {
    const epoch = 0; // Current epoch
    const sequence = BigInt(0); // Would track outgoing sequence
    
    const header = new Uint8Array(13);
    header[0] = contentType;
    header[1] = DTLS_VERSION_1_2.major;
    header[2] = DTLS_VERSION_1_2.minor;
    header[3] = (epoch >> 8) & 0xff;
    header[4] = epoch & 0xff;
    
    // Write 48-bit sequence number
    writeBigUInt48(header, sequence, 5);
    
    // Write length
    const length = data.length;
    header[11] = (length >> 8) & 0xff;
    header[12] = length & 0xff;
    
    const packet = new Uint8Array(13 + data.length);
    packet.set(header, 0);
    packet.set(data, 13);
    
    return packet;
  }
  
  /**
   * Complete handshake
   */
  completeHandshake(cipherSuite: DTLSCipherSuite): void {
    this.selectedCipherSuite = cipherSuite;
    this.state = 'connected';
  }
  
  /**
   * Close session
   */
  close(): void {
    this.state = 'closed';
    this.masterSecret = null;
  }
  
  /**
   * Mark session as failed
   */
  fail(): void {
    this.state = 'failed';
  }
  
  /**
   * Check if packet is a replay
   */
  private isReplay(epoch: number, sequence: bigint): boolean {
    if (epoch === 0 && sequence === BigInt(0)) {
      return false; // Initial packet
    }
    
    if (sequence > this.maxReceiveSequence) {
      return false;
    }
    
    const diff = this.maxReceiveSequence - sequence;
    if (diff > BigInt(64)) {
      return true; // Too old
    }
    
    const mask = BigInt(1) << diff;
    return (this.receiveWindow & mask) !== BigInt(0);
  }
  
  /**
   * Update receive window
   */
  private updateReceiveWindow(sequence: bigint): void {
    if (sequence > this.maxReceiveSequence) {
      // Shift window
      const diff = sequence - this.maxReceiveSequence;
      this.receiveWindow <<= diff;
      this.maxReceiveSequence = sequence;
    }
    
    const diff = this.maxReceiveSequence - sequence;
    this.receiveWindow |= (BigInt(1) << diff);
  }
  
  /**
   * Handle ChangeCipherSpec
   */
  private handleChangeCipherSpec(_packet: Uint8Array): Uint8Array | null {
    // Process CCS
    return null;
  }
  
  /**
   * Handle Alert
   */
  private handleAlert(packet: Uint8Array): Uint8Array | null {
    const level = packet[13];
    const description = packet[14];
    
    if (level === 2) { // Fatal
      this.fail();
    }
    
    return null;
  }
  
  /**
   * Handle Handshake
   */
  private handleHandshake(packet: Uint8Array): Uint8Array | null {
    const handshakeType = packet[13];
    
    switch (handshakeType) {
      case 1: // ClientHello
        return this.handleClientHello(packet);
      case 2: // ServerHello
        return this.handleServerHello(packet);
      case 11: // Certificate
        return this.handleCertificate(packet);
      case 12: // ServerKeyExchange
        return this.handleServerKeyExchange(packet);
      case 14: // ServerHelloDone
        return this.handleServerHelloDone(packet);
      case 16: // ClientKeyExchange
        return this.handleClientKeyExchange(packet);
      case 20: // Finished
        return this.handleFinished(packet);
      default:
        return null;
    }
  }
  
  /**
   * Handle Application Data
   */
  private handleApplicationData(packet: Uint8Array): Uint8Array | null {
    if (this.state !== 'connected') {
      throw new DTLError('Received application data before connection established');
    }
    
    // Decrypt and return payload
    return packet.slice(13);
  }
  
  // Simplified handshake handlers
  private handleClientHello(packet: Uint8Array): Uint8Array | null {
    // Would process client hello and generate server hello
    return null;
  }
  
  private handleServerHello(packet: Uint8Array): Uint8Array | null {
    // Would process server hello
    return null;
  }
  
  private handleCertificate(packet: Uint8Array): Uint8Array | null {
    return null;
  }
  
  private handleServerKeyExchange(packet: Uint8Array): Uint8Array | null {
    return null;
  }
  
  private handleServerHelloDone(packet: Uint8Array): Uint8Array | null {
    return null;
  }
  
  private handleClientKeyExchange(packet: Uint8Array): Uint8Array | null {
    return null;
  }
  
  private handleFinished(packet: Uint8Array): Uint8Array | null {
    // Would verify finished message
    return null;
  }
}

/**
 * Generate a random DTLS session ID
 */
function generateSessionId(): string {
  return Buffer.from(randomBytes(16)).toString('hex');
}

/**
 * Read 48-bit unsigned integer
 */
function readBigUInt48(buffer: Uint8Array, offset: number): bigint {
  return (
    (BigInt(buffer[offset]) << 40n) |
    (BigInt(buffer[offset + 1]) << 32n) |
    (BigInt(buffer[offset + 2]) << 24n) |
    (BigInt(buffer[offset + 3]) << 16n) |
    (BigInt(buffer[offset + 4]) << 8n) |
    BigInt(buffer[offset + 5])
  );
}

/**
 * Write 48-bit unsigned integer
 */
function writeBigUInt48(buffer: Uint8Array, value: bigint, offset: number): void {
  buffer[offset] = Number((value >> 40n) & 0xffn);
  buffer[offset + 1] = Number((value >> 32n) & 0xffn);
  buffer[offset + 2] = Number((value >> 24n) & 0xffn);
  buffer[offset + 3] = Number((value >> 16n) & 0xffn);
  buffer[offset + 4] = Number((value >> 8n) & 0xffn);
  buffer[offset + 5] = Number(value & 0xffn);
}

/**
 * Create a DTLS session
 */
export function createDTLSSession(sessionId?: string): DTLSSession {
  return new DTLSSession(sessionId);
}

// Default export
export default {
  DTLSFingerprintGenerator,
  DTLSSession,
  createDTLSSession,
  DTLS_VERSION_1_0,
  DTLS_VERSION_1_2,
  DTLS_VERSION_1_3,
  WEBRTC_CIPHERER_SUITES,
};