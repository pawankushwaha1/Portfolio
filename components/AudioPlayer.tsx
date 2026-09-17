'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  caption?: string;
  trackName?: string;
  audioSrc?: string;
}

export default function AudioPlayer({
  caption = 'CURRENTLY LISTENING',
  trackName = 'Cinematic Ambient & Lo-Fi Beats',
  audioSrc = '/assets/audio/ambient_lofi.wav',
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio autoplay prevented:', err);
      });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  return (
    <div className={`music-capsule ${isPlaying ? 'playing' : ''}`} id="musicCapsule">
      <div className={`vinyl-record-wrap ${isPlaying ? 'rotating' : ''}`} id="vinylRecordWrap" onClick={togglePlay}>
        <div className="vinyl-disc" id="vinylDisc">
          <div className="vinyl-grooves" />
          <div className="vinyl-center-label">
            <span className="vinyl-dot" />
          </div>
        </div>
      </div>

      <div className="music-text-group" onClick={togglePlay} style={{ cursor: 'pointer' }}>
        <span className="music-label">{caption}</span>
        <span className="music-track">{trackName}</span>
      </div>

      <button
        className="music-play-btn"
        id="musicPlayBtn"
        aria-label={isPlaying ? 'Pause ambient music' : 'Play ambient music'}
        onClick={togglePlay}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <audio ref={audioRef} src={audioSrc} loop preload="none" />
    </div>
  );
}
