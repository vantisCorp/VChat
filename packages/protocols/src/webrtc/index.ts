/**
 * @fileoverview WebRTC utilities for SDP parsing/generation and ICE handling
 * @module @vcomm/protocols/webrtc
 */

import {
  ICECandidate,
  ICECandidateType,
  ICEProtocol,
  SDPSessionDescription,
  SDPMediaDescription,
  RTPMap,
  DTLSRole,
  _ICEError,
  SDPError,
} from '../types';

// ============================================================================
// SDP PARSER
// ============================================================================

/**
 * SDP Parser and Builder
 * Handles parsing and generation of Session Description Protocol
 */
export class SDPParser {
  /**
   * Parse SDP string into structured object
   */
  static parse(sdp: string): SDPSessionDescription {
    const lines = sdp.split('\r\n').filter((line) => line.length > 0);
    let session: Partial<SDPSessionDescription> = {
      version: 0,
      media: [],
      attributes: [],
    };
    let currentMedia: Partial<SDPMediaDescription> | null = null;
    let _mediaIndex = -1;

    for (const line of lines) {
      const type = line[0];
      const content = line.slice(2);

      if (type === 'v') {
        // Version
        session.version = parseInt(content, 10);
      } else if (type === 'o') {
        // Origin
        session.origin = this.parseOrigin(content);
      } else if (type === 's') {
        // Session name
        session.name = content;
      } else if (type === 'i') {
        // Session info
        session.info = content;
      } else if (type === 'c') {
        // Connection
        const conn = this.parseConnection(content);
        if (currentMedia) {
          currentMedia.connection = conn;
        } else {
          session.connection = conn;
        }
      } else if (type === 't') {
        // Timing
        session.timing = this.parseTiming(content);
      } else if (type === 'm') {
        // Media
        const media = this.parseMedia(content);
        currentMedia = {
          ...media,
          rtpmap: new Map(),
          fmtp: new Map(),
          candidates: [],
          ssrcs: new Map(),
          ssrcGroups: [],
          rids: new Map(),
          attributes: [],
        };
        session.media!.push(currentMedia as SDPMediaDescription);
        _mediaIndex++;
      } else if (type === 'a') {
        // Attribute
        if (currentMedia) {
          this.parseAttribute(content, currentMedia);
        } else {
          this.parseSessionAttribute(content, session);
        }
      } else if (type === 'b') {
        // Bandwidth
        const bw = this.parseBandwidth(content);
        if (currentMedia) {
          if (!currentMedia.bandwidth) {
            currentMedia.bandwidth = [];
          }
          currentMedia.bandwidth.push(bw);
        }
      }
    }

    return session as SDPSessionDescription;
  }

  /**
   * Build SDP string from structured object
   */
  static build(session: SDPSessionDescription): string {
    const lines: string[] = [];

    // Version
    lines.push(`v=${session.version}`);

    // Origin
    const o = session.origin;
    lines.push(
      `o=${o.username} ${o.sessionId} ${o.sessionVersion} ${o.netType} ${o.ipType} ${o.ip}`
    );

    // Session name
    lines.push(`s=${session.name}`);

    // Session info (optional)
    if (session.info) {
      lines.push(`i=${session.info}`);
    }

    // Connection (session-level)
    if (session.connection) {
      const c = session.connection;
      lines.push(`c=IN IP${c.version} ${c.ip}`);
    }

    // Timing
    const t = session.timing;
    lines.push(`t=${t.start} ${t.stop}`);

    // Session attributes
    for (const attr of session.attributes) {
      lines.push(`a=${attr}`);
    }

    // Group (if present)
    if (session.group) {
      lines.push(`a=group:${session.group.semantics} ${session.group.mids.join(' ')}`);
    }

    // Media descriptions
    for (const media of session.media) {
      lines.push(this.buildMedia(media));
    }

    return lines.join('\r\n') + '\r\n';
  }

