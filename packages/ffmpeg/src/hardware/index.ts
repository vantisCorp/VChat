/**
 * @fileoverview Hardware acceleration module for FFmpeg
 * @module @vcomm/ffmpeg/hardware
 */

import { spawn } from 'child_process';
import * as os from 'os';
import {
  HardwareDevice,
  HardwareAcceleration,
  HardwareCapabilities,
  HardwareAccelConfig,
  VideoCodec,
  FFmpegError,
  FFmpegErrorCode,
} from '../types';

/**
 * Hardware acceleration manager
 * Detects and manages hardware encoding/decoding capabilities
 */
export class HardwareManager {
  private devices: Map<string, HardwareDevice> = new Map();
  private preferredDevice: HardwareAcceleration = 'none';
  private initialized = false;

  /**
   * Initialize hardware detection
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const platform = os.platform();
    
    // Detect available hardware
    if (platform === 'linux') {
      await this.detectVAAPI();
      await this.detectNVIDIA();
      await this.detectAMD();
      await this.detectIntelQSV();
    } else if (platform === 'win32') {
      await this.detectNVIDIA();
      await this.detectAMD();
      await this.detectIntelQSV();
    } else if (platform === 'darwin') {
      await this.detectVideoToolbox();
    }

    this.initialized = true;
  }

  /**
   * Detect NVIDIA GPUs
   */
  private async detectNVIDIA(): Promise<void> {
    try {
      const nvidiaSmi = await this.runCommand('nvidia-smi', [
        '--query-gpu=index,name,memory.total,memory.used,memory.free',
        '--format=csv,noheader,nounits',
      ]);

      if (!nvidiaSmi) return;

      const lines = nvidiaSmi.split('\n').filter(Boolean);

      for (const line of lines) {
        const [index, name, total, used, free] = line.split(',').map(s => s.trim());
        
        const nvencCodecs = await this.getNVIDIAEncoders();
        const nvdecCodecs = await this.getNVIDIADecoders();

        const device: HardwareDevice = {
          type: 'nvenc',
          index: parseInt(index, 10),
          name,
          encoders: nvencCodecs,
          decoders: nvdecCodecs,
          memory: {
            total: parseInt(total, 10) * 1024 * 1024,
            used: parseInt(used, 10) * 1024 * 1024,
            free: parseInt(free, 10) * 1024 * 1024,
          },
          capabilities: this.getNVIDIACapabilities(name),
        };

        this.devices.set(`nvenc_${index}`, device);
      }
    } catch (_error) {
      // NVIDIA not available
    }
  }

  /**
   * Get available NVIDIA encoders
   */
  private async getNVIDIAEncoders(): Promise<VideoCodec[]> {
    const encoders: VideoCodec[] = ['h264_nvenc', 'hevc_nvenc'];
    
    // Check for AV1 support (RTX 40 series)
    try {
      const ffmpegEncoders = await this.runCommand('ffmpeg', ['-encoders']);
      if (ffmpegEncoders?.includes('av1_nvenc')) {
        encoders.push('av1_nvenc');
      }
    } catch {
      // Ignore
    }

    return encoders;
  }

  /**
   * Get available NVIDIA decoders
   */
  private async getNVIDIADecoders(): Promise<VideoCodec[]> {
    return ['h264_nvenc', 'hevc_nvenc'];
  }

  /**
   * Get NVIDIA GPU capabilities
   */
  private getNVIDIACapabilities(gpuName: string): HardwareCapabilities {
    const isRTX40 = gpuName.toLowerCase().includes('rtx 40');
    const _isRTX30 = gpuName.toLowerCase().includes('rtx 30');
    
    return {
      maxResolution: { width: 7680, height: 4320 },
      maxFramerate: 240,
      pixelFormats: ['yuv420p', 'yuv420p10le', 'yuv444p', 'yuv444p10le'],
      codecs: isRTX40 
        ? ['h264_nvenc', 'hevc_nvenc', 'av1_nvenc']
        : ['h264_nvenc', 'hevc_nvenc'],
      hdrSupport: true,
      bFrameSupport: true,
      maxBFrames: 5,
      tenBitSupport: true,
      rateControlModes: ['cbr', 'vbr', 'cq'],
    };
  }

