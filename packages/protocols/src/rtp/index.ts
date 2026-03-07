/**
 * @fileoverview RTP (Real-time Transport Protocol) implementation
 * @module @vcomm/protocols/rtp
 */

import {
  RTPHeader,
  RTPPacket,
  RTPExtension,
  RTPPayloadType,
  RTPStats,
  RTPError,
} from '../types';

/**
 * RTP packet parser and builder
 */
export class RTPPacketHandler {
  private static readonly MIN_HEADER_SIZE = 12;
  private static readonly VERSION = 2;
  
  /**
   * Parse an RTP packet from bytes
   */
  static parse(data: Uint8Array): RTPPacket {
    if (data.length < this.MIN_HEADER_SIZE) {
      throw new RTPError('RTP packet too short');
    }
    
    const firstByte = data[0];
    const version = (firstByte >> 6) & 0x03;
    
    if (version !== this.VERSION) {
      throw new RTPError(`Invalid RTP version: ${version}`);
    }
    
    const padding = (firstByte & 0x20) !== 0;
    const extension = (firstByte & 0x10) !== 0;
    const csrcCount = firstByte & 0x0f;
    
    const secondByte = data[1];
    const marker = (secondByte & 0x80) !== 0;
    const payloadType = secondByte & 0x7f;
    
    const sequenceNumber = (data[2] << 8) | data[3];
    const timestamp = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
    const ssrc = (data[8] << 24) | (data[9] << 16) | (data[10] << 8) | data[11];
    
    let offset = this.MIN_HEADER_SIZE;
    
    // Parse CSRC list
    const csrcList: number[] = [];
    for (let i = 0; i < csrcCount && offset + 4 <= data.length; i++) {
      csrcList.push((data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]);
      offset += 4;
    }
    
    // Parse extensions if present
    let extensions: RTPExtension[] | undefined;
    if (extension && offset + 4 <= data.length) {
      extensions = this.parseExtensions(data, offset);
      // Skip extension header + data
      const extLength = (data[offset + 2] << 8) | data[offset + 3];
      offset += 4 + extLength * 4;
    }
    
    // Calculate payload start and handle padding
    let payloadEnd = data.length;
    if (padding && data.length > 0) {
      const paddingLength = data[data.length - 1];
      payloadEnd -= paddingLength;
    }
    
    const payload = data.slice(offset, payloadEnd);
    
    return {
      header: {
        version,
        padding,
        extension,
        csrcCount,
        marker,
        payloadType,
        sequenceNumber,
        timestamp,
        ssrc,
        csrcList,
        extensions,
      },
      payload,
      raw: data,
    };
  }
  
  /**
   * Build an RTP packet from components
   */
  static build(
    payload: Uint8Array,
    options: {
      ssrc: number;
      sequenceNumber: number;
      timestamp: number;
      payloadType: number;
      marker?: boolean;
      csrcList?: number[];
      extensions?: RTPExtension[];
      padding?: number;
    }
  ): Uint8Array {
    const { ssrc, sequenceNumber, timestamp, payloadType, marker = false, csrcList = [], extensions } = options;
    
    // Calculate total size
    let headerSize = this.MIN_HEADER_SIZE + csrcList.length * 4;
    let extensionData: Uint8Array | undefined;
    
    if (extensions && extensions.length > 0) {
      extensionData = this.buildExtensions(extensions);
      headerSize += 4 + extensionData.length;
    }
    
    const totalSize = headerSize + payload.length + (options.padding ?? 0);
    const packet = new Uint8Array(totalSize);
    
    // Build header
    const firstByte = (this.VERSION << 6) | 
                     (options.padding ? 0x20 : 0) | 
                     (extensions ? 0x10 : 0) | 
                     (csrcList.length & 0x0f);
    packet[0] = firstByte;
    
    packet[1] = (marker ? 0x80 : 0) | (payloadType & 0x7f);
    packet[2] = (sequenceNumber >> 8) & 0xff;
    packet[3] = sequenceNumber & 0xff;
    packet[4] = (timestamp >> 24) & 0xff;
    packet[5] = (timestamp >> 16) & 0xff;
    packet[6] = (timestamp >> 8) & 0xff;
    packet[7] = timestamp & 0xff;
    packet[8] = (ssrc >> 24) & 0xff;
    packet[9] = (ssrc >> 16) & 0xff;
    packet[10] = (ssrc >> 8) & 0xff;
    packet[11] = ssrc & 0xff;
    
    let offset = this.MIN_HEADER_SIZE;
    
    // Add CSRCs
    for (const csrc of csrcList) {
      packet[offset++] = (csrc >> 24) & 0xff;
      packet[offset++] = (csrc >> 16) & 0xff;
      packet[offset++] = (csrc >> 8) & 0xff;
      packet[offset++] = csrc & 0xff;
    }
    
    // Add extensions
    if (extensionData) {
      packet.set(extensionData, offset);
      offset += extensionData.length;
    }
    
    // Add payload
    packet.set(payload, offset);
    
    // Add padding
    if (options.padding && options.padding > 0) {
      packet[packet.length - 1] = options.padding;
    }
    
    return packet;
  }
  