  /**
   * Build media section
   */
  private static buildMedia(media: SDPMediaDescription): string {
    const lines: string[] = [];

    // Media line
    const payloads = media.payloads.join(' ');
    lines.push(`m=${media.type} ${media.port} ${media.protocol} ${payloads}`);

    // Connection
    if (media.connection) {
      lines.push(`c=IN IP${media.connection.version} ${media.connection.ip}`);
    }

    // Bandwidth
    if (media.bandwidth) {
      for (const bw of media.bandwidth) {
        lines.push(`b=${bw.type}:${bw.value}`);
      }
    }

    // RTCP
    if (media.rtcp) {
      const rtcpLine = media.rtcp.ip
        ? `${media.rtcp.port} ${media.rtcp.netType || 'IN'} ${media.rtcp.ipType || 'IP4'} ${media.rtcp.ip}`
        : `${media.rtcp.port}`;
      lines.push(`a=rtcp:${rtcpLine}`);
    }

    // ICE credentials
    if (media.iceUfrag) {
      lines.push(`a=ice-ufrag:${media.iceUfrag}`);
    }
    if (media.icePwd) {
      lines.push(`a=ice-pwd:${media.icePwd}`);
    }

    // DTLS fingerprint
    if (media.fingerprint) {
      lines.push(
        `a=fingerprint:${media.fingerprint.algorithm} ${media.fingerprint.value}`
      );
    }

    // Setup
    if (media.setup) {
      lines.push(`a=setup:${media.setup}`);
    }

    // MID
    if (media.mid) {
      lines.push(`a=mid:${media.mid}`);
    }

    // Direction
    if (media.direction) {
      lines.push(`a=${media.direction}`);
    }

    // RTP maps
    for (const [pt, rtp] of media.rtpmap) {
      let rtpLine = `a=rtpmap:${pt} ${rtp.name}/${rtp.clockRate}`;
      if (rtp.encodingParameters) {
        rtpLine += `/${rtp.encodingParameters}`;
      }
      lines.push(rtpLine);

      // FMTP
      const fmtp = media.fmtp.get(pt);
      if (fmtp) {
        lines.push(`a=fmtp:${pt} ${fmtp}`);
      }
    }

    // ICE candidates
    for (const candidate of media.candidates) {
      lines.push(`a=${this.buildCandidate(candidate)}`);
    }

    // SSRCs
    for (const [ssrc, attr] of media.ssrcs) {
      lines.push(`a=ssrc:${ssrc} ${attr.attribute}:${attr.value}`);
    }

    // SSRC groups
    for (const group of media.ssrcGroups) {
      lines.push(`a=ssrc-group:${group.semantics} ${group.ssrcs.join(' ')}`);
    }

    // RIDs
    for (const [rid, info] of media.rids) {
      let ridLine = `a=rid:${rid} ${info.direction}`;
      if (info.params && info.params.size > 0) {
        const params = Array.from(info.params.entries())
          .map(([k, v]) => `${k}=${v}`)
          .join(';');
        ridLine += ` ${params}`;
      }
      lines.push(ridLine);
    }

    // Simulcast
    if (media.simulcast) {
      const send = media.simulcast.send.join(';');
      const recv = media.simulcast.recv.join(';');
      lines.push(`a=simulcast:send ${send};recv ${recv}`);
    }

    // Other attributes
    for (const attr of media.attributes) {
      lines.push(`a=${attr}`);
    }

    return lines.join('\r\n');
  }

  /**
   * Parse origin line
   */
  private static parseOrigin(content: string): SDPSessionDescription['origin'] {
    const parts = content.split(' ');
    return {
      username: parts[0],
      sessionId: parseInt(parts[1], 10),
      sessionVersion: parseInt(parts[2], 10),
      netType: parts[3],
      ipType: parts[4],
      ip: parts[5],
    };
  }

  /**
   * Parse connection line
   */
  private static parseConnection(
    content: string
  ): { ip: string; version: 4 | 6 } {
    const parts = content.split(' ');
    const version = parts[1] === 'IP6' ? 6 : 4;
    return {
      ip: parts[2],
      version,
    };
  }

  /**
   * Parse timing line
   */
  private static parseTiming(content: string): { start: number; stop: number } {
    const parts = content.split(' ');
    return {
      start: parseInt(parts[0], 10),
      stop: parseInt(parts[1], 10),
    };
  }

