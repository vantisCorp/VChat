/**
 * @fileoverview Video/Audio decoder module for FFmpeg
 * @module @vcomm/ffmpeg/decoder
 */

import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  HardwareAccelConfig,
  FFmpegError,
  FFmpegErrorCode,
  VideoStreamInfo,
  AudioStreamInfo,
} from '../types';
import { hardwareManager } from '../hardware';

/**
 * Video decoder class
 * Handles video decoding with hardware acceleration support
 */
export class VideoDecoder {
  /**
   * Decode video to raw frames
   */
  async decodeToFrames(
    input: string,
    outputDir: string,
    options: DecodeOptions = {}
  ): Promise<string[]> {
    await this.ensureDirectory(outputDir);

    const { format = 'png', fps, startTime, duration, hwAccel, width, height } = options;

    const command = ffmpeg(input);

    // Apply hardware acceleration for decoding
    if (hwAccel && hwAccel.type !== 'none') {
      this.applyHardwareDecoding(command, hwAccel);
    }

    // Time range
    if (startTime) {
      command.setStartTime(startTime);
    }
    if (duration) {
      command.setDuration(duration);
    }

    // Output options
    command.outputOptions(['-vsync', '0', '-q:v', '2']);

    if (fps) {
      command.fps(fps);
    }

    if (width || height) {
      command.size(`${width || -1}:${height || -1}`);
    }

    const outputPattern = path.join(outputDir, `frame_%08d.${format}`);
    command.output(outputPattern);

    return new Promise((resolve, reject) => {
      command
        .on('end', async () => {
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          const files = await fs.readdir(outputDir);
          const frames = files
            .filter((f) => f.startsWith('frame_') && f.endsWith(format))
            .map((f) => path.join(outputDir, f))
            .sort();
          resolve(frames);
        })
        .on('error', (err) =>
          reject(
            new FFmpegError(`Decoding failed: ${err.message}`, FFmpegErrorCode.DECODING_FAILED)
          )
        )
        .run();
    });
  }

  /**
   * Decode audio to raw PCM
   */
  async decodeToPCM(
    input: string,
    output: string,
    options: AudioDecodeOptions = {}
  ): Promise<string> {
    const { sampleRate = 48000, channels = 2, bitDepth = 16, startTime, duration } = options;

    const command = ffmpeg(input);

    if (startTime) {
      command.setStartTime(startTime);
    }
    if (duration) {
      command.setDuration(duration);
    }

    const pcmFormat = bitDepth === 24 ? 's24le' : 's16le';

    command
      .audioCodec(`pcm_${pcmFormat}`)
      .audioFrequency(sampleRate)
      .audioChannels(channels)
      .format('s16le')
      .output(output);

    return new Promise((resolve, reject) => {
      command
        .on('end', () => resolve(output))
        .on('error', (err) =>
          reject(
            new FFmpegError(
              `Audio decoding failed: ${err.message}`,
              FFmpegErrorCode.DECODING_FAILED
            )
          )
        )
        .run();
    });
  }

  /**
   * Decode video to Y4M format (uncompressed YUV)
   */
  async decodeToY4M(input: string, output: string, options: DecodeOptions = {}): Promise<string> {
    const command = ffmpeg(input);

    if (options.hwAccel && options.hwAccel.type !== 'none') {
      this.applyHardwareDecoding(command, options.hwAccel);
    }

    if (options.startTime) {
      command.setStartTime(options.startTime);
    }
    if (options.duration) {
      command.setDuration(options.duration);
    }

    command.outputOptions(['-f', 'yuv4mpegpipe']).output(output);

    return new Promise((resolve, reject) => {
      command
        .on('end', () => resolve(output))
        .on('error', (err) =>
          reject(
            new FFmpegError(`Y4M decoding failed: ${err.message}`, FFmpegErrorCode.DECODING_FAILED)
          )
        )
        .run();
    });
  }

