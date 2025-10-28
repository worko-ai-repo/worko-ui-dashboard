import { useState, useRef, useCallback } from 'react';

interface UseMediaRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
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

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      currentChunksRef.current = [];

      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      let screenStream: MediaStream;
      try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        console.log('Screen sharing denied, continuing with webcam only');
        screenStream = new MediaStream();
      }

      streamsRef.current = [webcamStream, screenStream];

      const combinedStream = new MediaStream([
        ...webcamStream.getVideoTracks(),
        ...webcamStream.getAudioTracks(),
        ...screenStream.getVideoTracks(),
        ...screenStream.getAudioTracks(),
      ]);
      combinedStreamRef.current = combinedStream;

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
      });

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
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    // Stop current segment (if active), push its blob, then stop streams and return concatenated full
    const finalizeCurrentSegment = (): Promise<Blob | null> => {
      return new Promise((resolve) => {
        const mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
          resolve(null);
          return;
        }
        mediaRecorder.onstop = () => {
          const segmentBlob = new Blob(currentChunksRef.current, { type: 'video/webm' });
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
    const full = new Blob(segmentsRef.current, { type: 'video/webm' });
    return full;
  }, []);

  const captureSegment = useCallback(async (): Promise<Blob | null> => {
    // End the current segment to create a standalone WebM, then immediately start a new segment
    const mediaRecorder = mediaRecorderRef.current;
    const combinedStream = combinedStreamRef.current;
    if (!mediaRecorder || !combinedStream) return null;

    const segmentBlob = await new Promise<Blob | null>((resolve) => {
      if (mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(currentChunksRef.current, { type: 'video/webm' });
        if (blob.size > 0) segmentsRef.current.push(blob);
        currentChunksRef.current = [];
        resolve(blob);
      };
      mediaRecorder.stop();
    });

    // Immediately start a new segment if still in overall recording mode
    if (isRecording && combinedStreamRef.current) {
      const newRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' });
      newRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) currentChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current = newRecorder;
      newRecorder.start();
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
