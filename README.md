# AI Media Editor

AI-powered media editor desktop application built with Electron and React.

## Features

- Desktop application for video and image editing
- Drag & drop file upload support
- Timeline UI for media organization
- Preview panel for media playback
- Cross-platform support (Windows, macOS, Linux)

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
│   ├── main/              # Electron main process
│   │   ├── main.js        # Main entry point
│   │   └── preload.js     # Preload script for IPC
│   └── renderer/          # React frontend
│       ├── components/    # React components
│       │   ├── DragDropZone.js
│       │   ├── Preview.js
│       │   └── Timeline.js
│       ├── App.js         # Main App component
│       ├── index.js       # React entry point
│       └── styles.css     # Application styles
├── public/
│   └── index.html         # HTML template
├── dist/                  # Webpack build output
├── release/               # Electron Builder output
├── webpack.config.js      # Webpack configuration
└── package.json           # Project configuration
```

## Supported File Formats

### Video
- MP4, WebM, MKV, AVI, MOV

### Images
- JPG, JPEG, PNG, GIF, BMP

## License

MIT