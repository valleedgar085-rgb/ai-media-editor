# AI Media Editor

AI-powered media editor desktop application built with Electron and React.

## Features

- Desktop application for video and image editing
- Drag & drop file upload support
- Timeline UI for media organization
- Preview panel for media playback
- Cross-platform support (Windows, macOS, Linux)

### Phase 2 Features (NEW)

- **Enhanced Timeline Editor**
  - Drag-and-drop reordering of media items using react-dnd
  - Zoom controls (fit, zoom in, zoom out) for timeline navigation
  - Playhead with current time display
  - Multiple track support (Video/Image track and Audio track)
  - Real-time thumbnail generation for uploaded media

- **WebGL Preview Player**
  - GPU-accelerated rendering using WebGL shaders
  - Basic playback controls (play, pause, seek, frame-step)
  - Variable playback rate (0.25x to 4x speed)
  - Real-time filter controls (Brightness, Contrast, Saturation)

- **Audio Support**
  - Dedicated audio track lane
  - Audio file upload (MP3, WAV, OGG, AAC, M4A)
  - Synchronized audio playback with video timeline

- **Performance Optimizations**
  - Lazy loading of media thumbnails
  - requestAnimationFrame-based playback loop
  - Efficient WebGL texture updates

## Prerequisites

- Node.js 18+ 
- npm 8+

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Build and run the desktop app:

```bash
npm start
```

Or build the renderer separately and then run Electron:

```bash
npm run build:dev
npm run electron
```

### Running Tests

```bash
npm test
```

## Building for Distribution

### Package (unpacked)

```bash
npm run pack
```

### Create Installer

```bash
# All platforms
npm run dist

# Windows
npm run dist:win

# macOS
npm run dist:mac

# Linux
npm run dist:linux
```

## Project Structure

```
ai-media-editor/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.js              # Main entry point
│   │   └── preload.js           # Preload script for IPC
│   └── renderer/                # React frontend
│       ├── components/          # React components
│       │   ├── DragDropZone.js  # File upload zone
│       │   ├── Timeline/        # Timeline components (Phase 2)
│       │   │   ├── TimelineEditor.js
│       │   │   ├── Track.js
│       │   │   ├── TrackItem.js
│       │   │   ├── TimelineRuler.js
│       │   │   └── ZoomControls.js
│       │   └── Preview/         # Preview components (Phase 2)
│       │       ├── PreviewPlayer.js
│       │       ├── PlaybackControls.js
│       │       ├── FilterControls.js
│       │       └── webglRenderer.js
│       ├── store/               # State management (Phase 2)
│       │   ├── mediaStore.js
│       │   └── thumbnailGenerator.js
│       ├── App.js               # Main App component
│       ├── index.js             # React entry point
│       └── styles.css           # Application styles
├── tests/                       # Unit tests (Phase 2)
│   ├── setupTests.js
│   └── Timeline.test.js
├── public/
│   └── index.html               # HTML template
├── dist/                        # Webpack build output
├── release/                     # Electron Builder output
├── webpack.config.js            # Webpack configuration
├── jest.config.js               # Jest test configuration
└── package.json                 # Project configuration
```

## Phase 2 Usage Guide

### Timeline Editor

1. **Add Media**: Drag and drop files onto the upload zone or click "Browse Files"
2. **Reorder Items**: Drag items within a track to reorder them
3. **Zoom Timeline**: Use the zoom controls (+/-) to zoom in/out, or click ⬚ to fit all content
4. **Seek**: Click on the timeline ruler to move the playhead

### Preview Player

1. **Playback**: Click play/pause or use the seek slider
2. **Frame Step**: Use ⏮/⏭ buttons to step through frames
3. **Speed**: Select playback rate from the dropdown (0.25x to 4x)

### Filters

Adjust real-time filters in the preview:
- **Brightness**: 0-200% (100% is normal)
- **Contrast**: 0-200% (100% is normal)  
- **Saturation**: 0-200% (100% is normal)

Click "Reset" to restore default values.

## Supported File Formats

### Video
- MP4, WebM, MKV, AVI, MOV

### Images
- JPG, JPEG, PNG, GIF, BMP

### Audio (Phase 2)
- MP3, WAV, OGG, AAC, M4A

## Roadmap

- **Phase 1** ✅: Basic Electron/React setup, file upload, simple preview
- **Phase 2** ✅: Timeline editor, WebGL preview, filters, audio support
- **Phase 3** (Upcoming): AI integrations, FFmpeg export, advanced effects

## License

MIT