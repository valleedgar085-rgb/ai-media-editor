# Example Projects

This directory contains example project files demonstrating the features of AI Media Editor.

## demo-project.json

A sample project demonstrating:
- Multiple video clips on the video track
- Audio clips with background music and voiceover
- Volume keyframes for dynamic audio levels
- Fade in/out effects on audio clips
- Crossfade and fade-to-black transitions between video clips

### How to Use

1. Open AI Media Editor
2. Use File > Open Project (Ctrl/Cmd + O)
3. Navigate to this directory and select `demo-project.json`
4. The project will load with all tracks, clips, and settings

### Project Structure

The project consists of:
- **Video Track**: 3 video clips (intro, main content, outro)
- **Audio Track**: Background music with volume automation + voiceover

### Transitions

The project includes two transitions:
1. **Crossfade** (1 second): Between intro and main content
2. **Fade to Black** (1.5 seconds): Between main content and outro

### Audio Automation

The background music includes volume keyframes:
- Starts at 30% volume
- Ramps up to 70% at the 5-second mark
- Stays at 70% until the 20-second mark
- Fades down to 10% by the end

## Creating Your Own Projects

Projects are saved as JSON files with the following structure:

```json
{
  "version": "1.0.0",
  "name": "Project Name",
  "settings": { ... },
  "tracks": [ ... ],
  "transitions": [ ... ],
  "filters": { ... }
}
```

See `demo-project.json` for a complete example of the project format.
