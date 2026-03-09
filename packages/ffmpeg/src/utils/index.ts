/**
 * @fileoverview Utility functions for FFmpeg operations
 * @module @vcomm/ffmpeg/utils
 */

import * as childProcess from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  EncodingPreset,
  VideoConfig,
  AudioConfig,
  ContainerFormat,
  PresetCategory,
} from '../types';

/**
 * Check if FFmpeg is installed
 */
export async function isFFmpegInstalled(): Promise<boolean> {
  try {
    await runCommand('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if FFprobe is installed
 */
export async function isFFprobeInstalled(): Promise<boolean> {
  try {
    await runCommand('ffprobe', ['-version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get FFmpeg version
 */
export async function getFFmpegVersion(): Promise<string> {
  const output = await runCommand('ffmpeg', ['-version']);
  const match = output.match(/ffmpeg version (\S+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Get available encoders
 */
export async function getAvailableEncoders(): Promise<string[]> {
  const output = await runCommand('ffmpeg', ['-encoders']);
  const encoders: string[] = [];

  const lines = output.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*[A-Z]+\s+(\w+)\s+/);
    if (match) {
      encoders.push(match[1]);
    }
  }

  return encoders;
}

/**
 * Get available decoders
 */
export async function getAvailableDecoders(): Promise<string[]> {
  const output = await runCommand('ffmpeg', ['-decoders']);
  const decoders: string[] = [];

  const lines = output.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*[A-Z]+\s+(\w+)\s+/);
    if (match) {
      decoders.push(match[1]);
    }
  }

  return decoders;
}

/**
 * Get available formats
 */
export async function getAvailableFormats(): Promise<string[]> {
  const output = await runCommand('ffmpeg', ['-formats']);
  const formats: string[] = [];

  const lines = output.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*[DE]+\s+(\w+)\s+/);
    if (match) {
      formats.push(match[1]);
    }
  }

  return formats;
}

/**
 * Get available filters
 */
export async function getAvailableFilters(): Promise<string[]> {
  const output = await runCommand('ffmpeg', ['-filters']);
  const filters: string[] = [];

  const lines = output.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*[TSCC]+\s+(\w+)\s+/);
    if (match) {
      filters.push(match[1]);
    }
  }

  return filters;
}

/**
 * Run a command and return output
 */
export function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = childProcess.spawn(command, args, {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout + stderr);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Calculate bitrate for quality
 */
export function calculateBitrate(
  width: number,
  height: number,
  framerate: number,
  quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
): number {
  const pixels = width * height;
  const pixelRate = pixels * framerate;

  // Bits per pixel based on quality
  const bpp: Record<string, number> = {
    low: 0.05,
    medium: 0.08,
    high: 0.12,
    ultra: 0.18,
  };

  return Math.round(pixelRate * bpp[quality]);
}

/**
 * Calculate CRF value for quality
 */
export function calculateCRF(quality: number, codec: string): number {
  // CRF ranges: H.264: 0-51, H.265: 0-51, AV1: 0-63
  // Default medium quality: H.264=23, H.265=28, AV1=35

  const baseCRF: Record<string, number> = {
    libx264: 23,
    libx265: 28,
    libsvtav1: 35,
    'libaom-av1': 35,
    'libvpx-vp9': 31,
  };

  const base = baseCRF[codec] || 23;

  // Quality 1-100, higher is better quality
  // Convert to CRF scale (lower is better)
  const normalizedQuality = Math.max(1, Math.min(100, quality));
  const crf = base - ((normalizedQuality - 50) / 50) * 10;

  return Math.round(Math.max(0, Math.min(51, crf)));
}

/**
 * Get optimal preset for use case
 */
export function getOptimalPreset(
  useCase: 'streaming' | 'archive' | 'web' | 'mobile' | 'broadcast'
): { video: VideoConfig; audio: AudioConfig; format: ContainerFormat } {
  const presets: Record<
    string,
    { video: VideoConfig; audio: AudioConfig; format: ContainerFormat }
  > = {
    streaming: {
      video: {
        codec: 'libx264',
        preset: 'veryfast',
        quality: 23,
        pixelFormat: 'yuv420p',
      },
      audio: {
        codec: 'aac',
        bitrate: 128000,
        sampleRate: 44100,
        channels: 2,
      },
      format: 'mp4',
    },
    archive: {
      video: {
        codec: 'libx265',
        preset: 'slow',
        quality: 20,
        pixelFormat: 'yuv420p10le',
      },
      audio: {
        codec: 'flac',
        sampleRate: 48000,
        channels: 2,
      },
      format: 'mkv',
    },
    web: {
      video: {
        codec: 'libsvtav1',
        preset: 'medium',
        quality: 35,
        pixelFormat: 'yuv420p',
      },
      audio: {
        codec: 'libopus',
        bitrate: 96000,
        sampleRate: 48000,
        channels: 2,
      },
      format: 'webm',
    },
    mobile: {
      video: {
        codec: 'libx264',
        preset: 'fast',
        quality: 26,
        width: 1280,
        height: 720,
        pixelFormat: 'yuv420p',
      },
      audio: {
        codec: 'aac',
        bitrate: 96000,
        sampleRate: 44100,
        channels: 2,
      },
      format: 'mp4',
    },
    broadcast: {
      video: {
        codec: 'libx264',
        preset: 'slow',
        quality: 18,
        pixelFormat: 'yuv422p',
        gopSize: 60,
      },
      audio: {
        codec: 'pcm_s16le',
        sampleRate: 48000,
        channels: 8,
      },
      format: 'mov',
    },
  };

  return presets[useCase];
}

/**
 * Get encoding presets by category
 */
export function getPresetsByCategory(category: PresetCategory): EncodingPreset[] {
  const allPresets: Record<PresetCategory, EncodingPreset[]> = {
    streaming: [
      {
        name: 'HLS-720p',
        description: 'HLS streaming at 720p',
        video: { codec: 'libx264', width: 1280, height: 720, preset: 'veryfast', quality: 23 },
        audio: { codec: 'aac', bitrate: 128000 },
        format: 'ts',
        tags: ['hls', '720p'],
      },
      {
        name: 'HLS-1080p',
        description: 'HLS streaming at 1080p',
        video: { codec: 'libx264', width: 1920, height: 1080, preset: 'veryfast', quality: 23 },
        audio: { codec: 'aac', bitrate: 192000 },
        format: 'ts',
        tags: ['hls', '1080p'],
      },
      {
        name: 'DASH-720p',
        description: 'DASH streaming at 720p',
        video: { codec: 'libx264', width: 1280, height: 720, preset: 'fast', quality: 22 },
        audio: { codec: 'aac', bitrate: 128000 },
        format: 'mp4',
        tags: ['dash', '720p'],
      },
    ],
    archive: [
      {
        name: 'Archive-H265',
        description: 'Archive quality with H.265',
        video: { codec: 'libx265', preset: 'slow', quality: 20 },
        audio: { codec: 'flac' },
        format: 'mkv',
        tags: ['archive', 'hevc'],
      },
      {
        name: 'Archive-AV1',
        description: 'Archive quality with AV1',
        video: { codec: 'libsvtav1', preset: 'slow', quality: 25 },
        audio: { codec: 'flac' },
        format: 'mkv',
        tags: ['archive', 'av1'],
      },
    ],
    web: [
      {
        name: 'WebM-720p',
        description: 'WebM format at 720p',
        video: { codec: 'libvpx-vp9', width: 1280, height: 720, quality: 31 },
        audio: { codec: 'libopus', bitrate: 96000 },
        format: 'webm',
        tags: ['web', 'vp9'],
      },
      {
        name: 'WebM-AV1',
        description: 'WebM with AV1 codec',
        video: { codec: 'libsvtav1', width: 1920, height: 1080, quality: 35 },
        audio: { codec: 'libopus', bitrate: 128000 },
        format: 'webm',
        tags: ['web', 'av1'],
      },
    ],
    mobile: [
      {
        name: 'Mobile-480p',
        description: 'Mobile optimized at 480p',
        video: { codec: 'libx264', width: 854, height: 480, preset: 'fast', quality: 26 },
        audio: { codec: 'aac', bitrate: 96000 },
        format: 'mp4',
        tags: ['mobile', '480p'],
      },
      {
        name: 'Mobile-720p',
        description: 'Mobile optimized at 720p',
        video: { codec: 'libx264', width: 1280, height: 720, preset: 'fast', quality: 24 },
        audio: { codec: 'aac', bitrate: 128000 },
        format: 'mp4',
        tags: ['mobile', '720p'],
      },
    ],
    broadcast: [
      {
        name: 'Broadcast-1080i',
        description: 'Broadcast quality 1080i',
        video: { codec: 'libx264', width: 1920, height: 1080, preset: 'slow', quality: 18 },
        audio: { codec: 'pcm_s16le', sampleRate: 48000, channels: 8 },
        format: 'mov',
        tags: ['broadcast', '1080i'],
      },
    ],
    gaming: [
      {
        name: 'Gaming-1440p60',
        description: 'Gaming content at 1440p 60fps',
        video: {
          codec: 'libx264',
          width: 2560,
          height: 1440,
          framerate: 60,
          preset: 'fast',
          quality: 21,
        },
        audio: { codec: 'aac', bitrate: 192000 },
        format: 'mp4',
        tags: ['gaming', '1440p', '60fps'],
      },
      {
        name: 'Gaming-1080p60',
        description: 'Gaming content at 1080p 60fps',
        video: {
          codec: 'libx264',
          width: 1920,
          height: 1080,
          framerate: 60,
          preset: 'fast',
          quality: 21,
        },
        audio: { codec: 'aac', bitrate: 160000 },
        format: 'mp4',
        tags: ['gaming', '1080p', '60fps'],
      },
    ],
    surveillance: [
      {
        name: 'Surveillance-Continuous',
        description: 'Surveillance continuous recording',
        video: { codec: 'libx264', preset: 'ultrafast', quality: 28 },
        audio: { codec: 'aac', bitrate: 64000 },
        format: 'mp4',
        tags: ['surveillance', 'continuous'],
      },
    ],
  };

  return allPresets[category] || [];
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Format bitrate for display
 */
export function formatBitrate(bps: number): string {
  if (bps >= 1000000) {
    return `${(bps / 1000000).toFixed(2)} Mbps`;
  } else if (bps >= 1000) {
    return `${(bps / 1000).toFixed(2)} Kbps`;
  }
  return `${bps} bps`;
}

/**
 * Parse time string to seconds
 */
export function parseTimeString(timeStr: string): number {
  // Formats: HH:MM:SS.mmm, HH:MM:SS, MM:SS.mmm, MM:SS, SS.mmm, SS
  const patterns = [
    // eslint-disable-next-line security/detect-unsafe-regex
    /^(\d+):(\d+):(\d+)(?:\.(\d+))?$/,
    // eslint-disable-next-line security/detect-unsafe-regex
    /^(\d+):(\d+)(?:\.(\d+))?$/,
    // eslint-disable-next-line security/detect-unsafe-regex
    /^(\d+)(?:\.(\d+))?$/,
  ];

  for (const pattern of patterns) {
    const match = timeStr.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const seconds = parseInt(match[3]);
        const ms = match[4] ? parseInt(match[4].padEnd(3, '0').slice(0, 3)) : 0;
        return hours * 3600 + minutes * 60 + seconds + ms / 1000;
      } else if (pattern === patterns[1]) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3)) : 0;
        return minutes * 60 + seconds + ms / 1000;
      } else {
        const seconds = parseInt(match[1]);
        const ms = match[2] ? parseInt(match[2].padEnd(3, '0').slice(0, 3)) : 0;
        return seconds + ms / 1000;
      }
    }
  }

  return 0;
}

