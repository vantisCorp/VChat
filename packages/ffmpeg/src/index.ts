/**
 * @fileoverview FFmpeg integration package for V-COMM
 * @module @vcomm/ffmpeg
 * 
 * This package provides comprehensive FFmpeg integration with:
 * - Hardware acceleration support (NVIDIA, AMD, Intel, VAAPI, VideoToolbox)
 * - AV1 encoding with SVT-AV1
 * - Video and audio transcoding
 * - Thumbnail extraction
 * - Watermarking
 * - Media probing
 * - Preset-based encoding
 */

// Export types
export * from './types';

// Export modules
export { HardwareManager, hardwareManager } from './hardware';
export { VideoEncoder, videoEncoder } from './encoder';
export { VideoDecoder, videoDecoder } from './decoder';
export * from './utils';

// Import for convenience
import { HardwareManager, hardwareManager } from './hardware';
import { VideoEncoder, videoEncoder } from './encoder';
import { VideoDecoder, videoDecoder } from './decoder';
import {
  VideoConfig,
  _AudioConfig,
  OutputConfig,
  InputConfig,
  _TranscodeProgress,
  TranscodeEventHandler,
  HardwareAcceleration,
  VideoCodec,
  ContainerFormat,
  MediaInfo,
} from './types';
import {
  isFFmpegInstalled,
  getFFmpegVersion,
  getAvailableEncoders,
  getAvailableDecoders,
  getOptimalPreset,
  calculateBitrate,
  calculateCRF,
} from './utils';

/**
 * Main FFmpeg class providing a unified interface
 */
export class FFmpeg {
  private encoder: VideoEncoder;
  private decoder: VideoDecoder;
  private hardware: HardwareManager;
  private initialized = false;

  constructor() {
    this.encoder = videoEncoder;
    this.decoder = videoDecoder;
    this.hardware = hardwareManager;
  }

  /**
   * Initialize FFmpeg (detect hardware, check installation)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Check FFmpeg installation
    const installed = await isFFmpegInstalled();
    if (!installed) {
      throw new Error('FFmpeg is not installed. Please install FFmpeg to use this package.');
    }

    // Initialize hardware detection
    await this.hardware.initialize();

    this.initialized = true;
  }

  /**
   * Get FFmpeg version
   */
  async getVersion(): Promise<string> {
    return getFFmpegVersion();
  }

  /**
   * Get available encoders
   */
  async getEncoders(): Promise<string[]> {
    return getAvailableEncoders();
  }

  /**
   * Get available decoders
   */
  async getDecoders(): Promise<string[]> {
    return getAvailableDecoders();
  }

  /**
   * Get available hardware devices
   */
  getHardwareDevices() {
    return this.hardware.getDevices();
  }

  /**
   * Get best available hardware device
   */
  getBestHardwareDevice() {
    return this.hardware.getBestDevice();
  }

  /**
   * Transcode a video file
   */
  async transcode(
    input: string | InputConfig,
    output: OutputConfig,
    onProgress?: TranscodeEventHandler
  ): Promise<string> {
    await this.ensureInitialized();
    return this.encoder.transcode(input, output, onProgress);
  }

  /**
   * Encode video with H.264
   */
  async encodeH264(
    input: string,
    output: string,
    options?: Partial<VideoConfig>
  ): Promise<string> {
    await this.ensureInitialized();
    return this.encoder.encodeH264(input, output, options);
  }

  /**
   * Encode video with H.265/HEVC
   */
  async encodeHEVC(
    input: string,
    output: string,
    options?: Partial<VideoConfig>
  ): Promise<string> {
    await this.ensureInitialized();
    return this.encoder.encodeHEVC(input, output, options);
  }

  /**
   * Encode video with AV1
   */
  async encodeAV1(
    input: string,
    output: string,
    options?: Partial<VideoConfig>
  ): Promise<string> {
    await this.ensureInitialized();
    return this.encoder.encodeAV1(input, output, options);
  }

  /**
   * Encode for streaming
   */
  async encodeForStreaming(
    input: string,
    output: string,
    quality: '720p' | '1080p' | '1440p' | '4k' = '1080p'
  ): Promise<string> {
    const resolutions: Record<string, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
      '1440p': { width: 2560, height: 1440 },
      '4k': { width: 3840, height: 2160 },
    };

    const preset = getOptimalPreset('streaming');
    const resolution = resolutions[quality];