  /**
   * Parse media line
   */
  private static parseMedia(
    content: string
  ): Partial<SDPMediaDescription> {
    const parts = content.split(' ');
    return {
      type: parts[0] as 'audio' | 'video' | 'application',
      port: parseInt(parts[1], 10),
      protocol: parts[2],
      payloads: parts.slice(3).map((p) => parseInt(p, 10)),
    };
  }

  /**
   * Parse bandwidth line
   */
  private static parseBandwidth(content: string): { type: string; value: number } {
    const [type, value] = content.split(':');
    return { type, value: parseInt(value, 10) };
  }

  /**
   * Parse session-level attribute
   */
  private static parseSessionAttribute(
    content: string,
    session: Partial<SDPSessionDescription>
  ): void {
    if (content.startsWith('group:')) {
      const parts = content.slice(6).split(' ');
      session.group = {
        semantics: parts[0],
        mids: parts.slice(1),
      };
    } else {
      session.attributes!.push(content);
    }
  }

  /**
   * Parse media-level attribute
   */
  private static parseAttribute(
    content: string,
    media: Partial<SDPMediaDescription>
  ): void {
    if (content.startsWith('rtpmap:')) {
      const rtp = this.parseRtpMap(content.slice(7));
      media.rtpmap!.set(rtp.payloadType, rtp);
    } else if (content.startsWith('fmtp:')) {
      const { pt, params } = this.parseFmtp(content.slice(5));
      media.fmtp!.set(pt, params);
    } else if (content.startsWith('candidate:')) {
      const candidate = this.parseCandidate(content.slice(10));
      media.candidates!.push(candidate);
    } else if (content.startsWith('ice-ufrag:')) {
      media.iceUfrag = content.slice(10);
    } else if (content.startsWith('ice-pwd:')) {
      media.icePwd = content.slice(8);
    } else if (content.startsWith('fingerprint:')) {
      const parts = content.slice(12).split(' ');
      media.fingerprint = {
        algorithm: parts[0],
        value: parts[1],
      };
    } else if (content.startsWith('setup:')) {
      media.setup = content.slice(6) as DTLSRole;
    } else if (content.startsWith('mid:')) {
      media.mid = content.slice(4);
    } else if (content.startsWith('ssrc:')) {
      const { ssrc, attribute, value } = this.parseSsrc(content.slice(5));
      media.ssrcs!.set(ssrc, { attribute, value });
    } else if (content.startsWith('ssrc-group:')) {
      const group = this.parseSsrcGroup(content.slice(11));
      media.ssrcGroups!.push(group);
    } else if (content.startsWith('rid:')) {
      const rid = this.parseRid(content.slice(4));
      media.rids!.set(rid.id, rid);
    } else if (content.startsWith('simulcast:')) {
      media.simulcast = this.parseSimulcast(content.slice(10));
    } else if (
      content === 'sendrecv' ||
      content === 'sendonly' ||
      content === 'recvonly' ||
      content === 'inactive'
    ) {
      media.direction = content as SDPMediaDescription['direction'];
    } else if (content.startsWith('rtcp:')) {
      media.rtcp = this.parseRtcp(content.slice(5));
    } else {
      media.attributes!.push(content);
    }
  }

  /**
   * Parse RTP map
   */
  private static parseRtpMap(content: string): RTPMap {
    const [ptStr, codec] = content.split(' ');
    const pt = parseInt(ptStr, 10);
    const codecParts = codec.split('/');

    const rtp: RTPMap = {
      payloadType: pt,
      name: codecParts[0],
      clockRate: parseInt(codecParts[1], 10),
    };

    if (codecParts.length > 2) {
      rtp.encodingParameters = parseInt(codecParts[2], 10);
    }

    return rtp;
  }

  /**
   * Parse FMTP
   */
  private static parseFmtp(content: string): { pt: number; params: string } {
    const spaceIndex = content.indexOf(' ');
    const pt = parseInt(content.slice(0, spaceIndex), 10);
    const params = content.slice(spaceIndex + 1);
    return { pt, params };
  }

