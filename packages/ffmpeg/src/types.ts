/**
 * @fileoverview Type definitions for FFmpeg integration package
 * @module @vcomm/ffmpeg/types
 */

// ============================================================================
// CODEC TYPES
// ============================================================================

/**
 * Supported video codecs
 */
export type VideoCodec = 
  | 'libx264'      // H.264 (software)
  | 'libx265'      // H.265/HEVC (software)
  | 'libsvtav1'    // AV1 (SVT-AV1)
  | 'libaom-av1'   // AV1 (libaom)
  | 'libvpx-vp9'   // VP9
  | 'h264_nvenc'   // H.264 (NVIDIA)
  | 'hevc_nvenc'   // H.265 (NVIDIA)
  | 'av1_nvenc'    // AV1 (NVIDIA)
  | 'h264_amf'     // H.264 (AMD)
  | 'hevc_amf'     // H.265 (AMD)
  | 'h264_vaapi'   // H.264 (VAAPI)
  | 'hevc_vaapi'   // H.265 (VAAPI)
  | 'vp9_vaapi'    // VP9 (VAAPI)
  | 'av1_vaapi'    // AV1 (VAAPI)
  | 'h264_qsv'     // H.264 (Intel QSV)
  | 'hevc_qsv'     // H.265 (Intel QSV)
  | 'vp9_qsv'      // VP9 (Intel QSV)
  | 'av1_qsv'      // AV1 (Intel QSV)
  | 'h264_videotoolbox'  // H.264 (macOS)
  | 'hevc_videotoolbox'; // H.265 (macOS)

/**
 * Supported audio codecs
 */
export type AudioCodec =
  | 'aac'          // AAC
  | 'libmp3lame'   // MP3
  | 'libopus'      // Opus
  | 'libvorbis'    // Vorbis
  | 'flac'         // FLAC
  | 'pcm_s16le'    // PCM 16-bit
  | 'pcm_s24le'    // PCM 24-bit
  | 'ac3'          // Dolby Digital
  | 'eac3';        // Dolby Digital Plus

/**
 * Supported container formats
 */
export type ContainerFormat =
  | 'mp4'
  | 'webm'
  | 'mkv'
  | 'avi'
  | 'mov'
  | 'flv'
  | 'ts'
  | 'm3u8'
  | 'ogg'
  | 'mp3'
  | 'flac'
  | 'wav';

/**
 * Hardware acceleration methods
 */
export type HardwareAcceleration =
  | 'none'         // Software encoding
  | 'cuda'         // NVIDIA CUDA
  | 'nvenc'        // NVIDIA NVENC
  | 'amf'          // AMD AMF
  | 'qsv'          // Intel Quick Sync Video
  | 'vaapi'        // Video Acceleration API (Linux)
  | 'videotoolbox' // Apple VideoToolbox
  | 'd3d11va'      // Direct3D 11
  | 'opencl';      // OpenCL

/**
 * Hardware acceleration configuration
 */
export interface HardwareAccelConfig {
  /** Acceleration type */
  type: HardwareAcceleration;
  
  /** Device index (for multi-GPU) */
  deviceIndex?: number;
  
  /** Device path (for VAAPI) */
  devicePath?: string;
}

// ============================================================================
// VIDEO CONFIGURATION
// ============================================================================

/**
 * Video encoding profile
 */
export type VideoProfile =
  | 'baseline'
  | 'main'
  | 'high'
  | 'high10'
  | 'high422'
  | 'high444'
  | 'main10'     // HEVC Main 10
  | 'main444';   // HEVC Main 4:4:4

/**
 * Video encoding preset
 */
export type VideoPreset =
  | 'ultrafast'
  | 'superfast'
  | 'veryfast'
  | 'faster'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'slower'
  | 'veryslow'
  | 'placebo';

/**
 * Rate control mode
 */
export type RateControlMode =
  | 'cbr'   // Constant Bitrate
  | 'vbr'   // Variable Bitrate
  | 'cq'    // Constant Quality
  | 'cqp';  // Constant Quantization Parameter

/**
 * Video encoding configuration
 */
export interface VideoConfig {
  /** Video codec to use */
  codec: VideoCodec;
  
  /** Output width in pixels */
  width?: number;
  
  /** Output height in pixels */
  height?: number;
  
  /** Frame rate (fps) */
  framerate?: number;
  
  /** Bitrate in bits per second */
  bitrate?: number;
  
  /** Target quality (for CQ mode, 0-51, lower is better) */
  quality?: number;
  
  /** Encoding preset */
  preset?: VideoPreset;
  
  /** Encoding profile */
  profile?: VideoProfile;
  
  /** Rate control mode */
  rateControl?: RateControlMode;
  
  /** Keyframe interval (GOP size) */
  gopSize?: number;
  
