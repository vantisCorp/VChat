# @vcomm/ffmpeg

FFmpeg integration package for V-COMM with hardware acceleration, AV1 encoding, and transcoding utilities.

## Features

- 🚀 **Hardware Acceleration** - Support for NVIDIA (NVENC), AMD (AMF), Intel (QSV), VAAPI, and VideoToolbox
- 🎬 **AV1 Encoding** - Built-in support for SVT-AV1 and libaom-av1 codecs
- 📦 **Easy Transcoding** - Simple API for video/audio transcoding
- 🖼️ **Thumbnail Extraction** - Extract thumbnails at intervals or specific timestamps
- 💧 **Watermarking** - Add image watermarks with position and opacity control
- 📊 **Media Probing** - Get detailed information about media files
- 🎛️ **Preset System** - Built-in presets for streaming, web, mobile, archive, and broadcast

## Installation

```bash
npm install @vcomm/ffmpeg
```

### Prerequisites

FFmpeg must be installed on your system:

```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Windows (using Chocolatey)
choco install ffmpeg
```

## Quick Start

```typescript
import { ffmpeg } from '@vcomm/ffmpeg';

// Initialize
await ffmpeg.initialize();

// Get hardware devices
const devices = ffmpeg.getHardwareDevices();
console.log('Available hardware:', devices);

// Transcode video
await ffmpeg.transcode('input.mp4', {
  path: 'output.mp4',
  format: 'mp4',
  video: {
    codec: 'libx264',
    width: 1920,
    height: 1080,
    preset: 'medium',
    quality: 23,
  },
  audio: {
    codec: 'aac',
    bitrate: 128000,
  },
});

// Get media info
const info = await ffmpeg.getMediaInfo('video.mp4');
console.log('Duration:', info.duration, 'seconds');
```

## Hardware Acceleration

### Check Hardware Availability

```typescript
import { ffmpeg, HardwareAcceleration } from '@vcomm/ffmpeg';

// Check if NVENC is available
if (ffmpeg.isHardwareAvailable('nvenc')) {
  console.log('NVIDIA hardware encoding available!');
}

// Get best available device
const bestDevice = ffmpeg.getBestHardwareDevice();
console.log('Best device:', bestDevice?.name);
```

### Use Hardware Encoding

```typescript
// Set preferred hardware
ffmpeg.setHardwareAcceleration('nvenc');

// Encode with hardware acceleration
await ffmpeg.encodeH264('input.mp4', 'output.mp4', {
  codec: 'h264_nvenc',  // Use NVIDIA encoder
  preset: 'fast',
  quality: 23,
});
```

### Supported Hardware

| Type | Encoders | Platform |
|------|----------|----------|
| NVIDIA NVENC | h264_nvenc, hevc_nvenc, av1_nvenc | Windows, Linux |
| AMD AMF | h264_amf, hevc_amf | Windows |
| Intel QSV | h264_qsv, hevc_qsv, av1_qsv | Windows, Linux |
| VAAPI | h264_vaapi, hevc_vaapi, av1_vaapi | Linux |
| VideoToolbox | h264_videotoolbox, hevc_videotoolbox | macOS |

## AV1 Encoding

```typescript
import { ffmpeg } from '@vcomm/ffmpeg';

// Encode with AV1 (SVT-AV1)
await ffmpeg.encodeAV1('input.mp4', 'output.mp4', {
  quality: 35,        // CRF value (0-63, lower = better quality)
  preset: 'medium',
  pixelFormat: 'yuv420p10le',  // 10-bit for HDR
});

// AV1 for web
await ffmpeg.encodeForWeb('input.mp4', 'output.webm');
```

## Encoding Presets

### Streaming

```typescript
// Encode for streaming with HLS support
await ffmpeg.encodeForStreaming('input.mp4', 'output.mp4', '1080p');
```

### Web

```typescript
// Encode for web (WebM with AV1/VP9)
await ffmpeg.encodeForWeb('input.mp4', 'output.webm');
```

### Mobile

```typescript
// Encode for mobile devices
await ffmpeg.encodeForMobile('input.mp4', 'output.mp4', '720p');
```

### Archive

```typescript
// High-quality encoding for archival
await ffmpeg.encodeForArchive('input.mp4', 'output.mkv', 'av1');
```

## Video Operations

### Transcoding

```typescript
import { VideoConfig, AudioConfig } from '@vcomm/ffmpeg';

const videoConfig: Partial<VideoConfig> = {
  codec: 'libx264',
  width: 1920,
  height: 1080,
  framerate: 30,
  bitrate: 5000000,  // 5 Mbps
  preset: 'medium',
  profile: 'high',
  pixelFormat: 'yuv420p',
};

const audioConfig: Partial<AudioConfig> = {
  codec: 'aac',
  bitrate: 192000,
  sampleRate: 48000,
  channels: 2,
};

await ffmpeg.transcode('input.mp4', {
  path: 'output.mp4',
  format: 'mp4',
  video: videoConfig,
  audio: audioConfig,
  fastStart: true,  // Enable streaming
});
```

