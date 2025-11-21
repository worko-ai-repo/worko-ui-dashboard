import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";

import { useSpeechToText } from "@Hooks/useSpeechToText.hook";
import { qnaHandler } from "@Utils/qnaHandler.util";
import { TranscriptEntry } from "@Components/Interview/TranscriptHistory";
import { useNavigate } from "react-router-dom";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import interviewServiceObj from "@Services/Interview.service";
import { useMediaRecorder } from "@Hooks/useMediaRecorderForVideoInterview";
import { useAppContext } from "./App.context";

type InterviewState = "idle" | "intro" | "active" | "completed";

const AI_NAME = "VERA";

interface InterviewContextType {
  // State
  interviewState: InterviewState;
  currentQuestion: string;
  isCrossQuestion: boolean;
  acknowledgement: string;
  endMessage: string;
  isProcessing: boolean;
  recordedBlob: Blob | null;
  transcription: string;
  transcriptHistory: TranscriptEntry[];
  isTranscribing: boolean;
  answerVideos: Blob[];
  currentInterview: InterviewDto | null;
  interviewId: string | null;
  interviewStage: "new" | "continue" | null;
  aiName: string;
  stream: MediaStream | null;

  // Recording hooks
  isRecording: boolean;
  error: string | null;

  // Speech-to-text hooks
  transcript: string;
  isListening: boolean;
  isSpeechSupported: boolean;
  speechError: string | null;

  // Refs
  interviewStartTime: React.MutableRefObject<number>;
  isSubmittingRef: React.MutableRefObject<boolean>;

  // Actions
  startInterview: (options?: {
    stage?: "new" | "continue";
    routeInterviewId?: string | null;
  }) => Promise<void>;
  loadExistingInterview: (
    interview: InterviewDto,
    stream?: MediaStream,
    id?: string,
    stage?: "new" | "continue"
  ) => void;
  setInterviewStream: (stream: MediaStream | null) => void;
  handleSubmitAnswer: () => void;
  handleInterviewEnd: (closingMessage: string) => Promise<void>;
  downloadRecording: () => void;
  resetInterview: () => void;
  cleanupMediaStreams: () => void;
  handleQuestionStartSpeaking: () => void;
  handleQuestionEndSpeaking: () => void;
  stopListening: () => void;
  startListening: () => void;
  resetTranscript: () => void;
  captureSegment?: () => Promise<Blob | null>;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error("useInterview must be used within InterviewProvider");
  }
  return context;
};

interface InterviewProviderProps {
  children: ReactNode;
}

