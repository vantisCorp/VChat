/**
 * @fileoverview SRTP (Secure Real-time Transport Protocol) implementation
 * @module @vcomm/crypto/srtp
 */

import { createCipheriv, createDecipheriv } from 'crypto';
import {
  SRTPCryptoSuite,
  SRTPKey,
  SRTPParams,
  SRTPHeader,
  SRTPError,
} from '../types';
import { hmac } from '../hash';
import { randomBytes } from '../random';

/**
 * SRTP session context
 */
export class SRTPSession {
  private params: SRTPParams;
  private cryptoSuite: SRTPCryptoSuite;
  private rolloverCounter: number = 0;
  private sequenceNumber: number = 0;
  
  // Replay protection
  private replayList: Set<number> = new Set();
  private replayWindowSize: number = 64;
  private maxSequenceSeen: number = 0;
  
  constructor(
    private masterKey: Uint8Array,
    private masterSalt: Uint8Array,
    cryptoSuite: SRTPCryptoSuite = 'AES_CM_128_HMAC_SHA1_80'
  ) {
    this.cryptoSuite = cryptoSuite;
    this.params = this.deriveKeys(masterKey, masterSalt);
  }
  
  /**
   * Protect an RTP packet (encrypt and authenticate)
   */
  protect(rtpPacket: Uint8Array): Uint8Array {
    const { header, payload } = this.parseRTPPacket(rtpPacket);
    
    // Update sequence number
    if (header.sequenceNumber === 0 && this.sequenceNumber === 65535) {
      this.rolloverCounter++;
    }
    this.sequenceNumber = header.sequenceNumber;
    
    // Encrypt payload
    const encryptedPayload = this.encryptPayload(payload, header);
    
    // Build SRTP packet
    const srtpPacket = new Uint8Array(header.raw.length + encryptedPayload.length + this.getAuthTagLength());
    srtpPacket.set(header.raw, 0);
    srtpPacket.set(encryptedPayload, header.raw.length);
    
    // Compute authentication tag
    const tag = this.computeAuthTag(srtpPacket.slice(0, header.raw.length + encryptedPayload.length), header);
    srtpPacket.set(tag, header.raw.length + encryptedPayload.length);
    
    return srtpPacket;
  }
  
  /**
   * Unprotect an SRTP packet (verify and decrypt)
   */
  unprotect(srtpPacket: Uint8Array): Uint8Array {
    const authTagLength = this.getAuthTagLength();
    
    if (srtpPacket.length < 12 + authTagLength) {
      throw new SRTPError('SRTP packet too short');
    }
    
    const { header, payload } = this.parseRTPPacket(srtpPacket.slice(0, srtpPacket.length - authTagLength));
    const receivedTag = srtpPacket.slice(srtpPacket.length - authTagLength);
    
    // Replay protection
    const index = (this.rolloverCounter << 16) | header.sequenceNumber;
    if (this.isReplay(index)) {
      throw new SRTPError('Replay attack detected');
    }
    
    // Verify authentication tag
    const expectedTag = this.computeAuthTag(
      srtpPacket.slice(0, srtpPacket.length - authTagLength),
      header
    );
    
    if (!this.constantTimeCompare(receivedTag, expectedTag)) {
      throw new SRTPError('Authentication failed');
    }
    
    // Update replay protection
    this.updateReplayList(index);
    
    // Decrypt payload
    const decryptedPayload = this.decryptPayload(payload, header);
    
    // Reconstruct RTP packet
    const rtpPacket = new Uint8Array(header.raw.length + decryptedPayload.length);
    rtpPacket.set(header.raw, 0);
    rtpPacket.set(decryptedPayload, header.raw.length);
    
    return rtpPacket;
  }
  
  /**
   * Derive SRTP keys from master key and salt
   */
  private deriveKeys(masterKey: Uint8Array, masterSalt: Uint8Array): SRTPParams {
    const keyLength = this.getKeyLength();
    const saltLength = this.getSaltLength();
    
    // Derive encryption key (label 0)
    const encryptionKey = this.kdf(masterKey, masterSalt, 0x00, keyLength);
    
    // Derive authentication key (label 1)
    const authKey = this.kdf(masterKey, masterSalt, 0x01, 20); // HMAC-SHA1 key
    
    // Derive salt (label 2)
    const salt = this.kdf(masterKey, masterSalt, 0x02, saltLength);
    
    return {
      encryptionKey,
      authKey,
      salt,
      keyDerivationRate: 0,
      roc: 0,
      seq: 0,
    };
  }
  
