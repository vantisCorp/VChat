/**
 * @fileoverview UDP packet handling for V-COMM
 * @module @vcomm/protocols/udp
 */

import {
  UDPPacket,
  // UDPSocketOptions,
  // ProtocolError,
} from '../types';

// ============================================================================
// UDP PACKET HANDLER
// ============================================================================

/**
 * UDP Packet Handler
 * Handles UDP packet creation, parsing, and manipulation
 */
export class UDPPacketHandler {
  private static readonly MAX_UDP_SIZE = 65507; // Max UDP payload size
  private static readonly RECOMMENDED_MTU = 1400; // Recommended for WebRTC

  /**
   * Create a UDP packet
   */
  static createPacket(
    sourceAddress: string,
    sourcePort: number,
    destinationAddress: string,
    destinationPort: number,
    payload: Uint8Array
  ): UDPPacket {
    return {
      sourceAddress,
      sourcePort,
      destinationAddress,
      destinationPort,
      payload,
      timestamp: Date.now(),
    };
  }

  /**
   * Validate packet size
   */
  static validateSize(payload: Uint8Array): boolean {
    return payload.length <= this.MAX_UDP_SIZE;
  }

  /**
   * Check if payload fits in recommended MTU
   */
  static fitsMTU(payload: Uint8Array, mtu: number = this.RECOMMENDED_MTU): boolean {
    return payload.length <= mtu;
  }

  /**
   * Fragment payload for MTU
   */
  static fragment(
    payload: Uint8Array,
    mtu: number = this.RECOMMENDED_MTU
  ): Uint8Array[] {
    const fragments: Uint8Array[] = [];
    let offset = 0;

    while (offset < payload.length) {
      const size = Math.min(mtu, payload.length - offset);
      fragments.push(payload.slice(offset, offset + size));
      offset += size;
    }

    return fragments;
  }

  /**
   * Calculate checksum (simple)
   */
  static calculateChecksum(data: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum = (sum + data[i]) & 0xffff;
    }
    return sum;
  }

  /**
   * Verify checksum
   */
  static verifyChecksum(data: Uint8Array, expectedChecksum: number): boolean {
    return this.calculateChecksum(data) === expectedChecksum;
  }

  /**
   * Get packet info string
   */
  static getPacketInfo(packet: UDPPacket): string {
    return `${packet.sourceAddress}:${packet.sourcePort} -> ${packet.destinationAddress}:${packet.destinationPort} (${packet.payload.length} bytes)`;
  }
}

// ============================================================================
// UDP PACKET BUFFER
// ============================================================================

/**
 * UDP Packet Buffer
 * Manages packet reordering and buffering
 */
export class UDPPacketBuffer {
  private buffer: Map<number, { packet: UDPPacket; timestamp: number }> = new Map();
  private nextSequence: number = 0;
  private readonly maxSize: number;
  private readonly maxAge: number;