  /** Minimum keyframe interval in seconds */
  keyintMin?: number;
  
  /** Pixel format (e.g., 'yuv420p', 'yuv420p10le') */
  pixelFormat?: string;
  
  /** Hardware acceleration configuration */
  hwAccel?: HardwareAccelConfig;
  
  /** Number of B-frames */
  bFrames?: number;
  
  /** Aspect ratio (e.g., '16:9') */
  aspectRatio?: string;
  
  /** Deinterlace video */
  deinterlace?: boolean;
  
  /** Denoise video */
  denoise?: boolean;
  
  /** HDR configuration */
  hdr?: HDRConfig;
}

/**
 * HDR configuration
 */
export interface HDRConfig {
  /** HDR mode */
  mode: 'hdr10' | 'hdr10plus' | 'dolby_vision' | 'hlg';
  
  /** Mastering display color volume */
  masteringDisplay?: string;
  
  /** Content light level */
  contentLight?: {
    max: number;
    avg: number;
  };
  
  /** Color primaries */
  colorPrimaries?: number;
  
  /** Transfer characteristics */
  transferCharacteristics?: number;
  
  /** Matrix coefficients */
  matrixCoefficients?: number;
}

// ============================================================================
// AUDIO CONFIGURATION
// ============================================================================

/**
 * Audio channel layout
 */
export type AudioChannelLayout =
  | 'mono'
  | 'stereo'
  | '2.1'
  | '5.1'
  | '7.1'
  | '7.1.4';

/**
 * Audio encoding configuration
 */
export interface AudioConfig {
  /** Audio codec to use */
  codec: AudioCodec;
  
  /** Bitrate in bits per second */
  bitrate?: number;
  
  /** Sample rate in Hz */
  sampleRate?: number;
  
  /** Number of audio channels */
  channels?: number;
  
  /** Channel layout */
  channelLayout?: AudioChannelLayout;
  
  /** Audio quality (codec-specific) */
  quality?: number;
  
  /** Audio filter chain */
  filters?: AudioFilter[];
}

/**
 * Audio filter configuration
 */
export interface AudioFilter {
  /** Filter name */
  name: string;
  
  /** Filter options */
  options?: Record<string, string | number | boolean>;
}

// ============================================================================
// TRANSCODING CONFIGURATION
// ============================================================================

/**
 * Output configuration
 */
export interface OutputConfig {
  /** Output file path */
  path: string;
  
  /** Container format */
  format: ContainerFormat;
  
  /** Video configuration */
  video?: VideoConfig;
  
  /** Audio configuration (can be multiple streams) */
  audio?: AudioConfig | AudioConfig[];
  
  /** Subtitle configuration */
  subtitles?: SubtitleConfig;
  
  /** Metadata to add */
  metadata?: Record<string, string>;
  
  /** Custom FFmpeg options */
  customOptions?: Record<string, string | number | boolean>;
  
  /** Overwrite existing file */
  overwrite?: boolean;
  
  /** Move moov atom to beginning (for streaming) */
  fastStart?: boolean;
  
  /** Segment configuration for HLS/DASH */
  segments?: SegmentConfig;
}

/**
 * Subtitle configuration
 */
export interface SubtitleConfig {
  /** Subtitle codec */
  codec: 'mov_text' | 'srt' | 'webvtt' | 'ass';
  
  /** Language code */
  language?: string;
  
  /** Subtitle file path (for burn-in) */
  file?: string;
  
  /** Burn subtitles into video */
  burnIn?: boolean;
  
  /** Subtitle style (for ASS) */
  style?: string;
}

/**
 * Segment configuration for streaming
 */
export interface SegmentConfig {
  /** Segment duration in seconds */
  duration: number;
  
  /** Output playlist file */
  playlist: string;
  
  /** Number of segments to keep */
  keepSegments?: number;
  
  /** Segment file naming pattern */
  namingPattern?: string;
  
  /** HLS-specific options */
  hls?: HLSConfig;
  
  /** DASH-specific options */
  dash?: DASHConfig;
}

/**
 * HLS configuration
 */
export interface HLSConfig {
  /** HLS version */
  version?: number;
  
  /** Allow caching */
  allowCache?: boolean;
  
  /** Playlist type */
  playlistType?: 'event' | 'vod';
  
  /** Master playlist name */
  masterPlaylist?: string;
  
  /** Variant stream configurations */
  variants?: HLSVariant[];
}

/**
 * HLS variant stream configuration
 */
export interface HLSVariant {
  /** Variant name */
  name: string;
  
  /** Bandwidth in bits per second */
  bandwidth: number;
  
  /** Resolution */
  resolution?: string;
  
  /** Video configuration override */
  video?: Partial<VideoConfig>;
  
  /** Audio configuration override */
  audio?: Partial<AudioConfig>;
}

