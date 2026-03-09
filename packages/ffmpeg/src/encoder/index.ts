/**
 * @fileoverview Video/Audio encoder module for FFmpeg
 * @module @vcomm/ffmpeg/encoder
 */

import ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import {
  VideoConfig,
  AudioConfig,
  OutputConfig,
  InputConfig,
  TranscodeProgress,
  TranscodeEventHandler,
  FFmpegError,
  FFmpegErrorCode,
  MediaInfo,
  WatermarkConfig,
  ThumbnailOptions,
} from '../types';
import { hardwareManager, HardwareManager } from '../hardware';

/**
 * Video encoder class
 * Handles video encoding with hardware acceleration support
 */
export class VideoEncoder {
  private hwManager: HardwareManager;
  private ffmpegPath: string | null = null;
  private ffprobePath: string | null = null;

  constructor() {
    this.hwManager = hardwareManager;
  }

  /**
   * Set custom FFmpeg path
   */
  setFFmpegPath(ffmpegPath: string, ffprobePath: string): void {
    this.ffmpegPath = ffmpegPath;
    this.ffprobePath = ffprobePath;
    ffmpeg.setFfmpegPath(ffmpegPath);
    ffmpeg.setFfprobePath(ffprobePath);
  }

  /**
   * Transcode a video file
   */
  async transcode(
    input: InputConfig | string,
    output: OutputConfig,
    onProgress?: TranscodeEventHandler
  ): Promise<string> {
    const inputConfig = typeof input === 'string' ? { path: input } : input;

    // Validate input exists
    await this.validateInput(inputConfig.path);

    // Create FFmpeg command
    const command = ffmpeg(inputConfig.path);

    // Apply input options
    this.applyInputOptions(command, inputConfig);

    // Apply output options
    this.applyOutputOptions(command, output);

    // Set up event handlers
    return new Promise((resolve, reject) => {
      command
        .on('start', (_commandLine) => {
          onProgress?.('start', {
            frame: 0,
            fps: 0,
            quality: 0,
            size: 0,
            time: 0,
            bitrate: 0,
            speed: 0,
            progress: 0,
          });
        })
        .on('progress', (progress) => {
          const transcodeProgress: TranscodeProgress = {
            frame: progress.frames || 0,
            fps: progress.currentFps || 0,
            quality: 0,
            size: progress.targetSize ? progress.targetSize * 1024 : 0,
            time: this.parseTimeString(progress.timemark),
            bitrate: this.parseBitrate(progress.currentKbps),
            speed: progress.currentKbps ? 1 : 0,
            progress: progress.percent || 0,
          };
          onProgress?.('progress', transcodeProgress);
        })
        .on('end', () => {
          onProgress?.('end', {
            frame: 0,
            fps: 0,
            quality: 0,
            size: 0,
            time: 0,
            bitrate: 0,
            speed: 0,
            progress: 100,
          });
          resolve(output.path);
        })
        .on('error', (err) => {
          onProgress?.('error', err);
          reject(
            new FFmpegError(`Transcoding failed: ${err.message}`, FFmpegErrorCode.ENCODING_FAILED, {
              originalError: err.message,
            })
          );
        })
        .save(output.path);
    });
  }

  /**
   * Encode with AV1 codec
   */
  async encodeAV1(
    input: string,
    output: string,
    options: Partial<VideoConfig> = {}
  ): Promise<string> {
    const config: OutputConfig = {
      path: output,
      format: 'mp4',
      video: {
        codec: 'libsvtav1',
        ...options,
      },
    };

    return this.transcode(input, config);
  }

  /**
   * Encode with H.264 codec
   */
  async encodeH264(
    input: string,
    output: string,
    options: Partial<VideoConfig> = {}
  ): Promise<string> {
    // Get best available encoder
    const encoder = this.hwManager.getRecommendedEncoder('h264');

    const config: OutputConfig = {
      path: output,
      format: 'mp4',
      video: {
        codec: encoder,
        preset: 'medium',
        quality: 23,
        ...options,
      },
    };

    return this.transcode(input, config);
  }