  constructor(maxSize: number = 1000, maxAge: number = 5000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  /**
   * Add packet to buffer
   */
  add(sequence: number, packet: UDPPacket): void {
    // Prune old packets
    this.prune();

    // Don't exceed max size
    if (this.buffer.size >= this.maxSize) {
      // Remove oldest
      let oldestSeq = -1;
      let oldestTime = Infinity;
      for (const [seq, item] of this.buffer) {
        if (item.timestamp < oldestTime) {
          oldestTime = item.timestamp;
          oldestSeq = seq;
        }
      }
      if (oldestSeq >= 0) {
        this.buffer.delete(oldestSeq);
      }
    }

    this.buffer.set(sequence, { packet, timestamp: Date.now() });
  }

  /**
   * Get next packet in sequence
   */
  getNext(): UDPPacket | null {
    const item = this.buffer.get(this.nextSequence);
    if (item) {
      this.buffer.delete(this.nextSequence);
      this.nextSequence++;
      return item.packet;
    }
    return null;
  }

  /**
   * Get all available packets in order
   */
  getAvailable(): UDPPacket[] {
    const packets: UDPPacket[] = [];
    let packet: UDPPacket | null;

    while ((packet = this.getNext()) !== null) {
      packets.push(packet);
    }

    return packets;
  }

  /**
   * Check if packet is available
   */
  hasNext(): boolean {
    return this.buffer.has(this.nextSequence);
  }

  /**
   * Get buffer size
   */
  size(): number {
    return this.buffer.size;
  }

  /**
   * Get current sequence
   */
  getSequence(): number {
    return this.nextSequence;
  }

  /**
   * Reset buffer
   */
  reset(): void {
    this.buffer.clear();
    this.nextSequence = 0;
  }

  /**
   * Skip to sequence
   */
  skipTo(sequence: number): void {
    // Remove all packets before this sequence
    for (const [seq] of this.buffer) {
      if (seq < sequence) {
        this.buffer.delete(seq);
      }
    }
    this.nextSequence = sequence;
  }

  /**
   * Remove old packets
   */
  private prune(): void {
    const cutoff = Date.now() - this.maxAge;
    for (const [seq, item] of this.buffer) {
      if (item.timestamp < cutoff) {
        this.buffer.delete(seq);
      }
    }
  }

  /**
   * Get missing sequences
   */
  getMissingSequences(maxGap: number = 100): number[] {
    const missing: number[] = [];
    const sequences = Array.from(this.buffer.keys()).sort((a, b) => a - b);

    if (sequences.length === 0) return missing;

    let expected = this.nextSequence;
    for (const seq of sequences) {
      while (expected < seq && missing.length < maxGap) {
        missing.push(expected);
        expected++;
      }
      if (expected === seq) {
        expected++;
      }
    }

    return missing;
  }
}

// ============================================================================
// UDP STATISTICS
// ============================================================================

/**
 * UDP Statistics Tracker
 * Tracks UDP packet statistics
 */
export class UDPStatistics {
  private packetsSent: number = 0;
  private packetsReceived: number = 0;
  private bytesSent: number = 0;
  private bytesReceived: number = 0;
  private packetsDropped: number = 0;
  private outOfOrder: number = 0;
  private duplicates: number = 0;
  private startTime: number = Date.now();

  /**
   * Record sent packet
   */
  recordSent(bytes: number): void {
    this.packetsSent++;
    this.bytesSent += bytes;
  }

  /**
   * Record received packet
   */
  recordReceived(bytes: number): void {
    this.packetsReceived++;
    this.bytesReceived += bytes;
  }

  /**
   * Record dropped packet
   */
  recordDropped(): void {
    this.packetsDropped++;
  }

  /**
   * Record out of order packet
   */
  recordOutOfOrder(): void {
    this.outOfOrder++;
  }

  /**
   * Record duplicate packet
   */
  recordDuplicate(): void {
    this.duplicates++;
  }

  /**
   * Get statistics
   */
  getStats(): {
    packetsSent: number;
    packetsReceived: number;
    bytesSent: number;
    bytesReceived: number;
    packetsDropped: number;
    outOfOrder: number;
    duplicates: number;
    sendRate: number;
    receiveRate: number;
    dropRate: number;
    duration: number;
  } {
    const duration = (Date.now() - this.startTime) / 1000;

    return {
      packetsSent: this.packetsSent,
      packetsReceived: this.packetsReceived,
      bytesSent: this.bytesSent,
      bytesReceived: this.bytesReceived,
      packetsDropped: this.packetsDropped,
      outOfOrder: this.outOfOrder,
      duplicates: this.duplicates,
      sendRate: this.packetsSent / duration,
      receiveRate: this.packetsReceived / duration,
      dropRate: this.packetsDropped / Math.max(1, this.packetsReceived + this.packetsDropped),
      duration,
    };
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.packetsSent = 0;
    this.packetsReceived = 0;
    this.bytesSent = 0;
    this.bytesReceived = 0;
    this.packetsDropped = 0;
    this.outOfOrder = 0;
    this.duplicates = 0;
    this.startTime = Date.now();
  }
}

// ============================================================================
// UDP QUALITY OF SERVICE
// ============================================================================

/**
 * UDP QoS Manager
 * Manages Quality of Service for UDP streams
 */
export class UDPQoSManager {
  private priorities: Map<string, number> = new Map();
  private bandwidth: Map<string, { sent: number; timestamp: number }> = new Map();
  private readonly maxBandwidth: number;

  constructor(maxBandwidth: number = 10 * 1024 * 1024) { // 10 Mbps default
    this.maxBandwidth = maxBandwidth;
  }

  /**
   * Set stream priority
   */
  setPriority(streamId: string, priority: number): void {
    this.priorities.set(streamId, Math.max(0, Math.min(10, priority)));
  }