  /**
   * Key derivation function
   */
  private kdf(masterKey: Uint8Array, masterSalt: Uint8Array, label: number, length: number): Uint8Array {
    const keyId = new Uint8Array(7);
    keyId[0] = label;
    // Fill with ROC and seq for key derivation rate
    
    const input = new Uint8Array(masterSalt.length + keyId.length);
    input.set(masterSalt, 0);
    input.set(keyId, masterSalt.length);
    
    // XOR with label
    input[0] ^= label << 3;
    
    return this.aesCtr(masterKey, input, length);
  }
  
  /**
   * AES-CTR for key derivation
   */
  private aesCtr(key: Uint8Array, counter: Uint8Array, length: number): Uint8Array {
    const cipher = createCipheriv(`aes-${key.length * 8}-ctr`, Buffer.from(key), Buffer.from(counter).slice(0, 16));
    const zeroInput = Buffer.alloc(length);
    const output = Buffer.concat([cipher.update(zeroInput), cipher.final()]);
    return new Uint8Array(output);
  }
  
  /**
   * Encrypt payload using SRTP encryption
   */
  private encryptPayload(payload: Uint8Array, header: SRTPHeader): Uint8Array {
    const iv = this.computeIV(header);
    const cipher = createCipheriv(
      `aes-${this.params.encryptionKey.length * 8}-ctr`,
      Buffer.from(this.params.encryptionKey),
      Buffer.from(iv)
    );
    
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(payload)),
      cipher.final(),
    ]);
    
    return new Uint8Array(encrypted);
  }
  
  /**
   * Decrypt payload
   */
  private decryptPayload(payload: Uint8Array, header: SRTPHeader): Uint8Array {
    const iv = this.computeIV(header);
    const decipher = createDecipheriv(
      `aes-${this.params.encryptionKey.length * 8}-ctr`,
      Buffer.from(this.params.encryptionKey),
      Buffer.from(iv)
    );
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload)),
      decipher.final(),
    ]);
    
    return new Uint8Array(decrypted);
  }
  
  /**
   * Compute IV for encryption
   */
  private computeIV(header: SRTPHeader): Uint8Array {
    const iv = new Uint8Array(16);
    
    // SSRC
    const view = new DataView(iv.buffer);
    view.setUint32(0, header.ssrc, false);
    
    // ROC
    view.setUint32(4, this.rolloverCounter, false);
    
    // Sequence number
    view.setUint16(8, header.sequenceNumber, false);
    
    // XOR with salt
    for (let i = 0; i < this.params.salt.length && i < 14; i++) {
      iv[i] ^= this.params.salt[i];
    }
    
    return iv;
  }
  
  /**
   * Compute authentication tag
   */
  private computeAuthTag(data: Uint8Array, _header: SRTPHeader): Uint8Array {
    // Append ROC to the data
    const dataWithRoc = new Uint8Array(data.length + 4);
    dataWithRoc.set(data, 0);
    
    const view = new DataView(dataWithRoc.buffer);
    view.setUint32(data.length, this.rolloverCounter, false);
    
    const tagLength = this.getAuthTagLength();
    const fullHmac = hmac(dataWithRoc, this.params.authKey, 'sha256');
    
    return fullHmac.slice(0, tagLength);
  }
  
  /**
   * Parse RTP packet into header and payload
   */
  private parseRTPPacket(packet: Uint8Array): { header: SRTPHeader; payload: Uint8Array; raw: Uint8Array } {
    if (packet.length < 12) {
      throw new SRTPError('RTP packet too short');
    }
    
    const firstByte = packet[0];
    const _hasPadding = (firstByte & 0x20) !== 0;
    const hasExtension = (firstByte & 0x10) !== 0;
    const csrcCount = firstByte & 0x0f;
    
    let headerLength = 12 + (csrcCount * 4);
    
    // Handle extension header
    if (hasExtension && packet.length >= headerLength + 4) {
      const extLength = (packet[headerLength + 2] << 8) | packet[headerLength + 3];
      headerLength += 4 + (extLength * 4);
    }
    
    const rawHeader = packet.slice(0, headerLength);
    
    const header: SRTPHeader = {
      packetType: packet[1] & 0x7f,
      sequenceNumber: (packet[2] << 8) | packet[3],
      timestamp: (packet[4] << 24) | (packet[5] << 16) | (packet[6] << 8) | packet[7],
      ssrc: (packet[8] << 24) | (packet[9] << 16) | (packet[10] << 8) | packet[11],
      csrc: [],
      raw: rawHeader,
    };
    
    // Parse CSRCs
    for (let i = 0; i < csrcCount; i++) {
      const offset = 12 + (i * 4);
      header.csrc!.push(
        (packet[offset] << 24) | (packet[offset + 1] << 16) | 
        (packet[offset + 2] << 8) | packet[offset + 3]
      );
    }
    
    return {
      header,
      payload: packet.slice(headerLength),
      raw: rawHeader,
    };
  }
  
  /**
   * Get key length for crypto suite
   */
  private getKeyLength(): number {
    switch (this.cryptoSuite) {
      case 'AES_CM_128_HMAC_SHA1_80':
      case 'AES_CM_128_HMAC_SHA1_32':
      case 'AEAD_AES_128_GCM':
        return 16;
      case 'AES_256_CM_HMAC_SHA1_80':
      case 'AES_256_CM_HMAC_SHA1_32':
      case 'AEAD_AES_256_GCM':
        return 32;
      default:
        return 16;
    }
  }
  
  /**
   * Get salt length for crypto suite
   */
  private getSaltLength(): number {
    return 14; // Standard SRTP salt length
  }
  
  /**
   * Get authentication tag length
   */
  private getAuthTagLength(): number {
    switch (this.cryptoSuite) {
      case 'AES_CM_128_HMAC_SHA1_80':
      case 'AES_256_CM_HMAC_SHA1_80':
        return 10; // 80 bits
      case 'AES_CM_128_HMAC_SHA1_32':
      case 'AES_256_CM_HMAC_SHA1_32':
        return 4; // 32 bits
      case 'AEAD_AES_128_GCM':
      case 'AEAD_AES_256_GCM':
        return 16; // 128 bits
      default:
        return 10;
    }
  }
  
  /**
   * Check for replay attack
   */
  private isReplay(index: number): boolean {
    if (index > this.maxSequenceSeen) {
      return false;
    }
    
    if (this.maxSequenceSeen - index > this.replayWindowSize) {
      return true;
    }
    
    return this.replayList.has(index);
  }
  
  /**
   * Update replay protection list
   */
  private updateReplayList(index: number): void {
    if (index > this.maxSequenceSeen) {
      // Clean up old entries
      for (const oldIndex of this.replayList) {
        if (index - oldIndex > this.replayWindowSize) {
          this.replayList.delete(oldIndex);
        }
      }
      this.maxSequenceSeen = index;
    }
    
    this.replayList.add(index);
  }
  
  /**
   * Constant-time comparison
   */
  private constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }
}

/**
 * Create an SRTP session
 */
export function createSRTPSession(
  masterKey: Uint8Array,
  masterSalt: Uint8Array,
  cryptoSuite?: SRTPCryptoSuite
): SRTPSession {
  return new SRTPSession(masterKey, masterSalt, cryptoSuite);
}

/**
 * Generate SRTP keying material
 */
export function generateSRTPKey(cryptoSuite: SRTPCryptoSuite = 'AES_CM_128_HMAC_SHA1_80'): SRTPKey {
  let keyLength: number;
  
  switch (cryptoSuite) {
    case 'AES_CM_128_HMAC_SHA1_80':
    case 'AES_CM_128_HMAC_SHA1_32':
    case 'AEAD_AES_128_GCM':
      keyLength = 16;
      break;
    case 'AES_256_CM_HMAC_SHA1_80':
    case 'AES_256_CM_HMAC_SHA1_32':
    case 'AEAD_AES_256_GCM':
      keyLength = 32;
      break;
    default:
      keyLength = 16;
  }
  
  return {
    masterKey: randomBytes(keyLength),
    masterSalt: randomBytes(14),
    cryptoSuite,
  };
}

// Default export
export default {
  SRTPSession,
  createSRTPSession,
  generateSRTPKey,
};