export const InterviewProvider = ({ children }: InterviewProviderProps) => {
  const navigate = useNavigate();
  const { userDetails } = useAppContext();
  const [interviewState, setInterviewState] = useState<InterviewState>("idle");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [isCrossQuestion, setIsCrossQuestion] = useState(false);
  const [acknowledgement, setAcknowledgement] = useState<string>("");
  const [endMessage, setEndMessage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [transcriptHistory, setTranscriptHistory] = useState<TranscriptEntry[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [answerVideos, setAnswerVideos] = useState<Blob[]>([]);
  const [currentInterview, setCurrentInterview] = useState<InterviewDto | null>(null);
  const [grantedStream, setGrantedStream] = useState<MediaStream | null>(null);
  const grantedStreamRef = useRef<MediaStream | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const interviewIdRef = useRef<string | null>(null);
  const [interviewStage, setInterviewStage] = useState<"new" | "continue" | null>(null);
  const [chunkSequence, setChunkSequence] = useState<number>(1);

  const interviewStartTime = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);

  const { isRecording, startRecording, stopRecording, captureSegment, error } = useMediaRecorder();
  const {
    transcript,
    isListening,
    isSupported: isSpeechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText();

  // Cleanup function to stop all media streams
  const setInterviewStream = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      grantedStreamRef.current = null;
      setGrantedStream(null);
      return;
    }

    const clonedTracks = stream.getTracks().map((t) => t.clone());
    const clonedStream = new MediaStream(clonedTracks);
    grantedStreamRef.current = clonedStream;
    setGrantedStream(clonedStream);
  }, []);

  const cleanupMediaStreams = useCallback(() => {
    console.log("Cleaning up all media streams...");

    // Stop the granted stream (camera + screen recording)
    const streamToCleanup = grantedStreamRef.current;
    if (streamToCleanup) {
      streamToCleanup.getTracks().forEach((track) => {
        console.log(`Stopping track: ${track.kind} - ${track.label}`);
        track.stop();
      });
      grantedStreamRef.current = null;
      setGrantedStream(null);
    }

    // Stop recording if active
    if (isRecording) {
      console.log("Stopping active recording...");
      stopRecording();
    }

    // Stop speech recognition if active
    if (isListening) {
      console.log("Stopping speech recognition...");
      stopListening();
    }
    interviewIdRef.current = null;
    setInterviewId(null);
    setInterviewStage(null);
  }, [isRecording, isListening, stopRecording, stopListening]);

  const handleQuestionStartSpeaking = useCallback(() => {
    if (isSpeechSupported && isListening) {
      stopListening();
    }
    resetTranscript();
    setIsTranscribing(false);
  }, [isSpeechSupported, isListening, stopListening, resetTranscript]);

  const handleQuestionEndSpeaking = useCallback(() => {
    if (isSpeechSupported && !isListening) {
      startListening();
      setIsTranscribing(true);
    }
  }, [isSpeechSupported, isListening, startListening]);

  const startInterview = async (options?: {
    stage?: "new" | "continue";
    routeInterviewId?: string | null;
  }) => {
    try {
      let stageForInterview = options?.stage || interviewStage;
      let activeInterviewId =
        interviewIdRef.current || interviewId || options?.routeInterviewId || null;
      let interviewData = currentInterview;

      if (
        stageForInterview === "new" &&
        (!activeInterviewId || activeInterviewId === "new" || !interviewData)
      ) {
        if (!userDetails?.email) {
          throw new Error("User email not found. Please refresh and try again.");
        }

        const { response: initiatedInterview, error } = await interviewServiceObj.initiateInterview(
          userDetails.email
        );

        if (error || !initiatedInterview) {
          throw new Error(error || "Failed to initiate interview. Please try again.");
        }

        loadExistingInterview(
          initiatedInterview,
          grantedStreamRef.current || undefined,
          initiatedInterview.id,
          "new"
        );

        interviewData = initiatedInterview;
        activeInterviewId = initiatedInterview.id;
        stageForInterview = "new";
      }

      console.log("Starting interview with ID:", activeInterviewId, "Stage:", stageForInterview);

      qnaHandler.reset();
      setInterviewState("intro");
      isSubmittingRef.current = false;
      setAnswerVideos([]);
      setChunkSequence(1);

      // Start recording with already-granted stream
      const streamToUse = grantedStreamRef.current;
      await startRecording(streamToUse || undefined);
      interviewStartTime.current = Date.now();

      // Get initial question from current interview if available
      if (interviewData) {
        const { currentQuestion: question, acknowledgement: ack } =
          qnaHandler.initialize(interviewData);
        setCurrentQuestion(question);
        setAcknowledgement(ack);
      }

      // Navigate using stored interviewId with absolute paths
      if (!activeInterviewId) {
        throw new Error("Interview ID missing. Please refresh and try again.");
      }

      const introPath = `/interview/${activeInterviewId}/active`;
      console.log("Navigating to:", introPath);
      navigate(introPath);
    } catch (err) {
      // If recording fails, reset to idle state
      console.error("Failed to start interview:", err);
      setInterviewState("idle");
      throw err instanceof Error ? err : new Error("Failed to start interview.");
    }
  };

  const loadExistingInterview = useCallback(
    (interview: InterviewDto, stream?: MediaStream, id?: string, stage?: "new" | "continue") => {
      console.log("loadExistingInterview called with:", {
        id,
        stage,
        hasInterview: !!interview,
        hasStream: !!stream,
      });

      setCurrentInterview(interview);

      if (stream) {
        setInterviewStream(stream);
      }

      if (id) {
        console.log("Setting interview ID:", id);
        interviewIdRef.current = id;
        setInterviewId(id);
      } else {
        console.warn("No ID provided to loadExistingInterview");
      }

      if (stage) {
        console.log("Setting interview stage:", stage);
        setInterviewStage(stage);
      } else {
        console.warn("No stage provided to loadExistingInterview");
      }

      // Initialize qnaHandler with interview data
      const { currentQuestion: question, acknowledgement: ack } = qnaHandler.initialize(interview);
      setCurrentQuestion(question);
      setAcknowledgement(ack);

      // Set up transcript history from interview history
      if (interview.interviewHistory) {
        const history: TranscriptEntry[] = interview.interviewHistory.map((entry) => ({
          question: entry.questionText,
          answer: entry.userAnswer,
          timestamp: entry.timeTaken,
        }));
        setTranscriptHistory(history);
        setChunkSequence(interview.interviewHistory.length + 1);
      }
    },
    []
  );

  const handleSubmitAnswer = useCallback(() => {
    if (isSubmittingRef.current) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }

    isSubmittingRef.current = true;
    const timestamp = Date.now() - interviewStartTime.current;

    stopListening();
    setIsTranscribing(false);

    const finalTranscript = transcript.trim() || `Candidate skipped the question`;

    setTranscription(finalTranscript);

    (async () => {
      try {
        let segment: Blob | null = null;

        try {
          console.log("Attempting to capture video segment...");
          segment = await captureSegment?.();

          if (segment) {
            console.log("Video segment captured successfully:", {
              size: segment.size,
              sizeKB: (segment.size / 1024).toFixed(2) + " KB",
              type: segment.type,
            });
          } else {
            console.warn("captureSegment returned null");
          }
        } catch (captureError) {
          console.error("Failed to capture video segment:", captureError);
          // Continue without video segment instead of failing entirely
        }

        // Store the video blob in answerVideos array (only if valid and non-empty)
        if (segment && segment.size > 0) {
          setAnswerVideos((prev) => {
            const newVideos = [...prev, segment];
            console.log("Updated answerVideos array:", {
              totalVideos: newVideos.length,
              sizes: newVideos.map((v) => v.size),
            });
            return newVideos;
          });
        }

        // Update transcript history
        setTranscriptHistory((prev) => [
          ...prev,
          {
            question: currentQuestion,
            answer: finalTranscript,
            timestamp,
          },
        ]);
        const userId = userDetails?.id;
        if (interviewId && currentInterview && userId) {
          const result = await qnaHandler.handleAnswerSubmission(
            interviewId,
            segment || new Blob(),
            finalTranscript,
            timestamp,
            chunkSequence,
            userId,
            {
              questionId: currentInterview.currentQuestion,
              questionText: currentQuestion,
            }
          );

          // Update the interview state with the latest data from backend
          if (result.updatedInterview) {
            setCurrentInterview(result.updatedInterview);
          }

          if (result.isFinal) {
            handleInterviewEnd("Interview completed successfully");
          } else if (result.nextQuestion) {
            setCurrentQuestion(result.nextQuestion);
            setIsCrossQuestion(false);
            setTranscription("");
            resetTranscript();
            setChunkSequence((prev) => prev + 1);
            isSubmittingRef.current = false;
          } else {
            isSubmittingRef.current = false;
          }
        } else {
          console.error("Missing interviewId or currentInterview");
          isSubmittingRef.current = false;
        }
      } catch (error) {
        console.error("Error handling answer submission:", error);
        isSubmittingRef.current = false;
      }
    })();

    console.log("Submitting answer:", {
      transcript: finalTranscript,
      timestamp,
      question: currentQuestion,
      chunkSequence,
    });
  }, [
    transcript,
    currentQuestion,
    stopListening,
    resetTranscript,
    captureSegment,
    interviewId,
    currentInterview,
    chunkSequence,
  ]);

  const handleInterviewEnd = async (closingMessage: string) => {
    setEndMessage(closingMessage);
    setIsProcessing(true);

    const blob = await stopRecording();

    // Clean up all media streams
    cleanupMediaStreams();

    setTimeout(() => {
      setRecordedBlob(blob);
      setIsProcessing(false);
      setInterviewState("completed");
      navigate(`/interview/${interviewId}/completed`);
      isSubmittingRef.current = false;
    }, 2000);
  };

  const downloadRecording = () => {
    if (!recordedBlob) return;

    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "finalInterviewSession.webm";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetInterview = () => {
    // Clean up all media streams before resetting
    cleanupMediaStreams();

    setInterviewState("idle");
    setCurrentQuestion("");
    setIsCrossQuestion(false);
    setAcknowledgement("");
    setEndMessage("");
    setIsProcessing(false);
    setRecordedBlob(null);
    setTranscription("");
    setTranscriptHistory([]);
    setAnswerVideos([]);
    setIsTranscribing(false);
    setCurrentInterview(null);
    setInterviewId(null);
    setInterviewStage(null);
    setChunkSequence(1);
    stopListening();
    resetTranscript();
    qnaHandler.reset();
    isSubmittingRef.current = false;
    navigate("/interview");
  };

  const value: InterviewContextType = {
    interviewState,
    currentQuestion,
    isCrossQuestion,
    acknowledgement,
    endMessage,
    isProcessing,
    recordedBlob,
    transcription,
    transcriptHistory,
    isTranscribing,
    answerVideos,
    currentInterview,
    interviewId,
    interviewStage,
    aiName: AI_NAME,
    stream: grantedStream,
    isRecording,
    error,
    transcript,
    isListening,
    isSpeechSupported,
    speechError,
    interviewStartTime,
    isSubmittingRef,
    startInterview,
    loadExistingInterview,
    setInterviewStream,
    handleSubmitAnswer,
    handleInterviewEnd,
    downloadRecording,
    resetInterview,
    cleanupMediaStreams,
    handleQuestionStartSpeaking,
    handleQuestionEndSpeaking,
    stopListening,
    startListening,
    resetTranscript,
    captureSegment,
  };

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
};
