import { useState, useRef, useCallback } from "react";

interface UseMediaRecorderReturn {
  isRecording: boolean;
  startRecording: (existingStream?: MediaStream) => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  captureSegment: () => Promise<Blob | null>;
  error: string | null;
}

export const useMediaRecorder = (): UseMediaRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // current segment recorder
  const currentChunksRef = useRef<Blob[]>([]); // chunks for current segment
  const segmentsRef = useRef<Blob[]>([]); // completed segment blobs
  const streamsRef = useRef<MediaStream[]>([]);
  const combinedStreamRef = useRef<MediaStream | null>(null);
  const usedMimeTypeRef = useRef<string>("");

  const pickSupportedMimeType = () => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    for (const type of candidates) {
      if ((window as any).MediaRecorder && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  };

  const startRecording = useCallback(async (existingStream?: MediaStream) => {
    try {
      setError(null);
      currentChunksRef.current = [];

      let combinedStream: MediaStream;

      if (existingStream) {
        // Use the already-granted stream (camera, mic, and screen)
        combinedStream = existingStream;

        // Listen for when user stops sharing (clicks "Stop sharing" button)
        const screenVideoTrack = existingStream
          .getVideoTracks()
          .find((track) => track.label.includes("screen") || track.label.includes("Screen"));

        if (screenVideoTrack) {
          screenVideoTrack.onended = () => {
            setError(
              "Screen sharing was stopped. Please restart the interview and share your full screen."
            );
            // Stop all recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              mediaRecorderRef.current.stop();
            }
            existingStream.getTracks().forEach((track) => track.stop());
            setIsRecording(false);
          };
        }
        // Track provided stream for cleanup symmetry
        streamsRef.current = [existingStream];
      } else {
        // Fallback: Request permissions (this shouldn't happen in normal flow)
        const webcamStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Enforce full screen sharing only - no window or tab sharing
        let screenStream: MediaStream;
        try {
          screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              displaySurface: "monitor", // Force full screen only (monitor = entire screen)
            } as MediaTrackConstraints,
            audio: true,
          });

          // Verify that the user selected a full screen (not window/tab)
          const videoTrack = screenStream.getVideoTracks()[0];
          const settings = videoTrack.getSettings();

          // Check if user selected window or browser tab instead of monitor
          if (settings.displaySurface && settings.displaySurface !== "monitor") {
            // Stop the streams immediately
            screenStream.getTracks().forEach((track) => track.stop());
            webcamStream.getTracks().forEach((track) => track.stop());

            throw new Error(
              "You must share your entire screen. Window and tab sharing are not allowed for security reasons."
            );
          }

          // Listen for when user stops sharing (clicks "Stop sharing" button)
          videoTrack.onended = () => {
            setError(
              "Screen sharing was stopped. Please restart the interview and share your full screen."
            );
            // Stop all recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
              mediaRecorderRef.current.stop();
            }
            streamsRef.current.forEach((stream) => {
              stream.getTracks().forEach((track) => track.stop());
            });
            setIsRecording(false);
          };
        } catch (err) {
          // Clean up webcam stream if screen sharing fails
          webcamStream.getTracks().forEach((track) => track.stop());

          // Don't silently continue - throw error to prevent loop
          if (err instanceof Error) {
            throw new Error(`Screen sharing is required: ${err.message}`);
          }
          throw new Error(
            "Screen sharing is required to start the interview. Please allow full screen sharing."
          );
        }

        streamsRef.current = [webcamStream, screenStream];

        combinedStream = new MediaStream([
          ...webcamStream.getVideoTracks(),
          ...webcamStream.getAudioTracks(),
          ...screenStream.getVideoTracks(),
          ...screenStream.getAudioTracks(),
        ]);
      }

      combinedStreamRef.current = combinedStream;

      const mimeType = pickSupportedMimeType();
      const mediaRecorder = new MediaRecorder(
        combinedStream,
        mimeType ? { mimeType } : undefined
      );
      usedMimeTypeRef.current = mimeType;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          currentChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      segmentsRef.current = [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start recording";
      setError(errorMessage);
      console.error("Recording error:", err);

      // Clean up any streams that might have been created
      streamsRef.current.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
      streamsRef.current = [];

      // Re-throw to prevent the calling code from continuing
      throw err;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    // Stop current segment (if active), push its blob, then stop streams and return concatenated full
    const finalizeCurrentSegment = (): Promise<Blob | null> => {
      return new Promise((resolve) => {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
          resolve(null);
          return;
        }
        mediaRecorder.onstop = () => {
          const segmentBlob = new Blob(currentChunksRef.current, { type: "video/webm" });
          if (segmentBlob.size > 0) segmentsRef.current.push(segmentBlob);
          currentChunksRef.current = [];
          resolve(segmentBlob);
        };
        mediaRecorder.stop();
      });
    };

    await finalizeCurrentSegment();

    streamsRef.current.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });
    streamsRef.current = [];
    combinedStreamRef.current = null;
    setIsRecording(false);

    if (segmentsRef.current.length === 0) return null;
    const full = new Blob(segmentsRef.current, { type: "video/webm" });
    return full;
  }, []);

  const captureSegment = useCallback(async (): Promise<Blob | null> => {
    // End the current segment to create a standalone WebM, then immediately start a new segment
    const recorder = mediaRecorderRef.current;
    const combined = combinedStreamRef.current;
    if (!recorder || !combined) {
      console.warn("MediaRecorder not initialized, cannot capture segment");
      return null;
    }

    if (recorder.state === "inactive") {
      console.warn("MediaRecorder is inactive, cannot capture segment");
      return null;
    }

    const localChunks: BlobPart[] = [];

    const handleData = (event: BlobEvent) => {
      if (event.data && event.data.size > 0) {
        localChunks.push(event.data);
      }
    };

    const segmentBlob = await new Promise<Blob | null>((resolve) => {
      const handleStop = () => {
        // Some browsers fire dataavailable after stop; defer by one tick to ensure all chunks collected
        setTimeout(() => {
          const blob = new Blob(localChunks, {
            type: usedMimeTypeRef.current || "video/webm",
          });
          recorder.removeEventListener("dataavailable", handleData);
          recorder.removeEventListener("stop", handleStop);
          // Also reset global currentChunks for the new segment
          currentChunksRef.current = [];
          if (blob.size > 0) segmentsRef.current.push(blob);
          resolve(blob.size > 0 ? blob : null);
        }, 0);
      };

      recorder.addEventListener("dataavailable", handleData);
      recorder.addEventListener("stop", handleStop);

      try {
        recorder.stop();
      } catch (err) {
        console.error("Error stopping recorder for segment:", err);
        recorder.removeEventListener("dataavailable", handleData);
        recorder.removeEventListener("stop", handleStop);
        resolve(null);
      }
    });

    // Immediately start a new recorder on the same combined stream to continue recording
    if (isRecording && combinedStreamRef.current) {
      const mimeType = usedMimeTypeRef.current || pickSupportedMimeType();
      const newRecorder = new MediaRecorder(
        combinedStreamRef.current,
        mimeType ? { mimeType } : undefined
      );
      newRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) currentChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current = newRecorder;
      try {
        newRecorder.start();
      } catch (err) {
        console.error("Failed to restart recorder after segment capture:", err);
      }
    }

    return segmentBlob;
  }, [isRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    captureSegment,
    error,
  };
};