  /**
   * Get stream priority
   */
  getPriority(streamId: string): number {
    return this.priorities.get(streamId) || 5;
  }

  /**
   * Record bandwidth usage
   */
  recordBandwidth(streamId: string, bytes: number): void {
    this.bandwidth.set(streamId, {
      sent: bytes,
      timestamp: Date.now(),
    });
  }

  /**
   * Get current bandwidth usage
   */
  getBandwidthUsage(): number {
    let total = 0;
    const now = Date.now();

    for (const [, data] of this.bandwidth) {
      if (now - data.timestamp < 1000) {
        total += data.sent;
      }
    }

    return total;
  }

  /**
   * Check if bandwidth available
   */
  hasBandwidth(bytes: number): boolean {
    return this.getBandwidthUsage() + bytes <= this.maxBandwidth;
  }

  /**
   * Get allowed bandwidth for stream
   */
  getAllowedBandwidth(streamId: string): number {
    const priority = this.getPriority(streamId);
    const currentUsage = this.getBandwidthUsage();
    const available = this.maxBandwidth - currentUsage;

    // Allocate based on priority ratio
    let totalPriority = 0;
    for (const [, p] of this.priorities) {
      totalPriority += p;
    }

    if (totalPriority === 0) return available;

    return Math.floor((priority / totalPriority) * available);
  }

  /**
   * Clear stream
   */
  clearStream(streamId: string): void {
    this.priorities.delete(streamId);
    this.bandwidth.delete(streamId);
  }

  /**
   * Clear all
   */
  clear(): void {
    this.priorities.clear();
    this.bandwidth.clear();
  }
}

// ============================================================================
// UDP CONGESTION CONTROL
// ============================================================================

/**
 * UDP Congestion Control
 * Implements simple congestion control for UDP
 */
export class UDPCongestionControl {
  private cwnd: number; // Congestion window
  private ssthresh: number; // Slow start threshold
  private readonly minCwnd: number = 1000;
  private readonly maxCwnd: number;
  private readonly mtu: number;
  private lossEvents: number = 0;
  private lastLossTime: number = 0;

  constructor(mtu: number = 1400, maxCwnd: number = 1024 * 1024) {
    this.mtu = mtu;
    this.maxCwnd = maxCwnd;
    this.cwnd = 2 * mtu; // Initial window
    this.ssthresh = maxCwnd;
  }

  /**
   * Get current congestion window
   */
  getCongestionWindow(): number {
    return this.cwnd;
  }

  /**
   * Get bytes that can be sent
   */
  getAvailableWindow(): number {
    return this.cwnd;
  }

  /**
   * On packet acknowledged - increase window
   */
  onAck(bytes: number): void {
    if (this.cwnd < this.ssthresh) {
      // Slow start: exponential increase
      this.cwnd += bytes;
    } else {
      // Congestion avoidance: linear increase
      this.cwnd += (this.mtu * bytes) / this.cwnd;
    }

    this.cwnd = Math.min(this.cwnd, this.maxCwnd);
  }

  /**
   * On packet loss - decrease window
   */
  onLoss(): void {
    const now = Date.now();

    // Check if this is a new loss event (within RTT)
    if (now - this.lastLossTime > 100) {
      this.lossEvents++;
      this.lastLossTime = now;

      // Halve the congestion window (multiplicative decrease)
      this.ssthresh = Math.max(this.cwnd / 2, this.minCwnd);
      this.cwnd = Math.max(this.ssthresh, this.minCwnd);
    }
  }

  /**
   * On timeout - reset to slow start
   */
  onTimeout(): void {
    this.ssthresh = Math.max(this.cwnd / 2, this.minCwnd);
    this.cwnd = this.minCwnd;
    this.lossEvents++;
  }

  /**
   * Get statistics
   */
  getStats(): {
    congestionWindow: number;
    slowStartThreshold: number;
    lossEvents: number;
    inSlowStart: boolean;
  } {
    return {
      congestionWindow: this.cwnd,
      slowStartThreshold: this.ssthresh,
      lossEvents: this.lossEvents,
      inSlowStart: this.cwnd < this.ssthresh,
    };
  }

