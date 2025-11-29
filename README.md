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
| Ctrl/Cmd + Z | Undo (Phase 3) |
| Ctrl/Cmd + Shift + Z | Redo (Phase 3) |
| Ctrl/Cmd + S | Save project (Phase 3) |
| Ctrl/Cmd + E | Export (Phase 3) |
| S | Split clip at playhead (Phase 3) |
| M | Mute selected audio clip (Phase 3) |

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
│       │   ├── Audio/           # Audio components (Phase 3)
│       │   │   ├── AudioControls.js
│       │   │   └── WaveformDisplay.js
│       │   ├── Export/          # Export components (Phase 3)
│       │   │   └── ExportPanel.js
│       │   ├── Keyframes/       # Keyframe editor (Phase 3)
│       │   │   └── KeyframeEditor.js
│       │   ├── Preview/         # Preview player components (Phase 2)
│       │   │   ├── PreviewPlayer.js
│       │   │   ├── PlaybackControls.js
│       │   │   └── FilterControls.js
│       │   └── Timeline/        # Timeline components (Phase 2)
│       │       ├── TimelinePanel.js
│       │       ├── TimelineTrack.js
│       │       └── TimelineItem.js
│       ├── modules/             # Core modules (Phase 3)
│       │   ├── audio/           # Audio clip model and waveform
│       │   ├── export/          # Export pipeline and job management
│       │   ├── history/         # Undo/redo manager
│       │   ├── keyframes/       # Keyframe track and interpolation
│       │   ├── project/         # Project save/load and autosave
│       │   └── transitions/     # Transition effects
│       ├── store/               # State management (Phase 2+)
│       │   └── useEditorStore.js
│       ├── utils/               # Utility functions (Phase 2)
│       │   ├── thumbnailUtils.js
│       │   └── WebGLRenderer.js
│       ├── App.js               # Main App component
│       ├── index.js             # React entry point
│       └── styles.css           # Application styles
├── tests/                       # Unit tests
│   ├── timeline.test.js         # Timeline store tests
│   ├── audio.test.js            # Audio module tests (Phase 3)
│   ├── export.test.js           # Export module tests (Phase 3)
│   ├── history.test.js          # History module tests (Phase 3)
│   ├── keyframes.test.js        # Keyframe module tests (Phase 3)
│   └── transitions.test.js      # Transition module tests (Phase 3)
├── .github/
│   └── workflows/
│       └── ci.yml               # CI/CD workflow (Phase 3)
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

## Phase 3 (Export, Audio & Advanced Timeline)

### Export Pipeline
- **Video Export**
  - Export to MP4 (H.264 baseline profile) and WebM (VP9)
  - Quality presets: Low (480p), Medium (720p), High (1080p)
  - Progress tracking with percentage and ETA
  - Configurable server-side export fallback for large projects
  - Export job queue management

### Advanced Audio Support
- **Audio Track Model**
  - Volume control with keyframe automation
  - Pan control (-1 left to +1 right)
  - Fade in/out effects with configurable duration and curve type
  - Mute and Solo per clip
  - Clip-level gain adjustment

- **Waveform Rendering**
  - WebAudio-based waveform generation
  - Canvas rendering with zoom/scroll synchronization
  - Real-time playhead indicator

- **Audio Edit Operations**
  - Trim audio clips
  - Split clips at playhead
  - Volume keyframes with easing presets

### Transitions System
- **Built-in Transitions**
  - Crossfade (blend between clips)
  - Wipe (left, right, up, down)
  - Fade to Black/White
  - Configurable duration and easing curves

### Keyframe Animation
- **Keyframe Infrastructure**
  - Property keyframes: opacity, scale, rotation, position
  - Effect keyframes: brightness, contrast, saturation
  - Easing presets: linear, ease-in, ease-out, ease-in-out, elastic, bounce
  - Visual keyframe editor panel

### Undo/Redo History
- Full undo/redo support for timeline edits
- Batch operations for grouped changes
- History stack with configurable size limit

### Project Persistence
- **Save/Load Projects**
  - JSON-based project format
  - Asset references with relative paths
  - Timeline state, keyframes, and settings preservation

- **Autosave**
  - Automatic saving every 30 seconds
  - Configurable autosave intervals
  - Revert to last saved option

### Continuous Integration
- GitHub Actions workflow for CI/CD
- Automated testing on push and PR
- Build verification for Node.js 18.x and 20.x

## License

MIT