  /**
   * Encode with H.265/HEVC codec
   */
  async encodeHEVC(
    input: string,
    output: string,
    options: Partial<VideoConfig> = {}
  ): Promise<string> {
    const encoder = this.hwManager.getRecommendedEncoder('hevc');

    const config: OutputConfig = {
      path: output,
      format: 'mp4',
      video: {
        codec: encoder,
        preset: 'medium',
        quality: 28,
        ...options,
      },
    };

    return this.transcode(input, config);
  }

  /**
   * Apply input options to FFmpeg command
   */
  private applyInputOptions(command: ffmpeg.FfmpegCommand, input: InputConfig): void {
    // Start time
    if (input.startTime) {
      command.setStartTime(input.startTime);
    }

    // Duration
    if (input.duration) {
      command.setDuration(input.duration);
    }

    // Input format
    if (input.format) {
      command.inputFormat(input.format);
    }

    // Hardware acceleration
    if (input.hwAccel && input.hwAccel.type !== 'none') {
      const hwOptions = this.hwManager.getHardwareOptions(input.hwAccel);
      hwOptions.forEach((opt, i) => {
        if (i % 2 === 0 && hwOptions[i + 1]) {
          command.inputOptions([`${opt} ${hwOptions[i + 1]}`]);
        }
      });
    }

    // Custom options
    if (input.options) {
      Object.entries(input.options).forEach(([key, value]) => {
        command.inputOptions([`-${key}`, String(value)]);
      });
    }
  }

  /**
   * Apply output options to FFmpeg command
   */
  private applyOutputOptions(command: ffmpeg.FfmpegCommand, output: OutputConfig): void {
    // Container format
    command.format(output.format);

    // Video configuration
    if (output.video) {
      this.applyVideoOptions(command, output.video);
    }

    // Audio configuration
    if (output.audio) {
      const audioConfigs = Array.isArray(output.audio) ? output.audio : [output.audio];
      audioConfigs.forEach((audio, index) => {
        this.applyAudioOptions(command, audio, index);
      });
    }

    // Metadata
    if (output.metadata) {
      Object.entries(output.metadata).forEach(([key, value]) => {
        command.outputOptions([`-metadata`, `${key}=${value}`]);
      });
    }

    // Fast start for streaming
    if (output.fastStart) {
      command.outputOptions(['-movflags', '+faststart']);
    }

    // Overwrite
    if (output.overwrite) {
      command.outputOptions('-y');
    }

    // Custom options
    if (output.customOptions) {
      Object.entries(output.customOptions).forEach(([key, value]) => {
        command.outputOptions([`-${key}`, String(value)]);
      });
    }
  }

  /**
   * Apply video options to FFmpeg command
   */
  private applyVideoOptions(command: ffmpeg.FfmpegCommand, video: VideoConfig): void {
    // Codec
    command.videoCodec(video.codec);

    // Resolution
    if (video.width || video.height) {
      command.size(`${video.width || '?'}x${video.height || '?'}`);
    }

    // Frame rate
    if (video.framerate) {
      command.fps(video.framerate);
    }

    // Bitrate
    if (video.bitrate) {
      command.videoBitrate(video.bitrate / 1000); // fluent-ffmpeg expects kbps
    }

    // Quality (CRF/CQ)
    if (video.quality !== undefined) {
      command.outputOptions(['-crf', String(video.quality)]);
    }

    // Preset
    if (video.preset) {
      command.outputOptions(['-preset', video.preset]);
    }

    // Profile
    if (video.profile) {
      command.outputOptions(['-profile:v', video.profile]);
    }

    // GOP size
    if (video.gopSize) {
      command.outputOptions(['-g', String(video.gopSize)]);
    }

    // Pixel format
    if (video.pixelFormat) {
      command.outputOptions(['-pix_fmt', video.pixelFormat]);
    }

    // B-frames
    if (video.bFrames !== undefined) {
      command.outputOptions(['-bf', String(video.bFrames)]);
    }

    // Deinterlace
    if (video.deinterlace) {
      command.outputOptions(['-vf', 'yadif']);
    }

    // Aspect ratio
    if (video.aspectRatio) {
      command.aspectRatio(video.aspectRatio);
    }

    // HDR configuration
    if (video.hdr) {
      this.applyHDROptions(command, video.hdr);
    }

    // Hardware-specific options
    this.applyHardwareSpecificOptions(command, video);
  }

