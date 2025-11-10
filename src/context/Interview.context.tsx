import { createContext, useContext, useState, useRef, useCallback, ReactNode } from "react";

import { useSpeechToText } from "@Hooks/useSpeechToText.hook";
import { mockInterviewAPI, resetInterviewAPI } from "@Utils/mockInterviewAPI";
import { TranscriptEntry } from "@Components/Interview/TranscriptHistory";
import { useNavigate } from "react-router-dom";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { useMediaRecorder } from "@Hooks/useMediaRecorderForVideoInterview";

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

      resetInterviewAPI();
      setInterviewState("intro");
      isSubmittingRef.current = false;
      setAnswerVideos([]);

      // Start recording with already-granted stream
      await startRecording(grantedStream || undefined);
      interviewStartTime.current = Date.now();

      const response = mockInterviewAPI();
      if (response.nextQuestion) {
        setCurrentQuestion(response.nextQuestion);
        setIsCrossQuestion(false);
        setAcknowledgement(response.acknowledgement || "");
      }

      // Navigate using stored interviewId with absolute paths
      const introPath = interviewId ? `/interview/${interviewId}/active` : "/interview/active";
      console.log("Navigating to:", introPath);
      navigate(introPath);

      /*   setTimeout(() => {
        setInterviewState("active");
        const activePath = interviewId ? `/interview/${interviewId}/active` : "/interview/active";
        console.log("Navigating to:", activePath);
        navigate(activePath);
      }, 8000); */
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
        setGrantedStream(stream);
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

      if (interview.currentQuestion) {
        setCurrentQuestion(interview.currentQuestion);
      }

      // Set up any other state based on the existing interview
      if (interview.interviewHistory) {
        const history: TranscriptEntry[] = interview.interviewHistory.map((entry) => ({
          question: entry.questionText,
          answer: entry.userAnswer,
          timestamp: entry.timeTaken,
        }));
        setTranscriptHistory(history);
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
      const segment = await captureSegment?.();
      if (segment) {
        setAnswerVideos((prev) => [...prev, segment]);
      }
    })();

    console.log("Submitting answer:", {
      transcript: finalTranscript,
      timestamp,
      question: currentQuestion,
    });

    const response = mockInterviewAPI(finalTranscript, timestamp);

    if (response.isFinal) {
      if (response.transcripts) {
        setTranscriptHistory(response.transcripts);
      }
      handleInterviewEnd(response.acknowledgement || "");
    } else if (response.nextQuestion) {
      setCurrentQuestion(response.nextQuestion);
      setIsCrossQuestion(!!response.crossQuestion);
      setAcknowledgement(response.acknowledgement || "");
      setTranscription("");
      resetTranscript();
      isSubmittingRef.current = false;
    } else {
      isSubmittingRef.current = false;
    }
  }, [transcript, currentQuestion, stopListening, resetTranscript, captureSegment, navigate]);

  const handleInterviewEnd = async (closingMessage: string) => {
    setEndMessage(closingMessage);
    setIsProcessing(true);

    const blob = await stopRecording();

    setTimeout(() => {
      setRecordedBlob(blob);
      setIsProcessing(false);
      setInterviewState("completed");
      navigate("/interview/completed");
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
    stopListening();
    resetTranscript();
    resetInterviewAPI();
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