/**
 * DASH configuration
 */
export interface DASHConfig {
  /** DASH profile */
  profile?: string;
  
  /** Minimum buffer time in seconds */
  minBufferTime?: number;
  
  /** Availability start time offset */
  availabilityStartTimeOffset?: number;
  
  /** Segment template */
  segmentTemplate?: string;
}

// ============================================================================
// HARDWARE ACCELERATION
// ============================================================================

/**
 * Hardware device information
 */
export interface HardwareDevice {
  /** Device type */
  type: HardwareAcceleration;
  
  /** Device index (for multi-GPU) */
  index: number;
  
  /** Device name */
  name: string;
  
  /** Available encoders */
  encoders: VideoCodec[];
  
  /** Available decoders */
  decoders: VideoCodec[];
  
  /** Memory information */
  memory?: {
    total: number;
    used: number;
    free: number;
  };
  
  /** Device capabilities */
  capabilities: HardwareCapabilities;
}

/**
 * Hardware capabilities
 */
export interface HardwareCapabilities {
  /** Maximum supported resolution */
  maxResolution: {
    width: number;
    height: number;
  };
  
  /** Maximum supported frame rate */
  maxFramerate: number;
  
  /** Supported pixel formats */
  pixelFormats: string[];
  
  /** Supported codecs */
  codecs: VideoCodec[];
  
  /** HDR support */
  hdrSupport: boolean;
  
  /** B-frame support */
  bFrameSupport: boolean;
  
  /** Maximum B-frame count */
  maxBFrames: number;
  
  /** 10-bit encoding support */
  tenBitSupport: boolean;
  
  /** Rate control modes */
  rateControlModes: RateControlMode[];
}

/**
 * Hardware acceleration configuration
 */
export interface HardwareAccelConfig {
  /** Hardware acceleration method */
  type: HardwareAcceleration;
  
  /** Device index */
  deviceIndex?: number;
  
  /** Use hardware decoding */
  hwDecode?: boolean;
  
  /** Use hardware encoding */
  hwEncode?: boolean;
  
  /** Scale filter for hardware */
  scaleFilter?: string;
  
  /** Output format for hardware */
  outputFormat?: string;
}

// ============================================================================
// FILTER CONFIGURATION
// ============================================================================

/**
 * Video filter configuration
 */
export interface VideoFilter {
  /** Filter name */
  name: string;
  
  /** Filter options */
  options?: Record<string, string | number | boolean>;
  
  /** Filter chain position */
  position?: number;
  
  /** Input label */
  inputLabel?: string;
  
  /** Output label */
  outputLabel?: string;
}

/**
 * Common video filter presets
 */
export interface FilterPreset {
  /** Preset name */
  name: string;
  
  /** Filter chain */
  filters: VideoFilter[];
  
  /** Description */
  description?: string;
}

// ============================================================================
// PROGRESS AND EVENTS
// ============================================================================

/**
 * Transcoding progress information
 */
export interface TranscodeProgress {
  /** Current frame number */
  frame: number;
  
  /** Current FPS */
  fps: number;
  
  /** Current quality */
  quality: number;
  
  /** Current size in bytes */
  size: number;
  
  /** Current time in seconds */
  time: number;
  
  /** Current bitrate */
  bitrate: number;
  
  /** Speed multiplier */
  speed: number;
  
  /** Progress percentage (0-100) */
  progress: number;
  
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}

/**
 * Transcoding event types
 */
export type TranscodeEventType =
  | 'start'
  | 'progress'
  | 'error'
  | 'end'
  | 'codec-data'
  | 'stderr';

/**
 * Transcoding event handler
 */
export type TranscodeEventHandler = (
  event: TranscodeEventType,
  data: TranscodeProgress | Error | Record<string, unknown>
) => void;

// ============================================================================
// INPUT CONFIGURATION
// ============================================================================

/**
 * Input file configuration
 */
export interface InputConfig {
  /** Input file path or URL */
  path: string;
  
  /** Input format hint */
  format?: string;
  
  /** Start time offset in seconds */
  startTime?: number;
  
  /** Duration in seconds */
  duration?: number;
  
  /** Input options */
  options?: Record<string, string | number | boolean>;
  
  /** Hardware decoding configuration */
  hwAccel?: HardwareAccelConfig;
  
  /** Stream selection */
  streams?: StreamSelection[];
}

/**
 * Stream selection configuration
 */
export interface StreamSelection {
  /** Stream type */
  type: 'video' | 'audio' | 'subtitle' | 'data';
  
  /** Stream index */
  index?: number;
  
  /** Stream language */
  language?: string;
  
  /** Custom mapping */
  map?: string;
}

// ============================================================================
// PRESET CONFIGURATION
// ============================================================================