    return this.transcode(input, {
      path: output,
      format: 'mp4',
      video: {
        ...preset.video,
        ...resolution,
      },
      audio: preset.audio,
      fastStart: true,
    });
  }

  /**
   * Encode for web
   */
  async encodeForWeb(
    input: string,
    output: string,
    _options?: { quality?: 'low' | 'medium' | 'high' }
  ): Promise<string> {
    const preset = getOptimalPreset('web');

    return this.transcode(input, {
      path: output,
      format: 'webm',
      video: preset.video,
      audio: preset.audio,
    });
  }

  /**
   * Encode for mobile
   */
  async encodeForMobile(
    input: string,
    output: string,
    quality: '480p' | '720p' = '720p'
  ): Promise<string> {
    const preset = getOptimalPreset('mobile');

    const resolutions: Record<string, Partial<VideoConfig>> = {
      '480p': { width: 854, height: 480 },
      '720p': { width: 1280, height: 720 },
    };

    return this.transcode(input, {
      path: output,
      format: 'mp4',
      video: { ...preset.video, ...resolutions[quality] },
      audio: preset.audio,
    });
  }

  /**
   * Encode for archive
   */
  async encodeForArchive(
    input: string,
    output: string,
    codec: 'h265' | 'av1' = 'h265'
  ): Promise<string> {
    const preset = getOptimalPreset('archive');

    return this.transcode(input, {
      path: output,
      format: 'mkv',
      video: {
        ...preset.video,
        codec: codec === 'av1' ? 'libsvtav1' : 'libx265',
      },
      audio: preset.audio,
    });
  }

  /**
   * Add watermark to video
   */
  async addWatermark(
    input: string,
    watermarkPath: string,
    output: string,
    options?: {
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
      opacity?: number;
      scale?: number;
    }
  ): Promise<string> {
    await this.ensureInitialized();
    return this.encoder.addWatermark(input, {
      image: watermarkPath,
      position: options?.position || 'bottom-right',
      opacity: options?.opacity,
      scale: options?.scale,
    }, output);
  }

  /**
   * Extract thumbnails
   */
  async extractThumbnails(
    input: string,
    outputDir: string,
    options?: {
      count?: number;
      interval?: number;
      width?: number;
      height?: number;
    }
  ): Promise<string[]> {
    await this.ensureInitialized();
    return this.encoder.extractThumbnails(input, {
      output: `${outputDir}/thumb_%d.jpg`,
      count: options?.count,
      interval: options?.interval,
      width: options?.width,
      height: options?.height,
    });
  }

  /**
   * Get media information
   */
  async getMediaInfo(input: string): Promise<MediaInfo> {
    await this.ensureInitialized();
    return this.encoder.getMediaInfo(input);
  }

  /**
   * Extract audio from video
   */
  async extractAudio(
    input: string,
    output: string,
    options?: {
      codec?: 'aac' | 'mp3' | 'opus' | 'flac';
      bitrate?: number;
    }
  ): Promise<string> {
    await this.ensureInitialized();
    return this.decoder.extractAudio(input, output, {
      codec: options?.codec === 'mp3' ? 'libmp3lame' : 
             options?.codec === 'opus' ? 'libopus' : 
             options?.codec || 'aac',
      bitrate: options?.bitrate,
    });
  }

  /**
   * Trim video
   */
  async trim(
    input: string,
    output: string,
    startTime: number,
    endTime: number
  ): Promise<string> {
    await this.ensureInitialized();
    return this.transcode(
      { path: input, startTime, duration: endTime - startTime },
      { path: output, format: 'mp4', overwrite: true }
    );
  }

  /**
   * Convert video format
   */
  async convert(
    input: string,
    output: string,
    format: ContainerFormat
  ): Promise<string> {
    await this.ensureInitialized();
    return this.transcode(input, {
      path: output,
      format,
      overwrite: true,
    });
  }

  /**
   * Resize video
   */
  async resize(
    input: string,
    output: string,
    width: number,
    height?: number
  ): Promise<string> {
    await this.ensureInitialized();
    return this.transcode(input, {
      path: output,
      format: 'mp4',
      video: { width, height, codec: 'libx264' },
      overwrite: true,
    });
  }

  /**
   * Set preferred hardware accelerator
   */
  setHardwareAcceleration(type: HardwareAcceleration): void {
    this.hardware.setPreferredDevice(type);
  }

  /**
   * Get recommended encoder for codec
   */
  getRecommendedEncoder(codec: string): VideoCodec {
    return this.hardware.getRecommendedEncoder(codec);
  }

  /**
   * Check if hardware acceleration is available
   */
  isHardwareAvailable(type: HardwareAcceleration): boolean {
    return this.hardware.isHardwareAvailable(type);
  }

  /**
   * Calculate bitrate for quality
   */
  calculateBitrate(
    width: number,
    height: number,
    framerate: number,
    quality: 'low' | 'medium' | 'high' | 'ultra' = 'medium'
  ): number {
    return calculateBitrate(width, height, framerate, quality);
  }

  /**
   * Calculate CRF for quality
   */
  calculateCRF(quality: number, codec: string): number {
    return calculateCRF(quality, codec);
  }

  /**
   * Ensure FFmpeg is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Export default instance
export default new FFmpeg();

// Export convenience function
export const ffmpeg = new FFmpeg();