  /**
   * Detect AMD GPUs
   */
  private async detectAMD(): Promise<void> {
    try {
      const amfEncoders = await this.checkAMEncoders();
      
      if (amfEncoders.length > 0) {
        const device: HardwareDevice = {
          type: 'amf',
          index: 0,
          name: 'AMD GPU',
          encoders: amfEncoders,
          decoders: ['h264_amf', 'hevc_amf'],
          capabilities: {
            maxResolution: { width: 7680, height: 4320 },
            maxFramerate: 240,
            pixelFormats: ['yuv420p', 'yuv420p10le', 'yuv444p'],
            codecs: amfEncoders,
            hdrSupport: true,
            bFrameSupport: true,
            maxBFrames: 3,
            tenBitSupport: true,
            rateControlModes: ['cbr', 'vbr', 'cq'],
          },
        };

        this.devices.set('amf_0', device);
      }
    } catch (_error) {
      // AMD not available
    }
  }

  /**
   * Check for AMD AMF encoders
   */
  private async checkAMEncoders(): Promise<VideoCodec[]> {
    const encoders: VideoCodec[] = [];
    
    try {
      const ffmpegEncoders = await this.runCommand('ffmpeg', ['-encoders']);
      if (ffmpegEncoders?.includes('h264_amf')) encoders.push('h264_amf');
      if (ffmpegEncoders?.includes('hevc_amf')) encoders.push('hevc_amf');
    } catch {
      // Ignore
    }

    return encoders;
  }

  /**
   * Detect Intel Quick Sync Video
   */
  private async detectIntelQSV(): Promise<void> {
    try {
      const qsvEncoders = await this.checkQSVEncoders();
      
      if (qsvEncoders.length > 0) {
        const device: HardwareDevice = {
          type: 'qsv',
          index: 0,
          name: 'Intel Quick Sync Video',
          encoders: qsvEncoders,
          decoders: ['h264_qsv', 'hevc_qsv', 'vp9_qsv', 'av1_qsv'],
          capabilities: {
            maxResolution: { width: 7680, height: 4320 },
            maxFramerate: 240,
            pixelFormats: ['yuv420p', 'yuv420p10le', 'yuv444p'],
            codecs: qsvEncoders,
            hdrSupport: true,
            bFrameSupport: true,
            maxBFrames: 3,
            tenBitSupport: true,
            rateControlModes: ['cbr', 'vbr', 'cq'],
          },
        };

        this.devices.set('qsv_0', device);
      }
    } catch (_error) {
      // Intel QSV not available
    }
  }

  /**
   * Check for Intel QSV encoders
   */
  private async checkQSVEncoders(): Promise<VideoCodec[]> {
    const encoders: VideoCodec[] = [];
    
    try {
      const ffmpegEncoders = await this.runCommand('ffmpeg', ['-encoders']);
      if (ffmpegEncoders?.includes('h264_qsv')) encoders.push('h264_qsv');
      if (ffmpegEncoders?.includes('hevc_qsv')) encoders.push('hevc_qsv');
      if (ffmpegEncoders?.includes('av1_qsv')) encoders.push('av1_qsv');
    } catch {
      // Ignore
    }

    return encoders;
  }