  /**
   * Apply HDR options
   */
  private applyHDROptions(
    command: ffmpeg.FfmpegCommand,
    hdr: NonNullable<VideoConfig['hdr']>
  ): void {
    // Color properties
    if (hdr.colorPrimaries) {
      command.outputOptions(['-color_primaries', String(hdr.colorPrimaries)]);
    }
    if (hdr.transferCharacteristics) {
      command.outputOptions(['-color_trc', String(hdr.transferCharacteristics)]);
    }
    if (hdr.matrixCoefficients) {
      command.outputOptions(['-colorspace', String(hdr.matrixCoefficients)]);
    }

    // HDR10 metadata
    if (hdr.mode === 'hdr10' && hdr.masteringDisplay) {
      command.outputOptions(['-mastering_display', hdr.masteringDisplay]);
    }

    // Content light level
    if (hdr.contentLight) {
      command.outputOptions(['-max_cll', `${hdr.contentLight.max},${hdr.contentLight.avg}`]);
    }
  }

  /**
   * Apply hardware-specific encoding options
   */
  private applyHardwareSpecificOptions(command: ffmpeg.FfmpegCommand, video: VideoConfig): void {
    const codec = video.codec;

    // NVIDIA NVENC options
    if (codec.includes('nvenc')) {
      if (video.rateControl) {
        const rcMode =
          video.rateControl === 'vbr' ? 'vbr' : video.rateControl === 'cbr' ? 'cbr' : 'constqp';
        command.outputOptions(['-rc', rcMode]);
      }
      if (video.quality !== undefined) {
        command.outputOptions(['-cq', String(video.quality)]);
      }
      if (video.preset) {
        const nvencPreset = this.mapToNVENCPreset(video.preset);
        command.outputOptions(['-preset', nvencPreset]);
      }
      if (video.hwAccel?.deviceIndex !== undefined) {
        command.outputOptions(['-gpu', String(video.hwAccel.deviceIndex)]);
      }
    }

    // AMD AMF options
    if (codec.includes('amf')) {
      if (video.quality !== undefined) {
        command.outputOptions(['-qp_i', String(video.quality)]);
        command.outputOptions(['-qp_p', String(video.quality)]);
      }
      if (video.preset) {
        const amfPreset = this.mapToAMFPreset(video.preset);
        command.outputOptions(['-quality', amfPreset]);
      }
    }

    // Intel QSV options
    if (codec.includes('qsv')) {
      if (video.preset) {
        const qsvPreset = this.mapToQSVPreset(video.preset);
        command.outputOptions(['-preset', qsvPreset]);
      }
    }

    // VAAPI options
    if (codec.includes('vaapi')) {
      if (video.bitrate) {
        command.outputOptions(['-maxrate:v', String(video.bitrate)]);
        command.outputOptions(['-bufsize:v', String(video.bitrate * 2)]);
      }
    }

    // SVT-AV1 options
    if (codec === 'libsvtav1') {
      if (video.preset) {
        const svtPreset = this.mapToSVTPreset(video.preset);
        command.outputOptions(['-svtav1-params', `preset=${svtPreset}`]);
      }
    }
  }

  /**
   * Map preset to NVENC preset
   */
  private mapToNVENCPreset(preset: string): string {
    const mapping: Record<string, string> = {
      ultrafast: 'p1',
      superfast: 'p1',
      veryfast: 'p2',
      faster: 'p3',
      fast: 'p4',
      medium: 'p5',
      slow: 'p6',
      slower: 'p7',
      veryslow: 'p7',
    };
    return mapping[preset] || 'p4';
  }

