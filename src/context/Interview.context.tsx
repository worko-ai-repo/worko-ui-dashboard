import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";

import { useSpeechToText } from "@Hooks/useSpeechToText.hook";
import { qnaHandler } from "@Utils/qnaHandler.util";
import { TranscriptEntry } from "@Components/Interview/TranscriptHistory";
import { useNavigate } from "react-router-dom";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { useMediaRecorder } from "@Hooks/useMediaRecorderForVideoInterview";
import { useAppContext } from "./App.context";

type InterviewState = "idle" | "intro" | "active" | "completed";

const AI_NAME = "Alex";

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
  startInterview: () => Promise<void>;
  loadExistingInterview: (
    interview: InterviewDto,
    stream?: MediaStream,
    id?: string,
    stage?: "new" | "continue"
  ) => void;
  handleSubmitAnswer: () => void;
  handleInterviewEnd: (closingMessage: string) => Promise<void>;
  downloadRecording: () => void;
  resetInterview: () => void;
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
  const {userDetails} = useAppContext();  
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
  const [interviewId, setInterviewId] = useState<string | null>(null);
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

  const startInterview = async () => {
    try {
      console.log("Starting interview with ID:", interviewId, "Stage:", interviewStage);

      qnaHandler.reset();
      setInterviewState("intro");
      isSubmittingRef.current = false;
      setAnswerVideos([]);
      setChunkSequence(1);

      // Start recording with already-granted stream
      await startRecording(grantedStream || undefined);
      interviewStartTime.current = Date.now();

      // Get initial question from current interview if available
      if (currentInterview) {
        const { currentQuestion: question, acknowledgement: ack } =
          qnaHandler.initialize(currentInterview);
        setCurrentQuestion(question);
        setAcknowledgement(ack);
      }

      // Navigate using stored interviewId with absolute paths
      const introPath = interviewId ? `/interview/${interviewId}/active` : "/interview/active";
      console.log("Navigating to:", introPath);
      navigate(introPath);
    } catch (err) {
      // If recording fails, reset to idle state
      console.error("Failed to start interview:", err);
      setInterviewState("idle");
      // Error is already set by useMediaRecorder hook
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
        // Clone provided stream so that unmount cleanup in InterviewIdle
        // (which stops original tracks) does not kill the recorder stream.
        const clonedTracks = stream.getTracks().map((t) => t.clone());
        const clonedStream = new MediaStream(clonedTracks);
        setGrantedStream(clonedStream);
      }

      if (id) {
        console.log("Setting interview ID:", id);
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

    const finalTranscript =
      transcript.trim() ||
      `Candidate's answer to: "${currentQuestion}" - This is a simulated transcription of the candidate's verbal response.`;

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
        const userId = userDetails?.id
        if (interviewId && currentInterview && userId) {
          const result = await qnaHandler.handleAnswerSubmission(
            interviewId,
            segment || new Blob(),
            finalTranscript,
            timestamp,
            chunkSequence,
            userId
          );

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
    handleSubmitAnswer,
    handleInterviewEnd,
    downloadRecording,
    resetInterview,
    handleQuestionStartSpeaking,
    handleQuestionEndSpeaking,
    stopListening,
    startListening,
    resetTranscript,
    captureSegment,
  };

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
};
