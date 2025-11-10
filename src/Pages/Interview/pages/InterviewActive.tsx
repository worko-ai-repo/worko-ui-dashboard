import { Card, CardContent } from "@Components/ui/card";
import { RecorderStatus } from "@Components/Interview/RecorderStatus";
import { QuestionDisplay } from "@Components/Interview/QuestionDisplay";
import { SubmitAnswerButton } from "@Components/Interview/SubmitAnswerButton";
import { Mic } from "lucide-react";
import { useInterview } from "../../../context/Interview.context";
import { logo_text } from "@AssetsFolder/assets";
import InterviewAIAgent from "@Components/Interview/InterviewAIAgent";
import { useRef, useEffect } from "react";

const InterviewActive = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const {
    isRecording,
    isTranscribing,
    acknowledgement,
    currentQuestion,
    isCrossQuestion,
    transcript,
    handleQuestionStartSpeaking,
    handleQuestionEndSpeaking,
    handleSubmitAnswer,
    isSubmittingRef,
  } = useInterview();

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b bg-white">
      {/* Header */}
      <div className="w-full bg-white shadow-sm">
        {/* Header */}
        <div className="w-full">
          <img
            src={logo_text}
            alt="Worko"
            className=" mx-auto h-8 sm:h-10 md:h-12 object-contain"
          />
        </div>
      </div>

      <div className="max-w-6xl max-sm:max-w-[90vw] space-y-4 mx-auto px-4 py-4">
        <RecorderStatus isRecording={isRecording} isTranscribing={isTranscribing} />

        <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-6 mb-4">
          <div className="w-full border border-blue-200 max-h-[300px] rounded-3xl shadow-2xl overflow-hidden">
            <InterviewAIAgent />
          </div>
          <div className="w-full  max-h-[300px] rounded-3xl shadow-2xl overflow-hidden bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
        </div>

        <QuestionDisplay
          question={currentQuestion}
          isCrossQuestion={isCrossQuestion}
          onQuestionStartSpeaking={handleQuestionStartSpeaking}
          onQuestionEndSpeaking={handleQuestionEndSpeaking}
        />
        <SubmitAnswerButton onClick={handleSubmitAnswer} disabled={isSubmittingRef.current} />
      </div>
    </div>
  );
};

export default InterviewActive;
