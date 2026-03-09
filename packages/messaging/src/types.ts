/**
 * Types for batch message passing system
 */

export interface MessageBatch {
  recipients: string[]; // User IDs or PIDs
  message: any;
  options?: BatchOptions;
}

export interface BatchOptions {
  packMode?: 'etf' | 'binary' | 'json';
  sendMode?: 'direct' | 'offload';
  groupByNode?: boolean;
  maxRetries?: number;
  timeout?: number;
}

export interface BatchResult {
  sent: number;
  failed: number;
  duration: number;
  recipients: string[];
  errors?: Array<{ recipient: string; error: Error }>;
}

export interface MessageRecipient {
  id: string;
  node?: string;
  connected: boolean;
}

export interface NodeMap {
  [node: string]: string[];
}

export interface WorkerMessage {
  type: 'SEND_BATCH';
  recipients: string[];
  message: any;
  options?: BatchOptions;
}

export interface WorkerResponse {
  sent: number;
  failed: number;
  duration: number;
  recipients: string[];
  errors?: Array<{ recipient: string; error: string }>;
}