  /**
   * Parse RTP header extensions
   */
  private static parseExtensions(data: Uint8Array, offset: number): RTPExtension[] {
    // Extension header: profile (2 bytes) + length (2 bytes)
    const profile = (data[offset] << 8) | data[offset + 1];
    const length = (data[offset + 2] << 8) | data[offset + 3];
    
    const extensions: RTPExtension[] = [];
    let pos = offset + 4;
    const end = pos + length * 4;
    
    if (profile === 0xBEDE) {
      // One-byte header extension (RFC 5285)
      while (pos < end) {
        const byte = data[pos++];
        if (byte === 0) continue; // Padding
        
        const id = (byte >> 4) & 0x0f;
        const len = (byte & 0x0f) + 1;
        
        extensions.push({
          id,
          data: data.slice(pos, pos + len),
        });
        
        pos += len;
      }
    } else if ((profile & 0xfff0) === 0x1000) {
      // Two-byte header extension (RFC 5285)
      while (pos < end) {
        const id = data[pos++];
        const len = data[pos++];
        
        if (id === 0) continue; // Padding
        
        extensions.push({
          id,
          data: data.slice(pos, pos + len),
        });
        
        pos += len;
      }
    }
    
    return extensions;
  }
  
  /**
   * Build extension data
   */
  private static buildExtensions(extensions: RTPExtension[]): Uint8Array {
    // Use one-byte header format
    let extensionSize = 0;
    for (const ext of extensions) {
      extensionSize += 1 + ext.data.length; // 1 byte header + data
    }
    
    // Pad to 4-byte boundary
    const padding = (4 - (extensionSize % 4)) % 4;
    const totalLength = 4 + extensionSize + padding; // 4 bytes header + data + padding
    const lengthInWords = (totalLength - 4) / 4;
    
    const data = new Uint8Array(totalLength);
    data[0] = 0xBE; // Profile
    data[1] = 0xDE;
    data[2] = lengthInWords >> 8;
    data[3] = lengthInWords & 0xff;
    
    let offset = 4;
    for (const ext of extensions) {
      data[offset++] = ((ext.id & 0x0f) << 4) | ((ext.data.length - 1) & 0x0f);
      data.set(ext.data, offset);
      offset += ext.data.length;
    }
    
    return data;
  }
}

/**
 * RTP session statistics tracker
 */
export class RTPStatsTracker {
  private packetsSent = 0;
  private bytesSent = 0;
  private packetsReceived = 0;
  private bytesReceived = 0;
  private packetsLost = 0;
  private lastSequenceNumber = 0;
  private transit = 0;
  private jitter = 0;
  private maxJitter = 0;
  private lastSenderReportNTP = 0;
  private lastSenderReportTime = 0;
  
  /**
   * Record a sent packet
   */
  recordSent(packet: RTPPacket): void {
    this.packetsSent++;
    this.bytesSent += packet.payload.length;
  }
  
  /**
   * Record a received packet
   */
  recordReceived(packet: RTPPacket): void {
    this.packetsReceived++;
    this.bytesReceived += packet.payload.length;
    
    // Detect packet loss
    const expectedSeq = (this.lastSequenceNumber + 1) & 0xffff;
    if (this.packetsReceived > 1 && packet.header.sequenceNumber !== expectedSeq) {
      const diff = (packet.header.sequenceNumber - expectedSeq) & 0xffff;
      if (diff < 0x8000) {
        this.packetsLost += diff;
      }
    }
    this.lastSequenceNumber = packet.header.sequenceNumber;
    
    // Calculate jitter (RFC 3550)
    const arrival = Date.now() * 1000; // Convert to microseconds
    const transit = arrival - packet.header.timestamp;
    const d = Math.abs(transit - this.transit);
    this.transit = transit;
    this.jitter += (d - this.jitter) / 16;
    this.maxJitter = Math.max(this.maxJitter, this.jitter);
  }
  
  /**
   * Record sender report for RTT calculation
   */
  recordSenderReport(ntpMsw: number, ntpLsw: number): void {
    this.lastSenderReportNTP = (ntpMsw * 65536.0) + (ntpLsw / 65536.0);
    this.lastSenderReportTime = Date.now();
  }
  
  /**
   * Get current statistics
   */
  getStats(): RTPStats {
    return {
      packetsSent: this.packetsSent,
      bytesSent: this.bytesSent,
      packetsReceived: this.packetsReceived,
      bytesReceived: this.bytesReceived,
      packetsLost: this.packetsLost,
      jitter: this.jitter / 1000, // Convert to milliseconds
      rtt: this.calculateRTT(),
    };
  }
  
  /**
   * Calculate RTT
   */
  private calculateRTT(): number {
    if (this.lastSenderReportNTP === 0) return 0;
    
    const nowNTP = Date.now() * 65536.0;
    return (nowNTP - this.lastSenderReportNTP) / 1000; // Convert to milliseconds
  }
  
  /**
   * Reset statistics
   */
  reset(): void {
    this.packetsSent = 0;
    this.bytesSent = 0;
    this.packetsReceived = 0;
    this.bytesReceived = 0;
    this.packetsLost = 0;
    this.lastSequenceNumber = 0;
    this.jitter = 0;
    this.maxJitter = 0;
  }
}

/**
 * Create a sequence number generator
 */
export function createSequenceGenerator(initialValue: number = 0): () => number {
  let sequence = initialValue;
  return () => {
    const current = sequence;
    sequence = (sequence + 1) & 0xffff;
    return current;
  };
}

/**
 * Create a timestamp generator for a given clock rate
 */
export function createTimestampGenerator(clockRate: number): (samples: number) => number {
  let timestamp = Math.floor(Math.random() * 0xffffffff);
  return (samples: number) => {
    const current = timestamp;
    timestamp = (timestamp + samples) >>> 0;
    return current;
  };
}

// Default export
export default {
  RTPPacketHandler,
  RTPStatsTracker,
  createSequenceGenerator,
  createTimestampGenerator,
};