  /**
   * Parse ICE candidate
   */
  public static parseCandidate(content: string): ICECandidate {
    const parts = content.split(' ');
    const candidate: ICECandidate = {
      foundation: parts[0],
      component: parseInt(parts[1], 10),
      protocol: parts[2].toLowerCase() as ICEProtocol,
      ip: parts[3],
      port: parseInt(parts[4], 10),
      priority: 0,
      type: 'host' as ICECandidateType,
    };

    for (let i = 5; i < parts.length; i += 2) {
      const key = parts[i];
      const value = parts[i + 1];

      if (key === 'priority') {
        candidate.priority = parseInt(value, 10);
      } else if (key === 'typ') {
        candidate.type = value as ICECandidateType;
      } else if (key === 'raddr') {
        candidate.relatedAddress = value;
      } else if (key === 'rport') {
        candidate.relatedPort = parseInt(value, 10);
      } else if (key === 'tcptype') {
        candidate.tcpType = value as 'active' | 'passive' | 'so';
      } else if (key === 'ufrag') {
        candidate.ufrag = value;
      }
    }

    return candidate;
  }

  /**
   * Build ICE candidate string
   */
  public static buildCandidate(candidate: ICECandidate): string {
    let line = `candidate:${candidate.foundation} ${candidate.component} ${candidate.protocol} ${candidate.port} ${candidate.priority} typ ${candidate.type}`;

    if (candidate.relatedAddress) {
      line += ` raddr ${candidate.relatedAddress}`;
    }
    if (candidate.relatedPort !== undefined) {
      line += ` rport ${candidate.relatedPort}`;
    }
    if (candidate.tcpType) {
      line += ` tcptype ${candidate.tcpType}`;
    }
    if (candidate.ufrag) {
      line += ` ufrag ${candidate.ufrag}`;
    }

    return line;
  }

  /**
   * Parse SSRC
   */
  private static parseSsrc(
    content: string
  ): { ssrc: number; attribute: string; value: string } {
    const colonIndex = content.indexOf(':');
    const spaceIndex = content.indexOf(' ');

    if (colonIndex === -1) {
      // ssrc:<ssrc>
      return {
        ssrc: parseInt(content, 10),
        attribute: '',
        value: '',
      };
    }

    const ssrc = parseInt(content.slice(0, spaceIndex), 10);
    const attrValue = content.slice(spaceIndex + 1);
    const attrColonIndex = attrValue.indexOf(':');
    const attribute = attrColonIndex === -1 ? attrValue : attrValue.slice(0, attrColonIndex);
    const value = attrColonIndex === -1 ? '' : attrValue.slice(attrColonIndex + 1);

    return { ssrc, attribute, value };
  }

  /**
   * Parse SSRC group
   */
  private static parseSsrcGroup(
    content: string
  ): { semantics: string; ssrcs: number[] } {
    const parts = content.split(' ');
    return {
      semantics: parts[0],
      ssrcs: parts.slice(1).map((s) => parseInt(s, 10)),
    };
  }

  /**
   * Parse RID
   */
  private static parseRid(
    content: string
  ): { id: string; direction: 'send' | 'recv'; params?: Map<string, string> } {
    const parts = content.split(' ');
    const rid: { id: string; direction: 'send' | 'recv'; params?: Map<string, string> } = {
      id: parts[0],
      direction: parts[1] as 'send' | 'recv',
    };

    if (parts.length > 2) {
      rid.params = new Map();
      for (const param of parts.slice(2)) {
        const [key, value] = param.split('=');
        rid.params.set(key, value);
      }
    }

    return rid;
  }

  /**
   * Parse simulcast
   */
  private static parseSimulcast(
    content: string
  ): { send: string[]; recv: string[] } {
    const result: { send: string[]; recv: string[] } = { send: [], recv: [] };
    const parts = content.split(';');

    for (const part of parts) {
      const [direction, streams] = part.trim().split(' ');
      if (direction === 'send') {
        result.send = streams.split(',');
      } else if (direction === 'recv') {
        result.recv = streams.split(',');
      }
    }

    return result;
  }

  /**
   * Parse RTCP
   */
  private static parseRtcp(
    content: string
  ): SDPMediaDescription['rtcp'] {
    const parts = content.split(' ');
    if (parts.length === 1) {
      return { port: parseInt(parts[0], 10) };
    }
    return {
      port: parseInt(parts[0], 10),
      netType: parts[1],
      ipType: parts[2],
      ip: parts[3],
    };
  }
}

