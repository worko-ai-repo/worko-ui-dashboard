import { useState, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@Components/ui/card";
import { Button } from "@Components/ui/button";
import { IntroCard } from "@Components/Interview/IntroCard";
import { RecorderStatus } from "@Components/Interview/RecorderStatus";
import { QuestionDisplay } from "@Components/Interview/QuestionDisplay";
import { SubmitAnswerButton } from "@Components/Interview/SubmitAnswerButton";
import { EndMessage } from "@Components/Interview/EndMessage";
import { TranscriptHistory, TranscriptEntry } from "@Components/Interview/TranscriptHistory";
import { useMediaRecorder } from "@Hooks/useMediaRecorder";
import { useSpeechToText } from "@Hooks/useSpeechToText.hook";
import { mockInterviewAPI, resetInterviewAPI } from "@Utils/mockInterviewAPI";
import { Play, Mic } from "lucide-react";

type InterviewState = "idle" | "intro" | "active" | "completed";

function Interview() {
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

  const interviewStartTime = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);

  const { isRecording, startRecording, stopRecording, error } = useMediaRecorder();
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
    // Start transcription when question starts being spoken
    if (isSpeechSupported && !isListening) {
      resetTranscript();
      startListening();
      setIsTranscribing(true);
    }
  }, [isSpeechSupported, isListening, resetTranscript, startListening]);

  const handleQuestionEndSpeaking = useCallback(() => {
    // Keep transcription running after question ends so user can answer
    // The transcription will continue until user submits answer
  }, []);

  const startInterview = async () => {
    resetInterviewAPI();
    setInterviewState("intro");
    isSubmittingRef.current = false;

    await startRecording();
    interviewStartTime.current = Date.now();

    const response = mockInterviewAPI();
    if (response.nextQuestion) {
      setCurrentQuestion(response.nextQuestion);
      setIsCrossQuestion(false);
      setAcknowledgement(response.acknowledgement || "");
    }

    setTimeout(() => {
      setInterviewState("active");
    }, 3000);
  };

  const handleSubmitAnswer = useCallback(() => {
    // Prevent multiple simultaneous submissions
    if (isSubmittingRef.current) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }

    isSubmittingRef.current = true;
    const timestamp = Date.now() - interviewStartTime.current;

    // Stop transcription and use the real transcript
    stopListening();
    setIsTranscribing(false);

    // Use real transcript if available, otherwise fallback to mock
    const finalTranscript =
      transcript.trim() ||
      `Candidate's answer to: "${currentQuestion}" - This is a simulated transcription of the candidate's verbal response.`;

    setTranscription(finalTranscript);

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
      // Reset transcript for next question
      resetTranscript();
      // Reset submission flag
      isSubmittingRef.current = false;
    } else {
      // Reset submission flag if no next question
      isSubmittingRef.current = false;
    }
  }, [transcript, currentQuestion, stopListening, resetTranscript]);

  const handleInterviewEnd = async (closingMessage: string) => {
    setEndMessage(closingMessage);
    setIsProcessing(true);

    const blob = await stopRecording();

    setTimeout(() => {
      setRecordedBlob(blob);
      setIsProcessing(false);
      setInterviewState("completed");
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
    setIsTranscribing(false);
    stopListening();
    resetTranscript();
    resetInterviewAPI();
    isSubmittingRef.current = false;
  };

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-4xl mx-auto py-8">
        {interviewState === "idle" && (
          <Card className="bg-white border-blue-200">
            <CardHeader>
              <CardTitle className="text-3xl text-center text-black">
                AI Mock Interview Simulator
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-700 text-lg">
                  Practice your interview skills with AI-powered questions and continuous recording.
                </p>
                <p className="text-sm text-gray-600">
                  Your webcam, microphone, and screen will be recorded throughout the interview.
                </p>
                {(error || speechError) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                    {error || speechError}
                  </div>
                )}
                {!isSpeechSupported && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-600 text-sm">
                    Speech recognition is not supported in this browser. You can still use the
                    interview, but transcription will be simulated.
                  </div>
                )}
                <Button
                  onClick={startInterview}
                  size="lg"
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                  <Play className="w-5 h-5 mr-2" />
                  Start Interview
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {(interviewState === "intro" || interviewState === "active") && (
          <>
            <RecorderStatus isRecording={isRecording} />

            {interviewState === "intro" && <IntroCard />}

            {interviewState === "active" && (
              <>
                {acknowledgement && (
                  <Card className="mb-6 border-blue-300 bg-blue-50">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-black">{acknowledgement}</p>
                    </CardContent>
                  </Card>
                )}

                <QuestionDisplay
                  question={currentQuestion}
                  isCrossQuestion={isCrossQuestion}
                  onQuestionStartSpeaking={handleQuestionStartSpeaking}
                  onQuestionEndSpeaking={handleQuestionEndSpeaking}
                />

                {isTranscribing && transcript && (
                  <Card className="mb-6 border-green-300 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
                          <Mic className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-600 mb-1">
                            Live Transcript
                          </p>
                          <p className="text-sm leading-relaxed text-black">{transcript}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <SubmitAnswerButton
                  onClick={handleSubmitAnswer}
                  disabled={isSubmittingRef.current}
                />
              </>
            )}
          </>
        )}

        {interviewState === "completed" && (
          <>
            <EndMessage
              message={endMessage}
              onDownload={recordedBlob ? downloadRecording : undefined}
              isProcessing={isProcessing}
            />

            {!isProcessing && <TranscriptHistory transcripts={transcriptHistory} />}

            {!isProcessing && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={resetInterview}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  Start New Interview
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Interview;
