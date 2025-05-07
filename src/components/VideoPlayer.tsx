import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactPlayer from 'react-player';

// Define the pause event interface
export interface PauseEvent {
  timestamp: number;  // Video timestamp when pause occurred (in seconds)
  duration: number;   // How long the pause lasted (in seconds)
}

interface VideoPlayerProps {
  src: string;
  isRecording: boolean;
  isSyncMode: boolean;
  pauseMap: PauseEvent[];
  onPauseEvent: (event: PauseEvent) => void;
}

/**
 * VideoPlayer Component using ReactPlayer
 * 
 * This component handles video playback with two main features:
 * 1. Recording mode: Captures pause events (timestamp and duration) as the user watches and pauses/resumes
 * 2. Sync mode: Replays a video and automatically pauses at timestamps specified in the pauseMap
 */
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  isRecording,
  isSyncMode,
  pauseMap,
  onPauseEvent
}) => {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pauseStart, setPauseStart] = useState<number | null>(null);
  const [syncPauseRemaining, setSyncPauseRemaining] = useState<number | null>(null);
  const [syncPauseTimerId, setSyncPauseTimerId] = useState<NodeJS.Timeout | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  
  // Used to store the real time when pause occurred
  const pauseTimeRef = useRef<number | null>(null);
  // Flag to track if we're in the middle of a sync pause
  const syncPausingRef = useRef<boolean>(false);
  // Store processed timestamps to prevent double-pausing
  const processedTimestampsRef = useRef<number[]>([]);
  // Last time we checked for pause points
  const lastProgressCheckRef = useRef<number>(0);
  
  // Toggle demo mode with keyboard shortcut (Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.ctrlKey) {
        setDemoMode(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handler for video play event (user or programmatic)
  const handlePlay = useCallback(() => {
    setPlaying(true);
    
    // If we were recording a pause event, complete it now
    if (isRecording && !isSyncMode && pauseStart !== null && pauseTimeRef.current !== null) {
      const pauseDuration = (Date.now() - pauseTimeRef.current) / 1000;
      
      // Send pause event to parent
      onPauseEvent({
        timestamp: pauseStart,
        duration: pauseDuration
      });
      
      // Reset pause tracking
      setPauseStart(null);
      pauseTimeRef.current = null;
    }
  }, [isRecording, isSyncMode, pauseStart, onPauseEvent]);

  // Handler for video pause event (user or programmatic)
  const handlePause = useCallback(() => {
    setPlaying(false);
    
    // Only record pause events if in recording mode, not sync mode, and not syncing
    if (isRecording && !isSyncMode && !syncPausingRef.current && playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      
      // Start tracking this pause
      setPauseStart(currentTime);
      pauseTimeRef.current = Date.now();
    }
  }, [isRecording, isSyncMode]);

  // Check if we should pause at this timestamp based on pauseMap
  const shouldPauseAtTimestamp = useCallback((currentTime: number, pauseMap: PauseEvent[]) => {
    // Don't check too frequently
    const now = Date.now();
    if (now - lastProgressCheckRef.current < 50) {
      return null;
    }
    lastProgressCheckRef.current = now;
    
    // Find a pause point we haven't processed yet
    for (const pauseEvent of pauseMap) {
      // Calculate how close we are to the target time
      const distance = Math.abs(pauseEvent.timestamp - currentTime);
      
      // Check if we're close enough and haven't processed this timestamp yet
      if (distance < 0.2 && currentTime >= pauseEvent.timestamp && 
          !processedTimestampsRef.current.includes(Math.round(pauseEvent.timestamp * 10))) {
        
        // Mark this timestamp as processed
        const timeKey = Math.round(pauseEvent.timestamp * 10);
        processedTimestampsRef.current.push(timeKey);
        
        // Return the pause event to trigger a pause
        return pauseEvent;
      }
    }
    
    return null;
  }, []);

  // Handle progress updates from ReactPlayer
  const handleProgress = useCallback(({ playedSeconds }: { playedSeconds: number }) => {
    setPlayed(playedSeconds);
    
    // Check for sync pause points if in sync mode
    if (isSyncMode && playing && pauseMap.length > 0 && !syncPausingRef.current) {
      const pauseEvent = shouldPauseAtTimestamp(playedSeconds, pauseMap);
      
      if (pauseEvent) {
        syncPausingRef.current = true;
        
        // Pause the video
        setPlaying(false);
        
        // Calculate effective pause duration
        const originalDuration = pauseEvent.duration;
        const effectiveDuration = demoMode ? 
          Math.max(originalDuration, 2.0) : 
          Math.max(originalDuration, 0.3);
        
        // Set up countdown display
        setSyncPauseRemaining(effectiveDuration);
        
        // Start countdown timer
        const countdownId = setInterval(() => {
          setSyncPauseRemaining(prev => {
            if (prev === null || prev <= 0.1) {
              clearInterval(countdownId);
              return null;
            }
            return parseFloat((prev - 0.1).toFixed(1));
          });
        }, 100);
        
        setSyncPauseTimerId(countdownId);
        
        // Schedule resume after specified duration
        setTimeout(() => {
          // Clear countdown UI
          setSyncPauseRemaining(null);
          if (syncPauseTimerId) {
            clearInterval(syncPauseTimerId);
            setSyncPauseTimerId(null);
          }
          
          // Resume playback
          setPlaying(true);
          syncPausingRef.current = false;
        }, effectiveDuration * 1000);
      }
    }
  }, [isSyncMode, playing, pauseMap, demoMode, syncPauseTimerId, shouldPauseAtTimestamp]);

  // Reset playback when entering sync mode
  useEffect(() => {
    if (isSyncMode && playerRef.current) {
      // Reset the processed timestamps array
      processedTimestampsRef.current = [];
      
      // Reset position to beginning
      playerRef.current.seekTo(0);
      setPlaying(true);
    }
  }, [isSyncMode, pauseMap]);

  // Cleanup timers when unmounting
  useEffect(() => {
    return () => {
      if (syncPauseTimerId) {
        clearInterval(syncPauseTimerId);
      }
    };
  }, [syncPauseTimerId]);

  // Update player when source changes
  useEffect(() => {
    // Reset states when source changes
    setPauseStart(null);
    pauseTimeRef.current = null;
    syncPausingRef.current = false;
    processedTimestampsRef.current = [];
  }, [src]);

  // Handle video restart
  const handleRestart = useCallback(() => {
    if (playerRef.current) {
      // Reset the processed timestamps array
      processedTimestampsRef.current = [];
      
      playerRef.current.seekTo(0);
      setPlaying(true);
    }
  }, []);

  // Handle seeking
  const handleSeek = useCallback(() => {
    // Clear processed timestamps in a region around the new position
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      
      // Remove timestamps within 5 seconds of current position
      processedTimestampsRef.current = processedTimestampsRef.current.filter(timeKey => {
        const time = timeKey / 10;
        return Math.abs(time - currentTime) > 5;
      });
    }
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="video-player">
      <div className="video-container">
        <ReactPlayer
          ref={playerRef}
          url={src}
          width="100%"
          height="auto"
          playing={playing}
          controls={true}
          onPlay={handlePlay}
          onPause={handlePause}
          onProgress={handleProgress}
          onDuration={setDuration}
          onSeek={handleSeek}
          progressInterval={200}
        />
        <button 
          className="restart-video-button"
          onClick={handleRestart}
        >
          Restart Video
        </button>
      </div>
      
      <div className="player-info">
        <div className="time-display">
          {formatTime(played)} / {formatTime(duration)}
        </div>
        {isRecording && (
          <div className="recording-mode-info">
            Click play/pause to record pause events
          </div>
        )}
      </div>
      
      <div className="status-indicators">
        {isRecording && <div className="recording-indicator">Recording Pauses</div>}
        {isSyncMode && <div className="sync-indicator">Sync Playback Mode {demoMode && "(Demo)"}</div>}
        <div className="pause-countdown" style={{ visibility: syncPauseRemaining !== null ? 'visible' : 'hidden' }}>
          {syncPauseRemaining !== null ? `Resuming in ${syncPauseRemaining.toFixed(1)}s` : 'Resuming in 0.0s'}
        </div>
        {demoMode && <div className="demo-indicator">Demo Mode (Ctrl+D to toggle)</div>}
      </div>
    </div>
  );
};

export default VideoPlayer; 