// ============================================================================
// ICE HANDLER
// ============================================================================

/**
 * ICE Candidate Handler
 * Manages ICE candidate generation, parsing, and prioritization
 */
export class ICEHandler {
  private static readonly TYPE_PREFERENCE: Record<ICECandidateType, number> = {
    host: 126,
    srflx: 100,
    prflx: 110,
    relay: 0,
  };

  private static readonly PROTOCOL_PREFERENCE: Record<ICEProtocol, number> = {
    udp: 0,
    tcp: 1,
  };

  /**
   * Calculate ICE candidate priority
   */
  static calculatePriority(
    type: ICECandidateType,
    protocol: ICEProtocol,
    component: number,
    localPreference: number = 65535
  ): number {
    const typePref = this.TYPE_PREFERENCE[type];
    const _protoPref = this.PROTOCOL_PREFERENCE[protocol];

    // Priority = (2^24)*(type preference) + (2^8)*(local preference) + (2^0)*(component ID)
    return (typePref << 24) + (localPreference << 8) + (256 - component);
  }

  /**
   * Parse candidate from SDP line
   */
  static parseCandidate(line: string): ICECandidate {
    return SDPParser.parseCandidate(line.replace('candidate:', ''));
  }

  /**
   * Build candidate SDP line
   */
  static buildCandidate(candidate: ICECandidate): string {
    return SDPParser.buildCandidate(candidate);
  }

  /**
   * Sort candidates by priority (highest first)
   */
  static sortByPriority(candidates: ICECandidate[]): ICECandidate[] {
    return [...candidates].sort((a, b) => b.priority - a.priority);
  }

  /**
   * Filter candidates by type
   */
  static filterByType(
    candidates: ICECandidate[],
    types: ICECandidateType[]
  ): ICECandidate[] {
    return candidates.filter((c) => types.includes(c.type));
  }

  /**
   * Filter candidates by protocol
   */
  static filterByProtocol(
    candidates: ICECandidate[],
    protocols: ICEProtocol[]
  ): ICECandidate[] {
    return candidates.filter((c) => protocols.includes(c.protocol));
  }

  /**
   * Get the best candidate from a list
   */
  static getBestCandidate(candidates: ICECandidate[]): ICECandidate | null {
    const sorted = this.sortByPriority(candidates);
    // Prefer UDP host candidates
    const udpHost = sorted.find(
      (c) => c.protocol === 'udp' && c.type === 'host'
    );
    if (udpHost) return udpHost;
    // Fall back to highest priority
    return sorted[0] || null;
  }

  /**
   * Generate candidate foundation
   */
  static generateFoundation(
    type: ICECandidateType,
    protocol: ICEProtocol,
    ip: string
  ): string {
    // Foundation is a hash-like string for candidate grouping
    const hash = this.simpleHash(`${type}${protocol}${ip}`);
    return hash.toString(16).padStart(8, '0');
  }

  /**
   * Simple hash function for foundation generation
   */
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Create host candidate
   */
  static createHostCandidate(
    ip: string,
    port: number,
    component: number = 1,
    protocol: ICEProtocol = 'udp'
  ): ICECandidate {
    const foundation = this.generateFoundation('host', protocol, ip);
    const priority = this.calculatePriority('host', protocol, component);

    return {
      foundation,
      component,
      protocol,
      ip,
      port,
      priority,
      type: 'host',
    };
  }

  /**
   * Create server reflexive candidate
   */
  static createServerReflexiveCandidate(
    localIp: string,
    localPort: number,
    publicIp: string,
    publicPort: number,
    component: number = 1,
    protocol: ICEProtocol = 'udp'
  ): ICECandidate {
    const foundation = this.generateFoundation('srflx', protocol, publicIp);
    const priority = this.calculatePriority('srflx', protocol, component);

    return {
      foundation,
      component,
      protocol,
      ip: publicIp,
      port: publicPort,
      priority,
      relatedAddress: localIp,
      relatedPort: localPort,
      type: 'srflx',
    };
  }