  /**
   * Extract audio track from video
   */
  async extractAudio(
    input: string,
    output: string,
    options: AudioExtractOptions = {}
  ): Promise<string> {
    const {
      codec = 'pcm_s16le',
      sampleRate = 48000,
      channels = 2,
      bitrate,
      startTime,
      duration,
      trackIndex,
    } = options;

    const command = ffmpeg(input);

    if (startTime) {
      command.setStartTime(startTime);
    }
    if (duration) {
      command.setDuration(duration);
    }

    // Map specific audio track if specified
    if (trackIndex !== undefined) {
      command.outputOptions([`-map 0:a:${trackIndex}`]);
    }

    command.noVideo().audioCodec(codec).audioFrequency(sampleRate).audioChannels(channels);

    if (bitrate) {
      command.audioBitrate(bitrate / 1000);
    }

    command.output(output);

    return new Promise((resolve, reject) => {
      command
        .on('end', () => resolve(output))
        .on('error', (err) =>
          reject(
            new FFmpegError(
              `Audio extraction failed: ${err.message}`,
              FFmpegErrorCode.DECODING_FAILED
            )
          )
        )
        .run();
    });
  }

  /**
   * Extract video track (remove audio)
   */
  async extractVideo(
    input: string,
    output: string,
    options: VideoExtractOptions = {}
  ): Promise<string> {
    const { codec = 'rawvideo', startTime, duration, hwAccel } = options;

    const command = ffmpeg(input);

    if (hwAccel && hwAccel.type !== 'none') {
      this.applyHardwareDecoding(command, hwAccel);
    }

    if (startTime) {
      command.setStartTime(startTime);
    }
    if (duration) {
      command.setDuration(duration);
    }

    command.noAudio().outputOptions(['-map', '0:v:0']);

    if (codec !== 'copy') {
      command.videoCodec(codec);
    }

    command.output(output);

    return new Promise((resolve, reject) => {
      command
        .on('end', () => resolve(output))
        .on('error', (err) =>
          reject(
            new FFmpegError(
              `Video extraction failed: ${err.message}`,
              FFmpegErrorCode.DECODING_FAILED
            )
          )
        )
        .run();
    });
  }

  /**
   * Decode video segment
   */
  async decodeSegment(
    input: string,
    startTime: number,
    endTime: number,
    output: string,
    options: DecodeOptions = {}
  ): Promise<string> {
    const duration = endTime - startTime;

    return this.decodeToFrames(input, path.dirname(output), {
      ...options,
      startTime,
      duration,
    }).then(() => output);
  }

  /**
   * Get frame at specific timestamp
   */
  async getFrameAt(
    input: string,
    timestamp: number,
    output: string,
    options: FrameOptions = {}
  ): Promise<string> {
    const command = ffmpeg(input);

    command.setStartTime(timestamp);
    command.frames(1);

    if (options.width || options.height) {
      command.size(`${options.width || -1}:${options.height || -1}`);
    }

    command.output(output);

    return new Promise((resolve, reject) => {
      command
        .on('end', () => resolve(output))
        .on('error', (err) =>
          reject(
            new FFmpegError(
              `Frame extraction failed: ${err.message}`,
              FFmpegErrorCode.DECODING_FAILED
            )
          )
        )
        .run();
    });
  }

  /**
   * Apply hardware decoding options
   */
  private applyHardwareDecoding(command: ffmpeg.FfmpegCommand, hwAccel: HardwareAccelConfig): void {
    const hwOptions = hardwareManager.getHardwareOptions(hwAccel);

    hwOptions.forEach((opt, i) => {
      if (i % 2 === 0 && hwOptions[i + 1]) {
        command.inputOptions([opt, hwOptions[i + 1]]);
      }
    });
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectory(dir: string): Promise<void> {
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      await fs.mkdir(dir, { recursive: true });
    } catch {
      // Ignore if exists
    }
  }