  /**
   * Detect VAAPI (Linux)
   */
  private async detectVAAPI(): Promise<void> {
    try {
      const vaapiDevices = await this.runCommand('ls', ['-la', '/dev/dri/']);
      
      if (vaapiDevices?.includes('renderD')) {
        const vaapiEncoders = await this.checkVAAPIEncoders();
        
        if (vaapiEncoders.length > 0) {
          const device: HardwareDevice = {
            type: 'vaapi',
            index: 0,
            name: 'VAAPI Device',
            encoders: vaapiEncoders,
            decoders: ['h264_vaapi', 'hevc_vaapi', 'vp9_vaapi', 'av1_vaapi'],
            capabilities: {
              maxResolution: { width: 7680, height: 4320 },
              maxFramerate: 240,
              pixelFormats: ['yuv420p', 'yuv420p10le'],
              codecs: vaapiEncoders,
              hdrSupport: true,
              bFrameSupport: false,
              maxBFrames: 0,
              tenBitSupport: true,
              rateControlModes: ['cbr', 'vbr'],
            },
          };

          this.devices.set('vaapi_0', device);
        }
      }
    } catch (_error) {
      // VAAPI not available
    }
  }

  /**
   * Check for VAAPI encoders
   */
  private async checkVAAPIEncoders(): Promise<VideoCodec[]> {
    const encoders: VideoCodec[] = [];
    
    try {
      const ffmpegEncoders = await this.runCommand('ffmpeg', ['-encoders']);
      if (ffmpegEncoders?.includes('h264_vaapi')) encoders.push('h264_vaapi');
      if (ffmpegEncoders?.includes('hevc_vaapi')) encoders.push('hevc_vaapi');
      if (ffmpegEncoders?.includes('vp9_vaapi')) encoders.push('vp9_vaapi');
      if (ffmpegEncoders?.includes('av1_vaapi')) encoders.push('av1_vaapi');
    } catch {
      // Ignore
    }

    return encoders;
  }

  /**
   * Detect Apple VideoToolbox
   */
  private async detectVideoToolbox(): Promise<void> {
    try {
      const vtEncoders = await this.checkVideoToolboxEncoders();
      
      if (vtEncoders.length > 0) {
        const device: HardwareDevice = {
          type: 'videotoolbox',
          index: 0,
          name: 'Apple VideoToolbox',
          encoders: vtEncoders,
          decoders: ['h264_videotoolbox', 'hevc_videotoolbox'],
          capabilities: {
            maxResolution: { width: 7680, height: 4320 },
            maxFramerate: 240,
            pixelFormats: ['yuv420p', 'yuv420p10le', 'yuv444p'],
            codecs: vtEncoders,
            hdrSupport: true,
            bFrameSupport: true,
            maxBFrames: 3,
            tenBitSupport: true,
            rateControlModes: ['cbr', 'vbr'],
          },
        };

        this.devices.set('videotoolbox_0', device);
      }
    } catch (_error) {
      // VideoToolbox not available
    }
  }

  /**
   * Check for VideoToolbox encoders
   */
  private async checkVideoToolboxEncoders(): Promise<VideoCodec[]> {
    const encoders: VideoCodec[] = [];
    
    try {
      const ffmpegEncoders = await this.runCommand('ffmpeg', ['-encoders']);
      if (ffmpegEncoders?.includes('h264_videotoolbox')) encoders.push('h264_videotoolbox');
      if (ffmpegEncoders?.includes('hevc_videotoolbox')) encoders.push('hevc_videotoolbox');
    } catch {
      // Ignore
    }

    return encoders;
  }

  /**
   * Run a command and return output
   */
  private runCommand(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, { shell: true });
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
          resolve(stdout);
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
   * Get all available hardware devices
   */
  getDevices(): HardwareDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get device by type
   */
  getDevice(type: HardwareAcceleration, index = 0): HardwareDevice | undefined {
    return this.devices.get(`${type}_${index}`);
  }

  /**
   * Get the best available hardware device
   */
  getBestDevice(): HardwareDevice | undefined {
    // Priority: NVIDIA > AMD > Intel > VAAPI > VideoToolbox
    const priority: HardwareAcceleration[] = [
      'nvenc', 'amf', 'qsv', 'vaapi', 'videotoolbox'
    ];

    for (const type of priority) {
      const device = this.devices.get(`${type}_0`);
      if (device) {
        return device;
      }
    }

    return undefined;
  }