  /**
   * Map preset to AMF preset
   */
  private mapToAMFPreset(preset: string): string {
    const mapping: Record<string, string> = {
      ultrafast: 'speed',
      superfast: 'speed',
      veryfast: 'balanced',
      faster: 'balanced',
      fast: 'balanced',
      medium: 'balanced',
      slow: 'quality',
      slower: 'quality',
      veryslow: 'quality',
    };
    return mapping[preset] || 'balanced';
  }

  /**
   * Map preset to QSV preset
   */
  private mapToQSVPreset(preset: string): string {
    const mapping: Record<string, string> = {
      ultrafast: 'veryfast',
      superfast: 'veryfast',
      veryfast: 'veryfast',
      faster: 'faster',
      fast: 'fast',
      medium: 'medium',
      slow: 'slow',
      slower: 'slower',
      veryslow: 'veryslow',
    };
    return mapping[preset] || 'medium';
  }

  /**
   * Map preset to SVT-AV1 preset
   */
  private mapToSVTPreset(preset: string): number {
    const mapping: Record<string, number> = {
      ultrafast: 12,
      superfast: 10,
      veryfast: 8,
      faster: 6,
      fast: 5,
      medium: 4,
      slow: 3,
      slower: 2,
      veryslow: 1,
    };
    return mapping[preset] || 4;
  }

  /**
   * Apply audio options to FFmpeg command
   */
  private applyAudioOptions(
    command: ffmpeg.FfmpegCommand,
    audio: AudioConfig,
    _index: number
  ): void {
    // Codec
    command.audioCodec(audio.codec);

    // Bitrate
    if (audio.bitrate) {
      command.audioBitrate(audio.bitrate / 1000); // fluent-ffmpeg expects kbps
    }

    // Sample rate
    if (audio.sampleRate) {
      command.audioFrequency(audio.sampleRate);
    }

    // Channels
    if (audio.channels) {
      command.audioChannels(audio.channels);
    }

    // Quality
    if (audio.quality !== undefined) {
      command.audioQuality(audio.quality);
    }

    // Audio filters
    if (audio.filters && audio.filters.length > 0) {
      const filterStr = audio.filters
        .map((f) => {
          if (f.options) {
            const opts = Object.entries(f.options)
              .map(([k, v]) => `${k}=${v}`)
              .join(':');
            return `${f.name}=${opts}`;
          }
          return f.name;
        })
        .join(',');
      command.audioFilters(filterStr);
    }
  }

  /**
   * Add watermark to video
   */
  async addWatermark(input: string, watermark: WatermarkConfig, output: string): Promise<string> {
    const command = ffmpeg(input);

    // Build overlay filter
    const { position, offsetX = 0, offsetY = 0, opacity = 1, scale = 1 } = watermark;

    const positions: Record<string, string> = {
      'top-left': `${offsetX}:${offsetY}`,
      'top-right': `main_w-overlay_w-${offsetX}:${offsetY}`,
      'bottom-left': `${offsetX}:main_h-overlay_h-${offsetY}`,
      'bottom-right': `main_w-overlay_w-${offsetX}:main_h-overlay_h-${offsetY}`,
      center: '(main_w-overlay_w)/2:(main_h-overlay_h)/2',
    };

    const overlayPos = positions[position];
    let filterComplex = `[1:v]scale=${scale}*iw:${scale}*ih`;

    if (opacity < 1) {
      filterComplex += `,format=rgba,colorchannelmixer=aa=${opacity}`;
    }

    filterComplex += `[overlay];[0:v][overlay]overlay=${overlayPos}`;

    command.input(watermark.image).complexFilter(filterComplex).output(output);

    return new Promise((resolve, reject) => {
      command
        .on('end', () => resolve(output))
        .on('error', (err) =>
          reject(new FFmpegError(`Watermark failed: ${err.message}`, FFmpegErrorCode.FILTER_ERROR))
        )
        .run();
    });
  }

