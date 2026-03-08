/**
 * @fileoverview RTCP (Real-time Control Protocol) implementation
 * @module @vcomm/protocols/rtcp
 */

import {
  RTCPPacketType,
  RTCPHeader,
  RTCPSenderReport,
  RTCPReceiverReport,
  RTCPReportBlock,
  RTCPSDES,
  RTCPBye,
  RTCPFeedback,
  SDESItem,
  SDESType,
  RTCPFeedbackType,
  RTCPError,
} from '../types';

/**
 * RTCP packet parser and builder
 */
export class RTCPPacketHandler {
  private static readonly VERSION = 2;
  private static readonly HEADER_SIZE = 4;
  
  /**
   * Parse RTCP packets from bytes (compound packet support)
   */
  static parse(data: Uint8Array): (RTCPSenderReport | RTCPReceiverReport | RTCPSDES | RTCPBye | RTCPFeedback)[] {
    const packets: (RTCPSenderReport | RTCPReceiverReport | RTCPSDES | RTCPBye | RTCPFeedback)[] = [];
    let offset = 0;
    
    while (offset < data.length) {
      if (offset + 4 > data.length) break;
      
      const header = this.parseHeader(data, offset);
      const packetLength = (header.length + 1) * 4;
      
      if (offset + packetLength > data.length) break;
      
      const packetData = data.slice(offset, offset + packetLength);
      
      switch (header.packetType) {
        case RTCPPacketType.SENDER_REPORT:
          packets.push(this.parseSenderReport(packetData, header));
          break;
        case RTCPPacketType.RECEIVER_REPORT:
          packets.push(this.parseReceiverReport(packetData, header));
          break;
        case RTCPPacketType.SOURCE_DESCRIPTION:
          packets.push(this.parseSDES(packetData, header));
          break;
        case RTCPPacketType.BYE:
          packets.push(this.parseBye(packetData, header));
          break;
        case RTCPPacketType.RTP_FEEDBACK:
        case RTCPPacketType.PAYLOAD_SPECIFIC_FEEDBACK:
          packets.push(this.parseFeedback(packetData, header));
          break;
      }
      
      offset += packetLength;
    }
    
    return packets;
  }
  
  /**
   * Parse RTCP header
   */
  private static parseHeader(data: Uint8Array, offset: number): RTCPHeader {
    const firstByte = data[offset];
    const version = (firstByte >> 6) & 0x03;
    const padding = (firstByte & 0x20) !== 0;
    const reportCount = firstByte & 0x1f;
    const packetType = data[offset + 1];
    const length = (data[offset + 2] << 8) | data[offset + 3];
    
    return { version, padding, reportCount, packetType, length };
  }
  
  /**
   * Parse Sender Report
   */
  private static parseSenderReport(data: Uint8Array, header: RTCPHeader): RTCPSenderReport {
    const ssrc = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
    const ntpMsw = (data[8] << 24) | (data[9] << 16) | (data[10] << 8) | data[11];
    const ntpLsw = (data[12] << 24) | (data[13] << 16) | (data[14] << 8) | data[15];
    const rtpTimestamp = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
    const senderPacketCount = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
    const senderOctetCount = (data[24] << 24) | (data[25] << 16) | (data[26] << 8) | data[27];
    
    const reportBlocks: RTCPReportBlock[] = [];
    let offset = 28;
    
    for (let i = 0; i < header.reportCount && offset + 24 <= data.length; i++) {
      reportBlocks.push(this.parseReportBlock(data, offset));
      offset += 24;
    }
    
    return {
      ssrc,
      ntpMsw,
      ntpLsw,
      rtpTimestamp,
      senderPacketCount,
      senderOctetCount,
      reportBlocks,
    };
  }
  
  /**
   * Parse Receiver Report
   */
  private static parseReceiverReport(data: Uint8Array, header: RTCPHeader): RTCPReceiverReport {
    const ssrc = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
    
    const reportBlocks: RTCPReportBlock[] = [];
    let offset = 8;
    
    for (let i = 0; i < header.reportCount && offset + 24 <= data.length; i++) {
      reportBlocks.push(this.parseReportBlock(data, offset));
      offset += 24;
    }
    
    return { ssrc, reportBlocks };
  }
  