  /**
   * Create relay candidate
   */
  static createRelayCandidate(
    relayIp: string,
    relayPort: number,
    component: number = 1,
    protocol: ICEProtocol = 'udp'
  ): ICECandidate {
    const foundation = this.generateFoundation('relay', protocol, relayIp);
    const priority = this.calculatePriority('relay', protocol, component);

    return {
      foundation,
      component,
      protocol,
      ip: relayIp,
      port: relayPort,
      priority,
      type: 'relay',
    };
  }
}

// ============================================================================
// DTLS HANDLER
// ============================================================================

/**
 * DTLS Handler
 * Manages DTLS fingerprint and role handling
 */
export class DTLSHandler {
  /**
   * Parse DTLS fingerprint from string
   */
  static parseFingerprint(fingerprint: string): { algorithm: string; value: string } {
    const parts = fingerprint.split(' ');
    if (parts.length !== 2) {
      throw new SDPError(`Invalid fingerprint format: ${fingerprint}`);
    }
    return {
      algorithm: parts[0],
      value: parts[1],
    };
  }

  /**
   * Build DTLS fingerprint string
   */
  static buildFingerprint(algorithm: string, value: string): string {
    return `${algorithm} ${value}`;
  }

  /**
   * Determine DTLS role from setup attribute
   */
  static parseSetup(setup: string): DTLSRole {
    if (setup === 'active') return 'client';
    if (setup === 'passive') return 'server';
    // For 'actpass', the role is determined during negotiation
    return 'client';
  }

  /**
   * Get setup attribute from DTLS role
   */
  static getSetup(role: DTLSRole, offerer: boolean = true): string {
    if (offerer) {
      return 'actpass';
    }
    return role === 'client' ? 'active' : 'passive';
  }

  /**
   * Verify fingerprint matches
   */
  static verifyFingerprint(
    expected: { algorithm: string; value: string },
    actual: { algorithm: string; value: string }
  ): boolean {
    return (
      expected.algorithm.toLowerCase() === actual.algorithm.toLowerCase() &&
      expected.value.toUpperCase() === actual.value.toUpperCase()
    );
  }
}

// ============================================================================
// SDP UTILITIES
// ============================================================================

/**
 * SDP Utilities
 * Helper functions for SDP manipulation
 */
export class SDPUtils {
  /**
   * Add codec to SDP
   */
  static addCodec(
    sdp: SDPSessionDescription,
    mediaIndex: number,
    rtp: RTPMap,
    fmtp?: string
  ): SDPSessionDescription {
    const media = sdp.media[mediaIndex];
    media.rtpmap.set(rtp.payloadType, rtp);
    if (fmtp) {
      media.fmtp.set(rtp.payloadType, fmtp);
    }
    if (!media.payloads.includes(rtp.payloadType)) {
      media.payloads.push(rtp.payloadType);
    }
    return sdp;
  }

  /**
   * Remove codec from SDP
   */
  static removeCodec(
    sdp: SDPSessionDescription,
    mediaIndex: number,
    payloadType: number
  ): SDPSessionDescription {
    const media = sdp.media[mediaIndex];
    media.rtpmap.delete(payloadType);
    media.fmtp.delete(payloadType);
    media.payloads = media.payloads.filter((pt) => pt !== payloadType);
    return sdp;
  }

  /**
   * Set media direction
   */
  static setDirection(
    sdp: SDPSessionDescription,
    mediaIndex: number,
    direction: SDPMediaDescription['direction']
  ): SDPSessionDescription {
    sdp.media[mediaIndex].direction = direction;
    return sdp;
  }

  /**
   * Add ICE candidate to SDP
   */
  static addCandidate(
    sdp: SDPSessionDescription,
    mediaIndex: number,
    candidate: ICECandidate
  ): SDPSessionDescription {
    sdp.media[mediaIndex].candidates.push(candidate);
    return sdp;
  }

  /**
   * Set ICE credentials
   */
  static setICECredentials(
    sdp: SDPSessionDescription,
    mediaIndex: number,
    ufrag: string,
    pwd: string
  ): SDPSessionDescription {
    const media = sdp.media[mediaIndex];
    media.iceUfrag = ufrag;
    media.icePwd = pwd;
    return sdp;
  }

