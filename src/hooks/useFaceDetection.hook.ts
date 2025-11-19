import { MutableRefObject, useEffect, useRef, useState } from "react";
import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-converter";
import "@tensorflow/tfjs-backend-cpu";
import * as tf from "@tensorflow/tfjs-core";
import * as blazeface from "@tensorflow-models/blazeface";

interface UseFaceDetectionOptions {
  videoRef: MutableRefObject<HTMLVideoElement | null>;
  enabled: boolean;
  horizontalTolerance?: number;
  verticalTolerance?: number;
  detectionInterval?: number;
  minScore?: number;
  consecutiveFramesForLock?: number;
}

interface UseFaceDetectionResult {
  isModelReady: boolean;
  isFacePresent: boolean;
  isFaceCentered: boolean;
  faceWarning: string | null;
  detectionError: string | null;
}

let globalModelPromise: Promise<blazeface.BlazeFaceModel> | null = null;
const preferredBackends: string[] = ["webgl", "cpu"];

const ensureBackend = async () => {
  const current = tf.getBackend();
  if (current && preferredBackends.includes(current as never)) {
    await tf.ready();
    return;
  }

  for (const backend of preferredBackends) {
    try {
      await tf.setBackend(backend);
      await tf.ready();
      console.info(`[FaceDetection] Using TensorFlow backend: ${backend}`);
      return;
    } catch (error) {
      console.warn(`[FaceDetection] Failed to init ${backend} backend`, error);
    }
  }

  throw new Error("Unable to initialize TensorFlow backend");
};

const ensureModel = async () => {
  if (!globalModelPromise) {
    globalModelPromise = (async () => {
      await ensureBackend();
      return blazeface.load({ maxFaces: 1 });
    })();
  }
  return globalModelPromise;
};

export const useFaceDetection = ({
  videoRef,
  enabled,
  horizontalTolerance = 0.2,
  verticalTolerance = 0.2,
  detectionInterval = 500,
  minScore = 0.85,
  consecutiveFramesForLock = 3,
}: UseFaceDetectionOptions): UseFaceDetectionResult => {
  const [isModelReady, setIsModelReady] = useState(false);
  const [isFacePresent, setIsFacePresent] = useState(false);
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const [faceWarning, setFaceWarning] = useState<string | null>(null);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  const modelRef = useRef<blazeface.BlazeFaceModel | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stableFrameCountRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const startDetectionLoop = async () => {
      try {
        const model = await ensureModel();
        if (!isMounted) {
          return;
        }
        modelRef.current = model;
        setIsModelReady(true);

        intervalRef.current = window.setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2 || !modelRef.current) {
            return;
          }

          if (video.videoWidth === 0 || video.videoHeight === 0) {
            return;
          }

          try {
            const predictions = await modelRef.current.estimateFaces(video, false);

            if (!predictions.length) {
              stableFrameCountRef.current = 0;
              setIsFacePresent(false);
              setIsFaceCentered(false);
              setFaceWarning("Face not detected. Please look directly at the camera.");
              return;
            }

            const face = predictions[0];
            const [score]:any = face.probability ?? [1];

            if (score < minScore) {
              stableFrameCountRef.current = 0;
              setIsFacePresent(false);
              setIsFaceCentered(false);
              setFaceWarning("Unable to confirm your face. Improve lighting and look at the camera.");
              return;
            }

            const [x1, y1] = face.topLeft as [number, number];
            const [x2, y2] = face.bottomRight as [number, number];
            const width = x2 - x1;
            const height = y2 - y1;

            if (width <= 0 || height <= 0) {
              stableFrameCountRef.current = 0;
              setIsFacePresent(false);
              setIsFaceCentered(false);
              setFaceWarning("Face not detected. Please adjust your position.");
              return;
            }

            const centerX = x1 + width / 2;
            const centerY = y1 + height / 2;

            const normalizedX = centerX / video.videoWidth;
            const normalizedY = centerY / video.videoHeight;

            let warning: string | null = null;

            if (Math.abs(normalizedX - 0.5) > horizontalTolerance) {
              warning =
                normalizedX < 0.5
                  ? "Please move slightly to your right so your face stays centered."
                  : "Please move slightly to your left so your face stays centered.";
            } else if (Math.abs(normalizedY - 0.5) > verticalTolerance) {
              warning =
                normalizedY < 0.5
                  ? "Please lower your face a little to keep it within view."
                  : "Please sit up a bit straighter to keep your face fully visible.";
            }

            setIsFacePresent(true);
            setFaceWarning(warning);

            if (!warning) {
              stableFrameCountRef.current += 1;
              if (stableFrameCountRef.current >= consecutiveFramesForLock) {
                setIsFaceCentered(true);
              }
            } else {
              stableFrameCountRef.current = 0;
              setIsFaceCentered(false);
            }
          } catch (error) {
            console.error("Face detection failed:", error);
            setDetectionError("Face detection failed. Please refresh the page.");
            stableFrameCountRef.current = 0;
            setIsFacePresent(false);
            setIsFaceCentered(false);
            setFaceWarning("Face detection temporarily unavailable.");
          }
        }, detectionInterval);
      } catch (error) {
        console.error("Unable to start face detection:", error);
        if (isMounted) {
          setDetectionError("Unable to start face detection. Please refresh and try again.");
        }
      }
    };

    if (enabled) {
      startDetectionLoop();
    }

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      stableFrameCountRef.current = 0;
      setIsFacePresent(false);
      setIsFaceCentered(false);
      setFaceWarning(null);
    };
  }, [
    detectionInterval,
    enabled,
    horizontalTolerance,
    minScore,
    videoRef,
    verticalTolerance,
    consecutiveFramesForLock,
  ]);

  return {
    isModelReady,
    isFacePresent,
    isFaceCentered,
    faceWarning,
    detectionError,
  };
};