  /**
   * Reset
   */
  reset(): void {
    this.cwnd = 2 * this.mtu;
    this.ssthresh = this.maxCwnd;
    this.lossEvents = 0;
    this.lastLossTime = 0;
  }
}

// ============================================================================
// UDP SEQUENCE MANAGER
// ============================================================================

/**
 * UDP Sequence Manager
 * Manages sequence numbers for reliable delivery
 */
export class UDPSequenceManager {
  private sendSequence: number = 0;
  private receiveSequence: Map<string, number> = new Map();
  private readonly maxSequence: number = 65535;

  /**
   * Get next send sequence
   */
  nextSend(): number {
    const seq = this.sendSequence;
    this.sendSequence = (this.sendSequence + 1) % (this.maxSequence + 1);
    return seq;
  }

  /**
   * Get current send sequence
   */
  getSendSequence(): number {
    return this.sendSequence;
  }

  /**
   * Check if received sequence is expected
   */
  checkReceive(streamId: string, sequence: number): {
    expected: boolean;
    duplicate: boolean;
    gap: number;
  } {
    const expectedSeq = this.receiveSequence.get(streamId) || 0;
    const nextExpected = (expectedSeq + 1) % (this.maxSequence + 1);

    // First packet from this stream
    if (!this.receiveSequence.has(streamId)) {
      this.receiveSequence.set(streamId, sequence);
      return { expected: true, duplicate: false, gap: 0 };
    }

    // Check for duplicate
    if (sequence === expectedSeq) {
      return { expected: false, duplicate: true, gap: 0 };
    }

    // Check if this is the expected next
    if (sequence === nextExpected) {
      this.receiveSequence.set(streamId, sequence);
      return { expected: true, duplicate: false, gap: 0 };
    }

    // Out of order or gap
    let gap: number;
    if (sequence > nextExpected) {
      gap = sequence - nextExpected;
    } else {
      // Sequence wrapped
      gap = (this.maxSequence + 1 - nextExpected) + sequence;
    }

    this.receiveSequence.set(streamId, sequence);
    return { expected: false, duplicate: false, gap };
  }

  /**
   * Reset send sequence
   */
  resetSend(): void {
    this.sendSequence = 0;
  }

  /**
   * Reset receive sequence for stream
   */
  resetReceive(streamId?: string): void {
    if (streamId) {
      this.receiveSequence.delete(streamId);
    } else {
      this.receiveSequence.clear();
    }
  }

  /**
   * Reset all
   */
  reset(): void {
    this.sendSequence = 0;
    this.receiveSequence.clear();
  }
}

// ============================================================================
// UDP ADDRESS UTILITIES
// ============================================================================

/**
 * UDP Address Utilities
 * Helper functions for address parsing and manipulation
 */
export class UDPAddressUtils {
  /**
   * Parse address string
   */
  static parseAddress(address: string): { ip: string; port: number } | null {
    // IPv4 with port
    const ipv4Match = address.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$/);
    if (ipv4Match) {
      return { ip: ipv4Match[1], port: parseInt(ipv4Match[2], 10) };
    }

    // IPv6 with port (in brackets)
    const ipv6Match = address.match(/^\[([0-9a-fA-F:]+)\]:(\d+)$/);
    if (ipv6Match) {
      return { ip: ipv6Match[1], port: parseInt(ipv6Match[2], 10) };
    }

    // Without port
    return null;
  }

  /**
   * Build address string
   */
  static buildAddress(ip: string, port: number): string {
    if (ip.includes(':')) {
      // IPv6
      return `[${ip}]:${port}`;
    }
    return `${ip}:${port}`;
  }

  /**
   * Check if address is IPv4
   */
  static isIPv4(ip: string): boolean {
    return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
  }

  /**
   * Check if address is IPv6
   */
  static isIPv6(ip: string): boolean {
    return ip.includes(':');
  }

  /**
   * Check if IP is local
   */
  static isLocalIP(ip: string): boolean {
    // 127.x.x.x
    if (ip.startsWith('127.')) return true;
    // 10.x.x.x
    if (ip.startsWith('10.')) return true;
    // 172.16.x.x - 172.31.x.x
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
    // 192.168.x.x
    if (ip.startsWith('192.168.')) return true;
    // ::1 (IPv6 localhost)
    if (ip === '::1' || ip === '::') return true;
    // fc00::/7 (IPv6 ULA)
    if (/^f[cd]/i.test(ip)) return true;
    return false;
  }

  /**
   * Compare two addresses
   */
  static compareAddress(a: { ip: string; port: number }, b: { ip: string; port: number }): boolean {
    return a.ip === b.ip && a.port === b.port;
  }
}