  /**
   * Extract thumbnails from video
   */
  async extractThumbnails(input: string, options: ThumbnailOptions): Promise<string[]> {
    const _command = ffmpeg(input);
    const thumbnails: string[] = [];

    if (options.timestamps && options.timestamps.length > 0) {
      // Extract at specific timestamps
      for (const ts of options.timestamps) {
        const output = options.output.replace('%d', String(ts));
        await this.extractFrame(input, ts, output, options);
        thumbnails.push(output);
      }
    } else if (options.count) {
      // Extract N evenly spaced thumbnails
      const info = await this.getMediaInfo(input);
      const interval = info.duration / (options.count + 1);

      for (let i = 1; i <= options.count; i++) {
        const ts = interval * i;
        const output = options.output.replace('%d', String(i));
        await this.extractFrame(input, ts, output, options);
        thumbnails.push(output);
      }
    } else if (options.interval) {
      // Extract at regular intervals
      const info = await this.getMediaInfo(input);
      const count = Math.floor(info.duration / options.interval);

      for (let i = 0; i < count; i++) {
        const ts = i * options.interval;
        const output = options.output.replace('%d', String(i + 1));
        await this.extractFrame(input, ts, output, options);
        thumbnails.push(output);
      }
    }

    return thumbnails;
  }

  /**
   * Extract a single frame
   */
  private async extractFrame(
    input: string,
    timestamp: number,
    output: string,
    options: ThumbnailOptions
  ): Promise<void> {
    const command = ffmpeg(input).screenshots({
      timestamps: [timestamp],
      filename: path.basename(output),
      folder: path.dirname(output),
      size: options.width && options.height ? `${options.width}x${options.height}` : undefined,
    });

    return new Promise((resolve, reject) => {
      command.on('end', () => resolve()).on('error', (err) => reject(err));
    });
  }

  /**
   * Get media information
   */
  async getMediaInfo(input: string): Promise<MediaInfo> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(input, (err, data) => {
        if (err) {
          reject(
            new FFmpegError(`Failed to probe media: ${err.message}`, FFmpegErrorCode.INVALID_INPUT)
          );
          return;
        }

        const format = data.format;
        const streams = data.streams || [];

        const mediaInfo: MediaInfo = {
          path: input,
          format: format.format_name || 'unknown',
          duration: format.duration || 0,
          size: format.size || 0,
          bitrate: format.bit_rate || 0,
          videoStreams: streams
            .filter((s) => s.codec_type === 'video')
            .map((s) => ({
              index: s.index,
              codec: s.codec_name || 'unknown',
              profile: s.profile,
              level: s.level,
              width: s.width || 0,
              height: s.height || 0,
              // eslint-disable-next-line security/detect-eval-with-expression
              framerate: eval(s.r_frame_rate || '0/1') || 0,
              aspectRatio: s.display_aspect_ratio || 'N/A',
              pixelFormat: s.pix_fmt || 'unknown',
              bitrate: s.bit_rate ? parseInt(s.bit_rate) : undefined,
            })),
          audioStreams: streams
            .filter((s) => s.codec_type === 'audio')
            .map((s) => ({
              index: s.index,
              codec: s.codec_name || 'unknown',
              profile: s.profile,
              sampleRate: s.sample_rate || 0,
              channels: s.channels || 0,
              channelLayout: s.channel_layout || 'unknown',
              bitrate: s.bit_rate ? parseInt(s.bit_rate) : undefined,
              language: s.tags?.language,
            })),
          subtitleStreams: streams
            .filter((s) => s.codec_type === 'subtitle')
            .map((s) => ({
              index: s.index,
              codec: s.codec_name || 'unknown',
              language: s.tags?.language,
            })),
          metadata: format.tags || {},
        };

        resolve(mediaInfo);
      });
    });
  }

  /**
   * Validate input file
   */
  private async validateInput(input: string): Promise<void> {
    const fs = await import('fs/promises');

    try {
      await fs.access(input);
    } catch {
      throw new FFmpegError(`Input file not found: ${input}`, FFmpegErrorCode.INVALID_INPUT, {
        path: input,
      });
    }
  }

  /**
   * Parse time string to seconds
   */
  private parseTimeString(timeStr: string): number {
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  /**
   * Parse bitrate string
   */
  private parseBitrate(kbps: number | undefined): number {
    return kbps ? kbps * 1000 : 0;
  }
}

// Export singleton instance
export const videoEncoder = new VideoEncoder();
