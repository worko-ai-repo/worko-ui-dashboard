import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize } from "lucide-react";
import InterviewService from "@Services/Interview.service";

interface VideoSegment {
  url: string;
  duration?: number; // Optional now
  questionNumber?: number;
  questionText?: string;
  questionId?: string;
}

interface MultiSegmentVideoPlayerProps {
  className?: string;
  interviewId: string;
}
interface InterviewData {
  interviewId: string;
  candidateEmail: string;
  interviewStatus: "COMPLETED" | "IN_PROGRESS" | "PENDING" | "CANCELLED";
  totalQuestions: number;
  videos: VideoData[];
}

interface VideoData {
  questionNumber: number;
  questionId: string;
  questionText: string;
  chunkId: string;
  chunkUrl: string;
  uploadStatus: "UPLOADED" | "FAILED" | "PENDING";
  feedback?: string; // Optional since not all videos might have feedback
}

export default function MultiSegmentVideoPlayer({
  className = "",
  interviewId,
}: MultiSegmentVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [detectedDurations, setDetectedDurations] = useState<number[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [videoSegments, setVideoSegments] = useState<VideoSegment[]>([]);
  const [isFetchingVideos, setIsFetchingVideos] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const preloadVideoRef = useRef<HTMLVideoElement | null>(null);
  const lastVideoSegmentsRef = useRef<string>("");

  // Fetch interview videos on mount
  useEffect(() => {
    const fetchVideos = async () => {
      if (!interviewId) {
        setFetchError("Interview ID is required");
        setIsFetchingVideos(false);
        return;
      }

      setIsFetchingVideos(true);
      setFetchError(null);

      const { response, error } = await InterviewService.fetchInterviewVideos(interviewId);

      if (error || !response) {
        setFetchError(error || "Failed to load interview videos");
        setIsFetchingVideos(false);
        return;
      }

      // Sort videos by questionNumber in ascending order
      const sortedVideos = (response.videos || [])
        .filter((video: VideoData) => video.uploadStatus === "UPLOADED")
        .sort((a: VideoData, b: VideoData) => a.questionNumber - b.questionNumber)
        .map((video: VideoData) => ({
          url: video.chunkUrl,
          questionNumber: video.questionNumber,
          questionText: video.questionText,
          questionId: video.questionId,
        }));

      setVideoSegments(sortedVideos);
      setIsFetchingVideos(false);
    };

    fetchVideos();
  }, [interviewId]);

  // Calculate cumulative durations for timestamp mapping
  const cumulativeDurations = detectedDurations.reduce((acc: number[], duration, index) => {
    acc.push(index === 0 ? duration : acc[index - 1] + duration);
    return acc;
  }, []);

  const totalDuration =
    cumulativeDurations.length > 0 ? cumulativeDurations[cumulativeDurations.length - 1] : 0;

  // Detect video durations on mount or when segments change
  useEffect(() => {
    const segmentsKey = JSON.stringify(videoSegments.map((v) => v.url));

    // Prevent re-running if segments haven't changed
    if (segmentsKey === lastVideoSegmentsRef.current || isDetecting) {
      return;
    }

    lastVideoSegmentsRef.current = segmentsKey;
    setIsDetecting(true);

    const detectDurations = async () => {
      const durations: number[] = [];

      for (let i = 0; i < videoSegments.length; i++) {
        if (videoSegments[i].duration) {
          durations.push(videoSegments[i].duration!);
        } else {
          const duration = await getVideoDuration(videoSegments[i].url);
          durations.push(duration);
        }
      }

      setDetectedDurations(durations);
      setIsDetecting(false);
    };

    detectDurations();
  }, [videoSegments]);

  // Helper to get video duration
  const getVideoDuration = (url: string): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        video.onloadedmetadata = null;
        video.onerror = null;
        video.onseeked = null;
        video.src = "";
      };

      const finalize = (duration: number) => {
        cleanup();
        resolve(isFinite(duration) ? duration : 0);
      };

      video.preload = "metadata";
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        if (isFinite(video.duration) && video.duration > 0) {
          finalize(video.duration);
        } else {
          // Safari / recorded WebM blobs sometimes report Infinity until we force a seek
          video.onseeked = () => finalize(video.duration);
          try {
            video.currentTime = Number.MAX_SAFE_INTEGER;
          } catch (err) {
            console.error("Failed to resolve duration via seek for:", url, err);
            finalize(0);
          }
        }
      };

      video.onerror = (e) => {
        console.error("Failed to load metadata for:", url, e);
        finalize(0);
      };

      timeoutId = setTimeout(() => {
        console.warn("Timed out getting metadata for:", url);
        finalize(0);
      }, 10000);

      video.src = url;
      video.load();
    });
  };

  // Initialize first video
  useEffect(() => {
    if (videoRef.current && videoSegments.length > 0 && detectedDurations.length > 0) {
      loadVideo(0);
    }
  }, [detectedDurations]);

  // Preload next video to reduce buffering
  useEffect(() => {
    if (currentVideoIndex < videoSegments.length - 1 && currentTime > 0) {
      const currentSegmentDuration = detectedDurations[currentVideoIndex];
      const localTime = videoRef.current?.currentTime || 0;

      // Preload when 5 seconds from end
      if (currentSegmentDuration - localTime < 5 && !preloadVideoRef.current) {
        preloadNextVideo();
      }
    }
  }, [currentTime, currentVideoIndex]);

  const preloadNextVideo = () => {
    if (currentVideoIndex < videoSegments.length - 1) {
      const nextVideo = document.createElement("video");
      nextVideo.preload = "auto";
      nextVideo.src = videoSegments[currentVideoIndex + 1].url;
      preloadVideoRef.current = nextVideo;
    }
  };

  const loadVideo = (index: number) => {
    if (videoRef.current && videoSegments[index]) {
      setIsLoading(true);
      setHasError(false);
      const newSrc = videoSegments[index].url;

      videoRef.current.src = newSrc;
      videoRef.current.preload = "auto";
      videoRef.current.load();
      setCurrentVideoIndex(index);

      // Clean up preloaded video
      if (preloadVideoRef.current) {
        preloadVideoRef.current.src = "";
        preloadVideoRef.current = null;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && detectedDurations.length > 0) {
      const localTime = videoRef.current.currentTime;
      const globalTime =
        (currentVideoIndex > 0 ? cumulativeDurations[currentVideoIndex - 1] : 0) + localTime;
      setCurrentTime(globalTime);
      setDuration(totalDuration);
    }
  };

  const handleVideoEnded = () => {
    if (currentVideoIndex < videoSegments.length - 1) {
      const wasPlaying = isPlaying;
      loadVideo(currentVideoIndex + 1);
      if (wasPlaying && videoRef.current) {
        videoRef.current.oncanplay = () => {
          videoRef.current?.play().catch((err: Error) => console.error("Play failed:", err));
          if (videoRef.current) {
            videoRef.current.oncanplay = null;
          }
        };
      }
    } else {
      setIsPlaying(false);
      setCurrentTime(totalDuration);
    }
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleWaiting = () => {
    // Only show loading if still waiting after a brief delay
    const timeout = setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 3) {
        setIsLoading(true);
      }
    }, 300);

    return () => clearTimeout(timeout);
  };

  const handlePlaying = () => {
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Video error:", e);
    setIsLoading(false);
    setHasError(true);
    setIsPlaying(false);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleLoadedData = () => {
    setIsLoading(false);
  };

  const seekToTime = (targetSeconds: number) => {
    if (videoSegments.length === 0 || detectedDurations.length === 0) return;

    let videoIndex = 0;
    let localTime = targetSeconds;

    // Find which video segment contains the target time
    for (let i = 0; i < cumulativeDurations.length; i++) {
      if (targetSeconds <= cumulativeDurations[i]) {
        videoIndex = i;
        localTime = i === 0 ? targetSeconds : targetSeconds - cumulativeDurations[i - 1];
        break;
      }
    }

    // Load different video if needed
    if (videoIndex !== currentVideoIndex) {
      const wasPlaying = isPlaying;
      loadVideo(videoIndex);
      if (videoRef.current) {
        videoRef.current.onloadeddata = () => {
          if (videoRef.current) {
            videoRef.current.currentTime = localTime;
            if (wasPlaying) {
              videoRef.current.play().catch((err: Error) => console.error("Play failed:", err));
            }
            videoRef.current.onloadeddata = null;
          }
        };
      }
    } else if (videoRef.current) {
      videoRef.current.currentTime = localTime;
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err: Error) => {
            console.error("Play failed:", err);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const targetTime = percentage * totalDuration;
      seekToTime(targetTime);
    }
  };

  const skipForward = () => {
    seekToTime(Math.min(currentTime + 10, totalDuration));
  };

  const skipBackward = () => {
    seekToTime(Math.max(currentTime - 10, 0));
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err: Error) => {
          console.error("Fullscreen failed:", err);
        });
      } else {
        document.exitFullscreen();
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Show loading while fetching videos from API
  if (isFetchingVideos) {
    return (
      <div
        className={`bg-gray-900 rounded-lg flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-sm">Loading interview videos...</p>
        </div>
      </div>
    );
  }

  // Show error if API call failed
  if (fetchError) {
    return (
      <div
        className={`bg-gray-900 rounded-lg flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (videoSegments.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-white text-lg">No video segments available</p>
      </div>
    );
  }

  // Show loading while detecting durations
  if (detectedDurations.length === 0 || isDetecting) {
    return (
      <div
        className={`bg-gray-900 rounded-lg flex items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-sm">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group max-h-[350px] ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {}} // Don't hide controls on mouse leave
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        crossOrigin="anonymous" // Add this line
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        onLoadedMetadata={handleTimeUpdate}
        onCanPlay={handleCanPlay}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onClick={togglePlayPause}
        playsInline
        preload="auto"
      />

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 pointer-events-none">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      )}

      {/* Error Message */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
          <div className="text-center">
            <p className="text-red-500 text-lg mb-2">Failed to load video</p>
            <button
              onClick={() => loadVideo(currentVideoIndex)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Play/Pause Overlay (when paused) */}
      {!isPlaying && !isLoading && !hasError && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 hover:bg-opacity-30 transition-all z-10">
          <div className="bg-blue-600 rounded-full p-6 hover:bg-blue-700 transition-all shadow-2xl">
            <Play className="w-12 h-12 text-white fill-white ml-1" />
          </div>
        </button>
      )}

      {/* Controls - Always visible now */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
        {/* Progress Bar */}
        <div
          ref={progressBarRef}
          className="w-full h-2 bg-gray-700 cursor-pointer hover:h-3 transition-all"
          onClick={handleProgressClick}>
          <div className="h-full bg-blue-600 relative" style={{ width: `${progressPercentage}%` }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"></div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              disabled={hasError}
              className="text-white hover:text-blue-400 transition-colors disabled:opacity-50">
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            {/* Skip Backward */}
            <button
              onClick={skipBackward}
              disabled={hasError}
              className="text-white hover:text-blue-400 transition-colors disabled:opacity-50">
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Skip Forward */}
            <button
              onClick={skipForward}
              disabled={hasError}
              className="text-white hover:text-blue-400 transition-colors disabled:opacity-50">
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors">
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>

            {/* Segment Info */}
            <span className="text-gray-400 text-sm">
              Question {currentVideoIndex + 1}/{videoSegments.length}
            </span>
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-blue-400 transition-colors">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