  /**
   * Parse report block
   */
  private static parseReportBlock(data: Uint8Array, offset: number): RTCPReportBlock {
    return {
      ssrc: (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3],
      fractionLost: data[offset + 4],
      cumulativePacketsLost: ((data[offset + 5] << 16) | (data[offset + 6] << 8) | data[offset + 7]) & 0xffffff,
      extendedHighestSequenceNumber: (data[offset + 8] << 24) | (data[offset + 9] << 16) | (data[offset + 10] << 8) | data[offset + 11],
      jitter: (data[offset + 12] << 24) | (data[offset + 13] << 16) | (data[offset + 14] << 8) | data[offset + 15],
      lastSenderReportTimestamp: (data[offset + 16] << 24) | (data[offset + 17] << 16) | (data[offset + 18] << 8) | data[offset + 19],
      delaySinceLastSenderReport: (data[offset + 20] << 24) | (data[offset + 21] << 16) | (data[offset + 22] << 8) | data[offset + 23],
    };
  }
  
  /**
   * Parse SDES
   */
  private static parseSDES(data: Uint8Array, header: RTCPHeader): RTCPSDES {
    let result: RTCPSDES | null = null;
    let offset = 4;
    
    for (let i = 0; i < header.reportCount && offset < data.length; i++) {
      const ssrc = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
      offset += 4;
      
      const items: SDESItem[] = [];
      
      while (offset < data.length && data[offset] !== SDESType.END) {
        const type = data[offset++];
        const length = data[offset++];
        const value = new TextDecoder().decode(data.slice(offset, offset + length));
        offset += length;
        
        items.push({ type, value });
      }
      
      // Skip padding
      while (offset < data.length && (offset % 4) !== 0) offset++;
      
      // Return the first valid SDES
      if (!result) {
        result = { ssrc, items };
      }
    }
    
    return result ?? { ssrc: 0, items: [] };
  }
  
  /**
   * Parse BYE
   */
  private static parseBye(data: Uint8Array, header: RTCPHeader): RTCPBye {
    const ssrcs: number[] = [];
    let offset = 4;
    
    for (let i = 0; i < header.reportCount && offset + 4 <= data.length; i++) {
      ssrcs.push((data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3]);
      offset += 4;
    }
    
    let reason: string | undefined;
    if (offset < data.length) {
      const reasonLength = data[offset++];
      reason = new TextDecoder().decode(data.slice(offset, offset + reasonLength));
    }
    
    return { ssrcs, reason };
  }
  
  /**
   * Parse Feedback
   */
  private static parseFeedback(data: Uint8Array, header: RTCPHeader): RTCPFeedback {
    const senderSsrc = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];
    const mediaSourceSsrc = (data[8] << 24) | (data[9] << 16) | (data[10] << 8) | data[11];
    const fci = data.slice(12);
    
