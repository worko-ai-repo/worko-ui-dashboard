import { Button } from "@Components/ui/button";
import { EndMessage } from "@Components/Interview/EndMessage";
import { TranscriptHistory } from "@Components/Interview/TranscriptHistory";
import { useInterview } from "../../../context/Interview.context";
import { logo_text } from "@AssetsFolder/assets";
import InterviewCompletionFeedback from "@Components/Interview/InterviewCompletionFeedback";
import { useNavigate } from "react-router-dom";


const InterviewCompleted = () => {
  const {
    endMessage,
    recordedBlob,
    isProcessing,
    transcriptHistory,
    answerVideos,
    downloadRecording,
    resetInterview,
    interviewId,
  } = useInterview();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="w-full bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <img src={logo_text} alt="Worko" className="h-8 sm:h-10 md:h-12 object-contain" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* <EndMessage
          message={endMessage}
          onDownload={recordedBlob ? downloadRecording : undefined}
          isProcessing={isProcessing}
        /> */}
        {!isProcessing && interviewId && (
          <InterviewCompletionFeedback interviewId={interviewId} onComplete={() =>
            nav("v1/candidate/profiles", { replace: true })
          } />
          // <TranscriptHistory transcripts={transcriptHistory} answerVideos={answerVideos} />
        )}

        {/* {!isProcessing && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={resetInterview}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50">
              Take Another Interview
            </Button>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default InterviewCompleted;
