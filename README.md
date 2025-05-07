# Video React Syncer

A React web application that allows users to record and synchronize video pause patterns across multiple viewing sessions.

## Features

- **Pause Recording**: Record every time you pause and resume a video, capturing the timestamp and duration of each pause.
- **Synced Playback**: Upload a previously recorded pause map to replay a video with the same pause/resume patterns.
- **Easy Import/Export**: Download your pause map as a JSON file, and upload or paste it for future sessions.
- **Toggle Recording**: Turn recording mode on and off as needed.
- **User-Friendly Interface**: Simple controls for loading videos, controlling modes, and managing pause maps.

## How to Use

### Recording Pause Patterns

1. Load a video either by URL or by uploading a file from your device.
2. Click "Start Recording Pauses" to begin recording your pause patterns.
3. Play the video and pause whenever needed; the app will automatically record each pause event.
4. When finished, click "Stop Recording" to end the recording session.
5. Download the pause map as a JSON file by clicking "Download Pause Map".

### Replaying with Synced Pauses

1. Load the same video you used when recording the pause map.
2. Upload a pause map file using the "Upload Pause Map" button, or paste a JSON pause map directly.
3. Click "Start Sync Playback" to begin playing the video with synchronized pauses.
4. The video will automatically pause at the recorded timestamps for the exact durations in the pause map.

## Technical Details

### Pause Map Format

The pause map is stored as a JSON array of pause events, each with the following structure:

```json
[
  {
    "timestamp": 12.5,  // Video timestamp when the pause occurred (in seconds)
    "duration": 3.2     // How long the pause lasted (in seconds)
  },
  // More pause events...
]
```

## Development

This project was built with React and TypeScript.

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

### Building for Production

To build the app for production:

```
npm run build
```

This will create an optimized production build in the `build` folder.

## License

MIT
