import React, { ChangeEvent, useState } from 'react';
import { PauseEvent } from './VideoPlayer';

interface VideoControlsProps {
  onVideoSourceChange: (src: string) => void;
  onToggleRecording: (isRecording: boolean) => void;
  onToggleSyncMode: (isSyncMode: boolean) => void;
  onPauseMapChange: (pauseMap: PauseEvent[]) => void;
  onClearPauseMap: () => void;
  isRecording: boolean;
  isSyncMode: boolean;
  pauseMap: PauseEvent[];
}

const VideoControls: React.FC<VideoControlsProps> = ({
  onVideoSourceChange,
  onToggleRecording,
  onToggleSyncMode,
  onPauseMapChange,
  onClearPauseMap,
  isRecording,
  isSyncMode,
  pauseMap,
}) => {
  const [videoUrl, setVideoUrl] = useState('');

  const handleVideoUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
  };

  const handleLoadVideo = () => {
    if (videoUrl) {
      onVideoSourceChange(videoUrl);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      setVideoUrl(videoUrl);
      onVideoSourceChange(videoUrl);
    }
  };

  const handleToggleRecording = () => {
    // If we are currently in sync mode, exit it first
    if (isSyncMode) {
      onToggleSyncMode(false);
    }
    
    // Toggle recording on/off
    const startingRecording = !isRecording;
    
    if (startingRecording && pauseMap.length > 0) {
      // Starting a new recording - confirm if we should clear existing pause events
      const shouldClear = window.confirm(
        "You are starting a new recording. Do you want to clear existing pause events? " +
        "Click 'OK' to clear previous events, or 'Cancel' to keep them and add new events."
      );
      
      if (shouldClear) {
        onClearPauseMap();
      }
    }
    
    // Update recording state in parent component
    onToggleRecording(startingRecording);
  };

  const handleToggleSyncMode = () => {
    if (isRecording) {
      onToggleRecording(false);
    }
    
    const newSyncMode = !isSyncMode;
    onToggleSyncMode(newSyncMode);
  };

  const handleDownloadPauseMap = () => {
    if (pauseMap.length === 0) return;

    const dataStr = JSON.stringify(pauseMap, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataUri);
    downloadAnchorNode.setAttribute('download', 'pause_map.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleUploadPauseMap = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const pauseMap = JSON.parse(event.target?.result as string) as PauseEvent[];
          onPauseMapChange(pauseMap);
        } catch (error) {
          alert('Invalid JSON file. Please upload a valid pause map.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handlePasteJson = () => {
    const jsonStr = prompt('Paste your pause map JSON:');
    if (jsonStr) {
      try {
        const pauseMap = JSON.parse(jsonStr) as PauseEvent[];
        onPauseMapChange(pauseMap);
      } catch (error) {
        alert('Invalid JSON format. Please check your input.');
      }
    }
  };

  const handleClearPauseMap = () => {
    if (pauseMap.length > 0) {
      if (window.confirm('Are you sure you want to clear all pause events?')) {
        onClearPauseMap();
      }
    }
  };

  return (
    <div className="video-controls">
      <div className="source-controls">
        <h3>Video Source</h3>
        <div className="input-group">
          <input
            type="text"
            value={videoUrl}
            onChange={handleVideoUrlChange}
            placeholder="Enter video URL or choose a file"
          />
          <button onClick={handleLoadVideo}>Load URL</button>
        </div>
        <div className="file-upload">
          <label htmlFor="video-file">Or select from device:</label>
          <input
            type="file"
            id="video-file"
            accept="video/*"
            onChange={handleFileUpload}
          />
        </div>
        <button 
          className="sample-video-button" 
          onClick={() => {
            const sampleUrl = 'https://media.istockphoto.com/id/1212160551/video/happy-pet-dog-puppy-play-at-home-cute-dog-indoors-happy-puppy-looking-at-camera.mp4?s=mp4-640x640-is&k=20&c=XbqSgmaRjLaMBvWNSUWVtOmQQHO_qQXnfLklbKjS8SQ=';
            setVideoUrl(sampleUrl);
            onVideoSourceChange(sampleUrl);
          }}
        >
          Load Sample Video
        </button>
      </div>

      <div className="mode-controls">
        <button 
          className={`mode-button ${isRecording ? 'active' : ''}`}
          onClick={handleToggleRecording}
          disabled={isSyncMode}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording Pauses'}
        </button>
        
        <button 
          className={`mode-button ${isSyncMode ? 'active' : ''}`}
          onClick={handleToggleSyncMode}
          disabled={pauseMap.length === 0}
        >
          {isSyncMode ? 'Stop Sync Playback' : 'Start Sync Playback'}
        </button>
        
        <button 
          className="reset-button"
          onClick={() => {
            const videoElement = document.querySelector('video');
            if (videoElement) {
              videoElement.currentTime = 0;
              if (isSyncMode) {
                // If in sync mode, toggle it off and back on to reset
                onToggleSyncMode(false);
                setTimeout(() => onToggleSyncMode(true), 100);
              }
            }
          }}
        >
          Reset Video
        </button>
      </div>

      <div className="pause-map-controls">
        <h3>Pause Map</h3>
        <div className="pause-map-status">
          {pauseMap.length > 0 ? (
            <span>Loaded {pauseMap.length} pause events</span>
          ) : (
            <span>No pause events recorded</span>
          )}
        </div>
        <div className="pause-map-buttons">
          <button 
            onClick={handleDownloadPauseMap}
            disabled={pauseMap.length === 0}
          >
            Download Pause Map
          </button>
          <div className="pause-map-upload">
            <label htmlFor="pause-map-file">Upload Pause Map:</label>
            <input
              type="file"
              id="pause-map-file"
              accept=".json"
              onChange={handleUploadPauseMap}
            />
          </div>
          <button onClick={handlePasteJson}>Paste JSON</button>
          <button 
            className="clear-button"
            onClick={handleClearPauseMap}
            disabled={pauseMap.length === 0}
          >
            Clear Pause Map
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoControls; 