/**
 * Generate timestamp for filename
 */
export function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

/**
 * Ensure output directory exists
 */
export async function ensureDirectory(filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete file if exists
 */
export async function deleteIfExists(filePath: string): Promise<void> {
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.unlink(filePath);
  } catch {
    // Ignore if file doesn't exist
  }
}

/**
 * Get temporary file path
 */
export function getTempPath(prefix: string, extension: string): string {
  const timestamp = generateTimestamp();
  return path.join('/tmp', `${prefix}_${timestamp}.${extension}`);
}

/**
 * Estimate output file size
 */
export function estimateOutputSize(
  duration: number,
  videoBitrate: number,
  audioBitrate: number,
  overhead = 1.05
): number {
  return Math.round((duration * (videoBitrate + audioBitrate) * overhead) / 8);
}

/**
 * Validate codec combination
 */
export function validateCodecCombination(
  videoCodec: string,
  audioCodec: string,
  container: string
): { valid: boolean; message?: string } {
  // Define compatible codecs for each container
  const compatibility: Record<string, { video: string[]; audio: string[] }> = {
    mp4: {
      video: [
        'libx264',
        'libx265',
        'libsvtav1',
        'h264_nvenc',
        'hevc_nvenc',
        'h264_amf',
        'hevc_amf',
      ],
      audio: ['aac', 'libmp3lame', 'ac3', 'eac3', 'flac', 'pcm_s16le'],
    },
    webm: {
      video: ['libvpx-vp9', 'libsvtav1', 'libaom-av1'],
      audio: ['libopus', 'libvorbis'],
    },
    mkv: {
      video: ['libx264', 'libx265', 'libsvtav1', 'libvpx-vp9', 'h264_nvenc', 'hevc_nvenc'],
      audio: ['aac', 'libmp3lame', 'libopus', 'libvorbis', 'flac', 'ac3', 'eac3', 'pcm_s16le'],
    },
    mov: {
      video: ['libx264', 'libx265', 'h264_nvenc', 'hevc_nvenc', 'prores'],
      audio: ['aac', 'pcm_s16le', 'pcm_s24le', 'alac'],
    },
  };

  const containerInfo = compatibility[container];
  if (!containerInfo) {
    return { valid: true }; // Unknown container, assume valid
  }

  if (videoCodec && !containerInfo.video.includes(videoCodec)) {
    return {
      valid: false,
      message: `Video codec ${videoCodec} is not compatible with ${container} container`,
    };
  }

  if (audioCodec && !containerInfo.audio.includes(audioCodec)) {
    return {
      valid: false,
      message: `Audio codec ${audioCodec} is not compatible with ${container} container`,
    };
  }

  return { valid: true };
}
