import React, { useState, useCallback, useMemo } from 'react';
import './App.css';
import VideoPlayer, { PauseEvent } from './components/VideoPlayer';
import VideoControls from './components/VideoControls';

// Use memoization to prevent unnecessary re-renders of the VideoPlayer component
const MemoizedVideoPlayer = React.memo(VideoPlayer);

function App() {
  const [videoSrc, setVideoSrc] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSyncMode, setIsSyncMode] = useState(false);
  const [pauseMap, setPauseMap] = useState<PauseEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleVideoSourceChange = useCallback((src: string) => {
    setVideoSrc(src);
    
    // When changing video source, reset modes
    if (isRecording || isSyncMode) {
      setIsRecording(false);
      setIsSyncMode(false);
    }
    
    // Clear any errors
    setError(null);
  }, [isRecording, isSyncMode]);

  const handleToggleRecording = useCallback((recording: boolean) => {
    setIsRecording(recording);
    
    // Can't be in both modes at once
    if (recording && isSyncMode) {
      setIsSyncMode(false);
    }
    
    // Clear any errors when switching modes
    setError(null);
  }, [isSyncMode]);

  const handleToggleSyncMode = useCallback((syncMode: boolean) => {
    // Validate that we have a video source before enabling sync mode
    if (syncMode && !videoSrc) {
      setError("Please load a video before enabling sync mode");
      return;
    }
    
    // Validate that we have pause events before enabling sync mode
    if (syncMode && pauseMap.length === 0) {
      setError("No pause events to sync. Please record or upload pause events first.");
      return;
    }
    
    setIsSyncMode(syncMode);
    
    // Can't be in both modes at once
    if (syncMode && isRecording) {
      setIsRecording(false);
    }
    
    // Clear any errors when successfully switching modes
    setError(null);
  }, [isRecording, pauseMap.length, videoSrc]);

  const handlePauseEvent = useCallback((event: PauseEvent) => {
    // Validate the event has reasonable values
    if (event.timestamp < 0 || event.duration <= 0) {
      setError("Invalid pause event detected. Please try again.");
      return;
    }
    
    // Use functional state update to correctly update based on previous state
    setPauseMap(prevMap => {
      // Add the new event and re-sort to maintain order
      const updatedMap = [...prevMap, event];
      const sortedMap = updatedMap.sort((a, b) => a.timestamp - b.timestamp);
      
      return sortedMap;
    });
    
    // Clear any errors when successfully adding events
    setError(null);
  }, []);

  const handlePauseMapChange = useCallback((newPauseMap: PauseEvent[]) => {
    // Sort the pause events by timestamp to ensure proper playback sequence
    const sortedPauseMap = [...newPauseMap].sort((a, b) => a.timestamp - b.timestamp);
    setPauseMap(sortedPauseMap);
    
    // Clear any errors when successfully updating the pause map
    setError(null);
  }, []);

  const handleClearPauseMap = useCallback(() => {
    setPauseMap([]);
    
    // If in sync mode, exit it since we no longer have pause events
    if (isSyncMode) {
      setIsSyncMode(false);
    }
    
    // Clear any errors
    setError(null);
  }, [isSyncMode]);

  const resetAll = useCallback(() => {
    setIsRecording(false);
    setIsSyncMode(false);
    setPauseMap([]);
    setError(null);
  }, []);

  // Only change this key when the mode or video source changes
  // This will prevent unnecessary re-renders of the VideoPlayer component
  const playerKey = useMemo(() => {
    return `player-${isSyncMode ? 'sync' : 'normal'}-${videoSrc}`;
  }, [isSyncMode, videoSrc]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Video Pause Sync Player</h1>
        <p>Record and sync video pauses across playback sessions</p>
      </header>
      
      <div className="info-note">
        <p>
          <strong>Note:</strong> For technical reasons, very short pauses (under 0.3 seconds) will be slightly extended during playback.
          Press <kbd>Ctrl+D</kbd> to toggle demo mode, which extends pauses to 2+ seconds for better visibility.
        </p>
      </div>
      
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <main className="App-main">
        <VideoControls 
          onVideoSourceChange={handleVideoSourceChange}
          onToggleRecording={handleToggleRecording}
          onToggleSyncMode={handleToggleSyncMode}
          onPauseMapChange={handlePauseMapChange}
          onClearPauseMap={handleClearPauseMap}
          isRecording={isRecording}
          isSyncMode={isSyncMode}
          pauseMap={pauseMap}
        />
        
        {videoSrc ? (
          <MemoizedVideoPlayer 
            key={playerKey}
            src={videoSrc}
            isRecording={isRecording}
            isSyncMode={isSyncMode}
            pauseMap={pauseMap}
            onPauseEvent={handlePauseEvent}
          />
        ) : (
          <div className="video-placeholder">
            <p>No video loaded. Please enter a URL or upload a video file.</p>
            <div className="placeholder-helper">
              You can use sample videos from sources like:
              <ul>
                <li>https://sample-videos.com/</li>
                <li>https://file-examples.com/index.php/sample-video-files/</li>
                <li>https://www.pexels.com/videos/</li>
              </ul>
              Or upload a video file from your device.
            </div>
          </div>
        )}
      </main>
      
      <footer className="App-footer">
        <button className="reset-app-button" onClick={resetAll}>Reset App</button>
      </footer>
    </div>
  );
}

export default App;