### Resize Video

```typescript
await ffmpeg.resize('input.mp4', 'output.mp4', 1280, 720);
```

### Trim Video

```typescript
// Trim from 10s to 30s
await ffmpeg.trim('input.mp4', 'output.mp4', 10, 30);
```

### Add Watermark

```typescript
await ffmpeg.addWatermark('video.mp4', 'logo.png', 'output.mp4', {
  position: 'bottom-right',
  opacity: 0.8,
  scale: 0.5,
});
```

### Extract Thumbnails

```typescript
// Extract 10 evenly-spaced thumbnails
const thumbnails = await ffmpeg.extractThumbnails('video.mp4', './thumbs', {
  count: 10,
  width: 320,
  height: 180,
});

// Extract at 5-second intervals
const intervalThumbs = await ffmpeg.extractThumbnails('video.mp4', './thumbs', {
  interval: 5,
});
```

### Extract Audio

```typescript
// Extract audio as AAC
await ffmpeg.extractAudio('video.mp4', 'audio.aac', {
  codec: 'aac',
  bitrate: 192000,
});

// Extract as FLAC (lossless)
await ffmpeg.extractAudio('video.mp4', 'audio.flac', {
  codec: 'flac',
});
```

## Media Information

```typescript
const info = await ffmpeg.getMediaInfo('video.mp4');

console.log('Duration:', info.duration, 'seconds');
console.log('Size:', info.size, 'bytes');
console.log('Bitrate:', info.bitrate, 'bps');

// Video streams
for (const video of info.videoStreams) {
  console.log(`Video: ${video.width}x${video.height} @ ${video.framerate} fps`);
  console.log(`Codec: ${video.codec}, Profile: ${video.profile}`);
}

// Audio streams
for (const audio of info.audioStreams) {
  console.log(`Audio: ${audio.sampleRate} Hz, ${audio.channels} channels`);
  console.log(`Codec: ${audio.codec}, Bitrate: ${audio.bitrate} bps`);
}
```

## Progress Tracking

```typescript
await ffmpeg.transcode('input.mp4', {
  path: 'output.mp4',
  format: 'mp4',
  video: { codec: 'libx264' },
}, (event, data) => {
  if (event === 'progress') {
    console.log(`Progress: ${data.progress}%`);
    console.log(`Frame: ${data.frame}, FPS: ${data.fps}`);
    console.log(`Speed: ${data.speed}x`);
  }
});
```

## HDR Support

```typescript
await ffmpeg.transcode('input.mp4', {
  path: 'output.mp4',
  format: 'mp4',
  video: {
    codec: 'libx265',
    quality: 20,
    pixelFormat: 'yuv420p10le',
    hdr: {
      mode: 'hdr10',
      colorPrimaries: 9,
      transferCharacteristics: 16,
      matrixCoefficients: 9,
      masteringDisplay: 'G(13250,34500)B(7500,3000)R(34000,16000)WP(15635,16450)L(10000000,1)',
      contentLight: { max: 1000, avg: 200 },
    },
  },
});
```

## API Reference

### FFmpeg Class

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize FFmpeg and detect hardware |
| `getVersion()` | Get FFmpeg version string |
| `getEncoders()` | Get list of available encoders |
| `getDecoders()` | Get list of available decoders |
| `getHardwareDevices()` | Get available hardware devices |
| `transcode(input, output, onProgress?)` | Transcode video file |
| `encodeH264(input, output, options?)` | Encode with H.264 |
| `encodeHEVC(input, output, options?)` | Encode with H.265/HEVC |
| `encodeAV1(input, output, options?)` | Encode with AV1 |
| `encodeForStreaming(input, output, quality)` | Encode for streaming |
| `encodeForWeb(input, output)` | Encode for web |
| `encodeForMobile(input, output, quality)` | Encode for mobile |
| `encodeForArchive(input, output, codec)` | Encode for archive |
| `addWatermark(input, watermark, output, options?)` | Add watermark |
| `extractThumbnails(input, outputDir, options?)` | Extract thumbnails |
| `getMediaInfo(input)` | Get media information |
| `extractAudio(input, output, options?)` | Extract audio track |
| `trim(input, output, startTime, endTime)` | Trim video |
| `convert(input, output, format)` | Convert format |
| `resize(input, output, width, height?)` | Resize video |

## License

MIT