/**
 * Encoding preset configuration
 */
export interface EncodingPreset {
  /** Preset name */
  name: string;
  
  /** Preset description */
  description: string;
  
  /** Video configuration */
  video: VideoConfig;
  
  /** Audio configuration */
  audio: AudioConfig;
  
  /** Output format */
  format: ContainerFormat;
  
  /** Tags for categorization */
  tags?: string[];
}

/**
 * Built-in preset categories
 */
export type PresetCategory =
  | 'streaming'
  | 'archive'
  | 'web'
  | 'mobile'
  | 'broadcast'
  | 'gaming'
  | 'surveillance';

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * FFmpeg error types
 */
export enum FFmpegErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_OUTPUT = 'INVALID_OUTPUT',
  CODEC_NOT_FOUND = 'CODEC_NOT_FOUND',
  HARDWARE_NOT_AVAILABLE = 'HARDWARE_NOT_AVAILABLE',
  ENCODING_FAILED = 'ENCODING_FAILED',
  DECODING_FAILED = 'DECODING_FAILED',
  FILTER_ERROR = 'FILTER_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  OUT_OF_MEMORY = 'OUT_OF_MEMORY',
  TIMEOUT = 'TIMEOUT',
  PROCESS_KILLED = 'PROCESS_KILLED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
}

/**
 * FFmpeg error class
 */
export class FFmpegError extends Error {
  constructor(
    message: string,
    public code: FFmpegErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'FFmpegError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Media information
 */
export interface MediaInfo {
  /** File path */
  path: string;
  
  /** Container format */
  format: string;
  
  /** Duration in seconds */
  duration: number;
  
  /** File size in bytes */
  size: number;
  
  /** Overall bitrate */
  bitrate: number;
  
  /** Video streams */
  videoStreams: VideoStreamInfo[];
  
  /** Audio streams */
  audioStreams: AudioStreamInfo[];
  
  /** Subtitle streams */
  subtitleStreams: SubtitleStreamInfo[];

  /** Metadata */
  metadata: Record<string, string | number>;
  
  /** Chapters */
  chapters?: ChapterInfo[];
}

/**
 * Video stream information
 */
export interface VideoStreamInfo {
  /** Stream index */
  index: number;

  /** Codec name */
  codec: string;

  /** Profile */
  profile?: string | number;
  
  /** Level */
  level?: string | number;
  
  /** Width in pixels */
  width: number;
  
  /** Height in pixels */
  height: number;
  
  /** Frame rate */
  framerate: number;
  
  /** Aspect ratio */
  aspectRatio: string;
  
  /** Pixel format */
  pixelFormat: string;
  
  /** Bitrate */
  bitrate?: number;
  
  /** Number of frames */
  frameCount?: number;
  
  /** HDR information */
  hdr?: {
    type: string;
    colorSpace: string;
  };
}

/**
 * Audio stream information
 */
export interface AudioStreamInfo {
  /** Stream index */
  index: number;

  /** Codec name */
  codec: string;

  /** Profile */
  profile?: string | number;
  
  /** Sample rate */
  sampleRate: number;
  
  /** Number of channels */
  channels: number;
  
  /** Channel layout */
  channelLayout: string;
  
  /** Bitrate */
  bitrate?: number;
  
  /** Language */
  language?: string;
  
  /** Duration */
  duration?: number;
}

/**
 * Subtitle stream information
 */
export interface SubtitleStreamInfo {
  /** Stream index */
  index: number;
  
  /** Codec name */
  codec: string;
  
  /** Language */
  language?: string;
  
  /** Number of frames */
  frameCount?: number;
}

/**
 * Chapter information
 */
export interface ChapterInfo {
  /** Chapter index */
  index: number;
  
  /** Start time in seconds */
  startTime: number;
  
  /** End time in seconds */
  endTime: number;
  
  /** Chapter title */
  title?: string;
}

/**
 * Thumbnail extraction options
 */
export interface ThumbnailOptions {
  /** Output file pattern */
  output: string;
  
  /** Number of thumbnails */
  count?: number;
  
  /** Interval in seconds */
  interval?: number;
  
  /** Specific timestamps */
  timestamps?: number[];
  
  /** Width */
  width?: number;
  
  /** Height */
  height?: number;
  
  /** Quality (1-31, lower is better) */
  quality?: number;
  
  /** Format */
  format?: 'jpg' | 'png' | 'webp';
}

/**
 * Watermark configuration
 */
export interface WatermarkConfig {
  /** Watermark image path */
  image: string;
  
  /** Position */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  
  /** Horizontal offset in pixels */
  offsetX?: number;
  
  /** Vertical offset in pixels */
  offsetY?: number;
  
  /** Opacity (0-1) */
  opacity?: number;
  
  /** Scale factor */
  scale?: number;
}