  /**
   * Set DTLS fingerprint
   */
  static setFingerprint(
    sdp: SDPSessionDescription,
    mediaIndex: number,
    algorithm: string,
    value: string
  ): SDPSessionDescription {
    sdp.media[mediaIndex].fingerprint = { algorithm, value };
    return sdp;
  }

  /**
   * Get media by type
   */
  static getMediaByType(
    sdp: SDPSessionDescription,
    type: 'audio' | 'video' | 'application'
  ): SDPMediaDescription[] {
    return sdp.media.filter((m) => m.type === type);
  }

  /**
   * Get media by MID
   */
  static getMediaByMid(
    sdp: SDPSessionDescription,
    mid: string
  ): SDPMediaDescription | undefined {
    return sdp.media.find((m) => m.mid === mid);
  }

  /**
   * Clone SDP
   */
  static clone(sdp: SDPSessionDescription): SDPSessionDescription {
    return JSON.parse(JSON.stringify(sdp, (key, value) => {
      if (value instanceof Map) {
        return { __type: 'Map', data: Array.from(value.entries()) };
      }
      return value;
    }), (key, value) => {
      if (value && value.__type === 'Map') {
        return new Map(value.data);
      }
      return value;
    });
  }

  /**
   * Get codecs from media
   */
  static getCodecs(media: SDPMediaDescription): RTPMap[] {
    return Array.from(media.rtpmap.values());
  }

  /**
   * Check if codec is present
   */
  static hasCodec(media: SDPMediaDescription, name: string): boolean {
    const codecs = this.getCodecs(media);
    return codecs.some(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    );
  }

  /**
   * Get SSRCs from media
   */
  static getSSRCs(media: SDPMediaDescription): number[] {
    return Array.from(media.ssrcs.keys());
  }
}

// ============================================================================
// WEBRTC SESSION
// ============================================================================

/**
 * WebRTC Session Handler
 * Manages WebRTC session state and operations
 */
export class WebRTCSession {
  private sdp: SDPSessionDescription | null = null;
  private candidates: ICECandidate[] = [];

  /**
   * Set remote SDP
   */
  setRemoteSDP(sdpString: string): void {
    this.sdp = SDPParser.parse(sdpString);
  }

  /**
   * Get remote SDP
   */
  getRemoteSDP(): SDPSessionDescription | null {
    return this.sdp;
  }

  /**
   * Get parsed SDP
   */
  getParsedSDP(): SDPSessionDescription | null {
    return this.sdp;
  }

  /**
   * Add remote ICE candidate
   */
  addRemoteCandidate(candidateString: string): void {
    const candidate = ICEHandler.parseCandidate(candidateString);
    this.candidates.push(candidate);
  }

  /**
   * Get all remote candidates
   */
  getRemoteCandidates(): ICECandidate[] {
    return [...this.candidates];
  }

  /**
   * Get media sections
   */
  getMediaSections(): SDPMediaDescription[] {
    return this.sdp?.media || [];
  }

  /**
   * Get audio media
   */
  getAudioMedia(): SDPMediaDescription | undefined {
    return this.sdp?.media.find((m) => m.type === 'audio');
  }

  /**
   * Get video media
   */
  getVideoMedia(): SDPMediaDescription | undefined {
    return this.sdp?.media.find((m) => m.type === 'video');
  }

  /**
   * Get data channel media
   */
  getDataChannelMedia(): SDPMediaDescription | undefined {
    return this.sdp?.media.find((m) => m.type === 'application');
  }

  /**
   * Get ICE credentials
   */
  getICECredentials(): { ufrag: string; pwd: string } | null {
    const media = this.sdp?.media[0];
    if (!media?.iceUfrag || !media?.icePwd) return null;
    return { ufrag: media.iceUfrag, pwd: media.icePwd };
  }

  /**
   * Get DTLS fingerprint
   */
  getDTLSFingerprint(): { algorithm: string; value: string } | null {
    const media = this.sdp?.media[0];
    return media?.fingerprint || null;
  }

  /**
   * Clear session
   */
  clear(): void {
    this.sdp = null;
    this.candidates = [];
  }
}

