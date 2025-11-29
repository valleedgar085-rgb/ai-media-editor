# AI Media Editor

AI-powered media editor desktop application built with Electron and React.

## Features

### Phase 1 (Foundation)
- Desktop application for video and image editing
- Drag & drop file upload support
- Timeline UI for media organization
- Preview panel for media playback
- Cross-platform support (Windows, macOS, Linux)

### Phase 2 (Timeline & Preview)
- **Enhanced Timeline Editor**
  - Horizontally scrollable tracks with thumbnails
  - Drag-and-drop reordering within and between tracks (react-dnd)
  - Zoom controls (fit, zoom in, zoom out) with configurable time-to-pixel ratio
  - Playhead with current time display
  - Video and Audio track lanes
  
- **Media Upload & Thumbnails**
  - Automatic thumbnail generation for images and videos
  - Thumbnails displayed on timeline items
  - Lazy loading for performance with many items
  
- **Preview Player with WebGL Rendering**
  - GPU-accelerated Canvas + WebGL rendering
  - Playback controls: play, pause, seek, frame-step, playback rate
  - Target 1080p at 30-60fps (hardware dependent)
  - Real-time filter preview
  
- **Filter Controls**
  - Brightness adjustment (-100 to +100)
  - Contrast adjustment (-100 to +100)
  - Saturation adjustment (-100 to +100)
  - Filter presets (Vivid, Dramatic, B&W, Vintage)
  
- **Audio Track Support**
  - Dedicated audio track lane
  - Audio sync with preview playhead
  
- **Performance Optimizations**
  - Lazy loading thumbnails and frames
  - requestAnimationFrame-based playback loop
  - Efficient state management with Zustand

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| Left Arrow | Step backward one frame |
| Right Arrow | Step forward one frame |
| Shift+Left | Go to start |
| Shift+Right | Go to end |
| + / = | Zoom in |
| - / _ | Zoom out |
| Delete/Backspace | Remove selected item |

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

# Watch mode
npm run test:watch
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
│       │   ├── DragDropZone.js  # File upload component
│       │   ├── Preview/         # Preview player components (Phase 2)
│       │   │   ├── PreviewPlayer.js
│       │   │   ├── PlaybackControls.js
│       │   │   └── FilterControls.js
│       │   └── Timeline/        # Timeline components (Phase 2)
│       │       ├── TimelinePanel.js
│       │       ├── TimelineTrack.js
│       │       └── TimelineItem.js
│       ├── store/               # State management (Phase 2)
│       │   └── useEditorStore.js
│       ├── utils/               # Utility functions (Phase 2)
│       │   ├── thumbnailUtils.js
│       │   └── WebGLRenderer.js
│       ├── App.js               # Main App component
│       ├── index.js             # React entry point
│       └── styles.css           # Application styles
├── tests/                       # Unit tests (Phase 2)
│   └── timeline.test.js
├── public/
│   └── index.html               # HTML template
├── dist/                        # Webpack build output
├── release/                     # Electron Builder output
├── webpack.config.js            # Webpack configuration
├── jest.config.js               # Jest configuration
└── package.json                 # Project configuration
```

## Supported File Formats

### Video
- MP4, WebM, MKV, AVI, MOV

### Images
- JPG, JPEG, PNG, GIF, BMP, WebP

### Audio (Phase 2)
- MP3, WAV, OGG, AAC, M4A, FLAC

## Technology Stack

- **Electron** - Desktop application framework
- **React** - UI framework
- **Zustand** - State management
- **react-dnd** - Drag and drop functionality
- **WebGL** - GPU-accelerated rendering
- **Jest** - Testing framework

## Phase 3 (Coming Soon)

- Backend AI integrations
- Advanced video editing features
- Export and rendering pipeline

## License

MIT