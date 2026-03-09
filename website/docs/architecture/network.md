---
sidebar_position: 4
title: Network Architecture
description: VComm's network topology and communication protocols
---

# Network Architecture

VComm's network layer is designed for resilience, low latency, and secure
peer-to-peer communication.

## Network Topology

- **Mesh Networking**: Decentralized peer-to-peer connections
- **Relay Servers**: Fallback for NAT traversal scenarios
- **Edge Nodes**: Distributed processing at network edges

## Protocols

- **WebRTC**: Real-time peer-to-peer communication
- **DTLS**: Secure datagram transport
- **RTP/RTCP**: Real-time media streaming
- **UDP**: Low-latency data transport

## NAT Traversal

VComm uses ICE (Interactive Connectivity Establishment) with STUN/TURN servers
for reliable connectivity across network boundaries.

For more details on protocol implementations, see the `@vcomm/protocols` package
documentation.