    return {
      feedbackType: header.reportCount as unknown as RTCPFeedbackType,
      senderSsrc,
      mediaSourceSsrc,
      fci,
    };
  }
  
  /**
   * Build Sender Report
   */
  static buildSenderReport(
    ssrc: number,
    ntpTime: { msw: number; lsw: number },
    rtpTimestamp: number,
    packetCount: number,
    octetCount: number,
    reportBlocks: RTCPReportBlock[] = []
  ): Uint8Array {
    const length = 6 + reportBlocks.length * 6; // In 32-bit words minus 1
    const data = new Uint8Array((length + 1) * 4);
    
    data[0] = (this.VERSION << 6) | reportBlocks.length;
    data[1] = RTCPPacketType.SENDER_REPORT;
    data[2] = (length >> 8) & 0xff;
    data[3] = length & 0xff;
    
    // SSRC
    data[4] = (ssrc >> 24) & 0xff;
    data[5] = (ssrc >> 16) & 0xff;
    data[6] = (ssrc >> 8) & 0xff;
    data[7] = ssrc & 0xff;
    
    // NTP timestamp
    data[8] = (ntpTime.msw >> 24) & 0xff;
    data[9] = (ntpTime.msw >> 16) & 0xff;
    data[10] = (ntpTime.msw >> 8) & 0xff;
    data[11] = ntpTime.msw & 0xff;
    data[12] = (ntpTime.lsw >> 24) & 0xff;
    data[13] = (ntpTime.lsw >> 16) & 0xff;
    data[14] = (ntpTime.lsw >> 8) & 0xff;
    data[15] = ntpTime.lsw & 0xff;
    
    // RTP timestamp
    data[16] = (rtpTimestamp >> 24) & 0xff;
    data[17] = (rtpTimestamp >> 16) & 0xff;
    data[18] = (rtpTimestamp >> 8) & 0xff;
    data[19] = rtpTimestamp & 0xff;
    
    // Packet count
    data[20] = (packetCount >> 24) & 0xff;
    data[21] = (packetCount >> 16) & 0xff;
    data[22] = (packetCount >> 8) & 0xff;
    data[23] = packetCount & 0xff;
    
    // Octet count
    data[24] = (octetCount >> 24) & 0xff;
    data[25] = (octetCount >> 16) & 0xff;
    data[26] = (octetCount >> 8) & 0xff;
    data[27] = octetCount & 0xff;
    
    // Report blocks
    let offset = 28;
    for (const block of reportBlocks) {
      this.writeReportBlock(data, offset, block);
      offset += 24;
    }
    
    return data;
  }
  
  /**
   * Build Receiver Report
   */
  static buildReceiverReport(
    ssrc: number,
    reportBlocks: RTCPReportBlock[] = []
  ): Uint8Array {
    const length = 1 + reportBlocks.length * 6;
    const data = new Uint8Array((length + 1) * 4);
    
    data[0] = (this.VERSION << 6) | reportBlocks.length;
    data[1] = RTCPPacketType.RECEIVER_REPORT;
    data[2] = (length >> 8) & 0xff;
    data[3] = length & 0xff;
    
    data[4] = (ssrc >> 24) & 0xff;
    data[5] = (ssrc >> 16) & 0xff;
    data[6] = (ssrc >> 8) & 0xff;
    data[7] = ssrc & 0xff;
    
    let offset = 8;
    for (const block of reportBlocks) {
      this.writeReportBlock(data, offset, block);
      offset += 24;
    }
    
    return data;
  }
  
  /**
   * Build SDES
   */
  static buildSDES(sdesList: { ssrc: number; items: SDESItem[] }[]): Uint8Array {
    const chunks: number[] = [];
    
    for (const { ssrc, items } of sdesList) {
      // SSRC
      chunks.push((ssrc >> 24) & 0xff, (ssrc >> 16) & 0xff, (ssrc >> 8) & 0xff, ssrc & 0xff);
      
      // Items
      for (const item of items) {
        chunks.push(item.type, item.value.length);
        for (let i = 0; i < item.value.length; i++) {
          chunks.push(item.value.charCodeAt(i));
        }
      }
      
      // Null terminator + padding
      chunks.push(0);
      while (chunks.length % 4 !== 0) chunks.push(0);
    }
    
    const data = new Uint8Array(4 + chunks.length);
    data[0] = (this.VERSION << 6) | sdesList.length;
    data[1] = RTCPPacketType.SOURCE_DESCRIPTION;
    data[2] = ((chunks.length / 4) >> 8) & 0xff;
    data[3] = (chunks.length / 4) & 0xff;
    
    for (let i = 0; i < chunks.length; i++) {
      data[4 + i] = chunks[i];
    }
    
    return data;
  }
  
  /**
   * Build NACK (Negative Acknowledgment)
   */
  static buildNACK(
    senderSsrc: number,
    mediaSourceSsrc: number,
    lostPackets: { pid: number; blp: number }[]
  ): Uint8Array {
    const fciLength = lostPackets.length * 4;
    const length = 2 + (fciLength / 4);
    const data = new Uint8Array((length + 1) * 4);
    
    data[0] = (this.VERSION << 6) | RTCPFeedbackType.NACK;
    data[1] = RTCPPacketType.RTP_FEEDBACK;
    data[2] = (length >> 8) & 0xff;
    data[3] = length & 0xff;
    
    // Sender SSRC
    data[4] = (senderSsrc >> 24) & 0xff;
    data[5] = (senderSsrc >> 16) & 0xff;
    data[6] = (senderSsrc >> 8) & 0xff;
    data[7] = senderSsrc & 0xff;
    
    // Media source SSRC
    data[8] = (mediaSourceSsrc >> 24) & 0xff;
    data[9] = (mediaSourceSsrc >> 16) & 0xff;
    data[10] = (mediaSourceSsrc >> 8) & 0xff;
    data[11] = mediaSourceSsrc & 0xff;
    
    // FCI
    let offset = 12;
    for (const { pid, blp } of lostPackets) {
      data[offset++] = (pid >> 8) & 0xff;
      data[offset++] = pid & 0xff;
      data[offset++] = (blp >> 8) & 0xff;
      data[offset++] = blp & 0xff;
    }
    
    return data;
  }
  
  /**
   * Build PLI (Picture Loss Indication)
   */
  static buildPLI(senderSsrc: number, mediaSourceSsrc: number): Uint8Array {
    const data = new Uint8Array(12);
    
    data[0] = (this.VERSION << 6) | RTCPFeedbackType.PLI;
    data[1] = RTCPPacketType.PAYLOAD_SPECIFIC_FEEDBACK;
    data[2] = 0;
    data[3] = 2; // Length = 2 (8 bytes)
    
    data[4] = (senderSsrc >> 24) & 0xff;
    data[5] = (senderSsrc >> 16) & 0xff;
    data[6] = (senderSsrc >> 8) & 0xff;
    data[7] = senderSsrc & 0xff;
    
    data[8] = (mediaSourceSsrc >> 24) & 0xff;
    data[9] = (mediaSourceSsrc >> 16) & 0xff;
    data[10] = (mediaSourceSsrc >> 8) & 0xff;
    data[11] = mediaSourceSsrc & 0xff;
    
    return data;
  }
  
  /**
   * Write report block to buffer
   */
  private static writeReportBlock(data: Uint8Array, offset: number, block: RTCPReportBlock): void {
    data[offset] = (block.ssrc >> 24) & 0xff;
    data[offset + 1] = (block.ssrc >> 16) & 0xff;
    data[offset + 2] = (block.ssrc >> 8) & 0xff;
    data[offset + 3] = block.ssrc & 0xff;
    data[offset + 4] = block.fractionLost;
    data[offset + 5] = (block.cumulativePacketsLost >> 16) & 0xff;
    data[offset + 6] = (block.cumulativePacketsLost >> 8) & 0xff;
    data[offset + 7] = block.cumulativePacketsLost & 0xff;
    data[offset + 8] = (block.extendedHighestSequenceNumber >> 24) & 0xff;
    data[offset + 9] = (block.extendedHighestSequenceNumber >> 16) & 0xff;
    data[offset + 10] = (block.extendedHighestSequenceNumber >> 8) & 0xff;
    data[offset + 11] = block.extendedHighestSequenceNumber & 0xff;
    data[offset + 12] = (block.jitter >> 24) & 0xff;
    data[offset + 13] = (block.jitter >> 16) & 0xff;
    data[offset + 14] = (block.jitter >> 8) & 0xff;
    data[offset + 15] = block.jitter & 0xff;
    data[offset + 16] = (block.lastSenderReportTimestamp >> 24) & 0xff;
    data[offset + 17] = (block.lastSenderReportTimestamp >> 16) & 0xff;
    data[offset + 18] = (block.lastSenderReportTimestamp >> 8) & 0xff;
    data[offset + 19] = block.lastSenderReportTimestamp & 0xff;
    data[offset + 20] = (block.delaySinceLastSenderReport >> 24) & 0xff;
    data[offset + 21] = (block.delaySinceLastSenderReport >> 16) & 0xff;
    data[offset + 22] = (block.delaySinceLastSenderReport >> 8) & 0xff;
    data[offset + 23] = block.delaySinceLastSenderReport & 0xff;
  }
}

/**
 * Get current NTP time
 */
export function getNTPTime(): { msw: number; lsw: number } {
  const now = Date.now();
  const seconds = now / 1000;
  const msw = Math.floor(seconds + 2208988800); // NTP epoch offset
  const lsw = Math.floor(((seconds % 1) * 4294967296));
  return { msw, lsw };
}

/**
 * Convert NTP time to Date
 */
export function ntpToDate(ntpMsw: number, ntpLsw: number): Date {
  const seconds = ntpMsw - 2208988800;
  const fraction = ntpLsw / 4294967296;
  return new Date((seconds + fraction) * 1000);
}

// Default export
export default {
  RTCPPacketHandler,
  getNTPTime,
  ntpToDate,
};