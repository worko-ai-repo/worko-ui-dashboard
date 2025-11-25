import { useInterview } from "../../../context/Interview.context";
import { logo_text } from "@AssetsFolder/assets";
import InterviewCompletionFeedback from "@Components/Interview/InterviewCompletionFeedback";
import { useNavigate, useParams } from "react-router-dom";


const InterviewCompleted = () => {
  const {
    isProcessing,
    interviewId: contextInterviewId,
  } = useInterview();
  
  const { id: pathInterviewId } = useParams<{ id: string }>();
  const interviewId = contextInterviewId || pathInterviewId;
  
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="w-full">
        <img src={logo_text} alt="Worko" className=" mx-auto h-8 sm:h-10 md:h-12 object-contain" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* <EndMessage
          message={endMessage}
          onDownload={recordedBlob ? downloadRecording : undefined}
          isProcessing={isProcessing}
        /> */}
        {!isProcessing && interviewId && (
          <InterviewCompletionFeedback interviewId={interviewId} onComplete={() =>
            window.location.href = `/${import.meta.env.APP_PROXY_DASH}/candidate/profile`
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
