import { Card, CardContent } from "@Components/ui/card";
import { RecorderStatus } from "@Components/Interview/RecorderStatus";
import { QuestionDisplay } from "@Components/Interview/QuestionDisplay";
import { SubmitAnswerButton } from "@Components/Interview/SubmitAnswerButton";
import { Mic, LogOut, AlertTriangle } from "lucide-react";
import { useInterview } from "../../../context/Interview.context";
import { logo_text } from "@AssetsFolder/assets";
import InterviewAIAgent from "@Components/Interview/InterviewAIAgent";
import { useRef, useEffect, useState } from "react";
import Modal from "@Components/Shared/Modal";
import { Button } from "@Components/ui/button";
import interviewServiceObj from "@Services/Interview.service";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { useAppContext } from "@Context/App.context";
import { useNavigate } from "react-router-dom";

const InterviewActive = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const { userDetails } = useAppContext();

  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isTerminating, setIsTerminating] = useState(false);
  const hasTerminatedRef = useRef(false);
  const tabSwitchDetectedRef = useRef(false);

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
    interviewId,
    resetInterview,
  } = useInterview();

  // Detect tab visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      // User switched away from the tab
      if (document.hidden && !hasTerminatedRef.current) {
        tabSwitchDetectedRef.current = true;
      }
      // User came back to the tab after switching
      else if (!document.hidden && tabSwitchDetectedRef.current && !hasTerminatedRef.current) {
        hasTerminatedRef.current = true;
        // Show the violation modal - API will be called by the useEffect watching showTabSwitchWarning
        setShowTabSwitchWarning(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [interviewId, userDetails]);

  // Warn user before closing/refreshing page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasTerminatedRef.current) {
        e.preventDefault();
        e.returnValue = "Interview in progress. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // API call function to terminate interview
  const terminateInterviewAPI = async () => {
    if (!interviewId || !userDetails?.email) return;

    setIsTerminating(true);

    try {
      const { error } = await interviewServiceObj.updateInterviewStatus(interviewId, {
        candidateEmail: userDetails.email,
        status: "CLOSED",
      });

      if (error) {
        console.error("Error updating interview status:", error);
      }
    } catch (error) {
      console.error("Error terminating interview:", error);
    } finally {
      setIsTerminating(false);
    }
  };

  const handleTerminateInterview = async () => {
    if (!interviewId || !userDetails?.email || hasTerminatedRef.current) return;

    hasTerminatedRef.current = true;
    await terminateInterviewAPI();

    toast.warning(
      "Interview session terminated. You will not be able to take this interview again for 3 months.",
      getToastOptions({ autoClose: 6000 })
    );

    setTimeout(() => {
      resetInterview();
      navigate("/v1/candidate/profiles", { replace: true });
    }, 2000);
  };

  const handleExitClick = () => {
    setShowExitConfirmation(true);
  };

  const handleConfirmExit = async () => {
    setShowExitConfirmation(false);
    await handleTerminateInterview();
  };

  const handleTabSwitchAcknowledge = () => {
    setShowTabSwitchWarning(false);

    toast.warning(
      "Interview session terminated. You will not be able to take this interview again for 3 months.",
      getToastOptions({ autoClose: 6000 })
    );

    setTimeout(() => {
      resetInterview();
      navigate("/v1/candidate/profiles", { replace: true });
    }, 1000);
  };

  // Auto-fire API when tab switch warning modal opens
  useEffect(() => {
    if (showTabSwitchWarning === true && !isTerminating) {
      console.log("Tab switch detected - calling API to terminate interview");
      terminateInterviewAPI();
    }
  }, [showTabSwitchWarning]);

  // Auto-fire API when exit confirmation modal opens
  useEffect(() => {
    if (showExitConfirmation === true && !hasTerminatedRef.current) {
      console.log("Exit button clicked - calling API to terminate interview");
      hasTerminatedRef.current = true;
      terminateInterviewAPI();
    }
  }, [showExitConfirmation]);

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
        <div className="relative w-full flex items-center justify-between px-4 py-2">
          <img src={logo_text} alt="Worko" className="mx-auto h-8 sm:h-10 md:h-12 object-contain" />
          <Button
            onClick={handleExitClick}
            variant="outline"
            className="
            absolute right-4
            ml-auto border-red-500 text-red-500 hover:bg-red-50 flex items-center gap-2"
            disabled={isTerminating}>
            <LogOut className="w-4 h-4" />
            Exit Interview
          </Button>
        </div>
      </div>

      <div className="max-w-6xl max-sm:max-w-[90vw] space-y-4 mx-auto px-4 py-4">
        <div className="flex justify-between">
          <RecorderStatus isRecording={isRecording} isTranscribing={isTranscribing} />
          <SubmitAnswerButton onClick={handleSubmitAnswer} disabled={isSubmittingRef.current} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 w-full gap-6 mb-4">
          <div className="w-full border border-blue-200 max-h-[300px] rounded-3xl shadow-2xl overflow-hidden">
            <InterviewAIAgent />
          </div>
          <div className="w-full  max-h-[300px] rounded-3xl shadow-2xl overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <QuestionDisplay
          question={currentQuestion}
          isCrossQuestion={isCrossQuestion}
          onQuestionStartSpeaking={handleQuestionStartSpeaking}
          onQuestionEndSpeaking={handleQuestionEndSpeaking}
        />
      </div>

      {/* Tab Switch Warning Modal */}
      <Modal isOpen={showTabSwitchWarning} onClose={() => {}} className="w-[90vw] sm:max-w-md">
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Session Terminated</h2>
          <p className="text-gray-600 mb-6">
            You switched to another tab or window during the interview. As per our guidelines, this
            is not allowed. Your interview session has been terminated.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 font-semibold">
              ⚠️ You will not be able to take this interview again for 3 months.
            </p>
          </div>
          <Button
            onClick={handleTabSwitchAcknowledge}
            disabled={isTerminating}
            className="w-full bg-red-600 hover:bg-red-700 text-white">
            I Understand
          </Button>
        </div>
      </Modal>

      {/* Exit Confirmation Modal */}
      <Modal
        isOpen={showExitConfirmation}
        onClose={() => !isTerminating && setShowExitConfirmation(false)}
        className="w-[90vw] sm:max-w-md">
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exit Interview?</h2>
          <p className="text-gray-600 mb-4">
            Are you sure you want to exit? The interview is still in progress.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-red-800 font-semibold mb-2">⚠️ Important Consequences:</p>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Your interview will be marked as incomplete</li>
              <li>• No scores will be generated</li>
              <li>• Your answers will not be evaluated</li>
              <li>• You cannot retake this interview for 3 months</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowExitConfirmation(false)}
              variant="outline"
              disabled={isTerminating}
              className="flex-1">
              Continue Interview
            </Button>
            <Button
              onClick={handleConfirmExit}
              disabled={isTerminating}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white">
              {isTerminating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Exiting...
                </>
              ) : (
                "Exit Anyway"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InterviewActive;