  /**
   * Set preferred hardware device
   */
  setPreferredDevice(type: HardwareAcceleration): void {
    this.preferredDevice = type;
  }

  /**
   * Get preferred hardware device
   */
  getPreferredDevice(): HardwareAcceleration {
    return this.preferredDevice;
  }

  /**
   * Check if hardware acceleration is available
   */
  isHardwareAvailable(type: HardwareAcceleration): boolean {
    return this.devices.has(`${type}_0`);
  }

  /**
   * Get recommended encoder for a codec
   */
  getRecommendedEncoder(codec: string): VideoCodec {
    // Check if we have hardware acceleration for this codec
    const hwMapping: Record<string, VideoCodec[]> = {
      'h264': ['h264_nvenc', 'h264_amf', 'h264_qsv', 'h264_vaapi', 'h264_videotoolbox', 'libx264'],
      'hevc': ['hevc_nvenc', 'hevc_amf', 'hevc_qsv', 'hevc_vaapi', 'hevc_videotoolbox', 'libx265'],
      'av1': ['av1_nvenc', 'av1_qsv', 'av1_vaapi', 'libsvtav1', 'libaom-av1'],
      'vp9': ['vp9_vaapi', 'libvpx-vp9'],
    };

    const codecs = hwMapping[codec] || [];
    
    for (const c of codecs) {
      // Check hardware devices first
      for (const device of this.devices.values()) {
        if (device.encoders.includes(c)) {
          return c;
        }
      }
    }

    // Fallback to software
    return codecs[codecs.length - 1] as VideoCodec;
  }

  /**
   * Get hardware acceleration options for FFmpeg
   */
  getHardwareOptions(config: HardwareAccelConfig): string[] {
    const options: string[] = [];

    switch (config.type) {
      case 'nvenc':
        if (config.hwDecode) {
          options.push('-hwaccel', 'cuda');
          if (config.deviceIndex !== undefined) {
            options.push('-hwaccel_device', config.deviceIndex.toString());
          }
        }
        break;

      case 'qsv':
        if (config.hwDecode) {
          options.push('-hwaccel', 'qsv');
          options.push('-hwaccel_output_format', 'qsv');
        }
        break;

      case 'vaapi':
        if (config.hwDecode) {
          const device = config.deviceIndex ?? 0;
          options.push('-hwaccel', 'vaapi');
          options.push('-vaapi_device', `/dev/dri/renderD${128 + device}`);
          options.push('-hwaccel_output_format', 'vaapi');
        }
        break;

      case 'videotoolbox':
        if (config.hwDecode) {
          options.push('-hwaccel', 'videotoolbox');
        }
        break;

      case 'amf':
        if (config.hwDecode) {
          options.push('-hwaccel', 'd3d11va');
        }
        break;
    }

    return options;
  }

  /**
   * Validate hardware configuration
   */
  validateConfig(config: HardwareAccelConfig): void {
    if (config.type === 'none') {
      return;
    }

    const device = this.getDevice(config.type, config.deviceIndex ?? 0);
    
    if (!device) {
      throw new FFmpegError(
        `Hardware acceleration ${config.type} is not available`,
        FFmpegErrorCode.HARDWARE_NOT_AVAILABLE,
        { requested: config.type, available: Array.from(this.devices.keys()) }
      );
    }
  }

  /**
   * Get system information
   */
  getSystemInfo(): {
    platform: string;
    cpuCores: number;
    totalMemory: number;
    devices: HardwareDevice[];
  } {
    return {
      platform: os.platform(),
      cpuCores: os.cpus().length,
      totalMemory: os.totalmem(),
      devices: this.getDevices(),
    };
  }
}

// Export singleton instance
export const hardwareManager = new HardwareManager();