  /**
   * Probe video stream information
   */
  async probeVideoStream(input: string, index = 0): Promise<VideoStreamInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(input, ['-select_streams', `v:${index}`], (err, data) => {
        if (err) {
          reject(
            new FFmpegError(
              `Failed to probe video stream: ${err.message}`,
              FFmpegErrorCode.INVALID_INPUT
            )
          );
          return;
        }

        const stream = data.streams[0];
        if (!stream) {
          reject(new FFmpegError(`Video stream ${index} not found`, FFmpegErrorCode.INVALID_INPUT));
          return;
        }

        resolve({
          index: stream.index,
          codec: stream.codec_name || 'unknown',
          profile: stream.profile,
          level: stream.level,
          width: stream.width || 0,
          height: stream.height || 0,
          framerate: this.parseFrameRate(stream.r_frame_rate),
          aspectRatio: stream.display_aspect_ratio || 'N/A',
          pixelFormat: stream.pix_fmt || 'unknown',
          bitrate: stream.bit_rate ? parseInt(stream.bit_rate) : undefined,
        });
      });
    });
  }

  /**
   * Probe audio stream information
   */
  async probeAudioStream(input: string, index = 0): Promise<AudioStreamInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(input, ['-select_streams', `a:${index}`], (err, data) => {
        if (err) {
          reject(
            new FFmpegError(
              `Failed to probe audio stream: ${err.message}`,
              FFmpegErrorCode.INVALID_INPUT
            )
          );
          return;
        }

        const stream = data.streams[0];
        if (!stream) {
          reject(new FFmpegError(`Audio stream ${index} not found`, FFmpegErrorCode.INVALID_INPUT));
          return;
        }

        resolve({
          index: stream.index,
          codec: stream.codec_name || 'unknown',
          profile: stream.profile,
          sampleRate: stream.sample_rate || 0,
          channels: stream.channels || 0,
          channelLayout: stream.channel_layout || 'unknown',
          bitrate: stream.bit_rate ? parseInt(stream.bit_rate) : undefined,
          language: stream.tags?.language,
        });
      });
    });
  }

  /**
   * Parse frame rate string
   */
  private parseFrameRate(framerate: string | undefined): number {
    if (!framerate) return 0;
    const parts = framerate.split('/');
    if (parts.length === 2) {
      return parseInt(parts[0]) / parseInt(parts[1]);
    }
    return parseFloat(framerate) || 0;
  }
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Decode options
 */
export interface DecodeOptions {
  /** Output format for frames */
  format?: 'png' | 'jpg' | 'bmp' | 'tiff';

  /** Target FPS */
  fps?: number;

  /** Start time in seconds */
  startTime?: number;

  /** Duration in seconds */
  duration?: number;

  /** Hardware acceleration configuration */
  hwAccel?: HardwareAccelConfig;

  /** Output width */
  width?: number;

  /** Output height */
  height?: number;
}

/**
 * Audio decode options
 */
export interface AudioDecodeOptions {
  /** Sample rate in Hz */
  sampleRate?: number;

  /** Number of channels */
  channels?: number;

  /** Bit depth */
  bitDepth?: 16 | 24 | 32;

  /** Start time in seconds */
  startTime?: number;

  /** Duration in seconds */
  duration?: number;
}

/**
 * Audio extraction options
 */
export interface AudioExtractOptions {
  /** Audio codec */
  codec?: string;

  /** Sample rate */
  sampleRate?: number;

  /** Number of channels */
  channels?: number;

  /** Bitrate */
  bitrate?: number;

  /** Start time */
  startTime?: number;

  /** Duration */
  duration?: number;

  /** Audio track index */
  trackIndex?: number;
}

/**
 * Video extraction options
 */
export interface VideoExtractOptions {
  /** Video codec */
  codec?: string;

  /** Start time */
  startTime?: number;

  /** Duration */
  duration?: number;

  /** Hardware acceleration */
  hwAccel?: HardwareAccelConfig;
}

/**
 * Frame extraction options
 */
export interface FrameOptions {
  /** Width */
  width?: number;

  /** Height */
  height?: number;
}

// Export singleton instance
export const videoDecoder = new VideoDecoder();
