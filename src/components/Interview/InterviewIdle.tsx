import { useInterview } from "@Context/Interview.context";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useSearchParams } from "react-router-dom";


const InterviewIdle: React.FC = () => {
  const {
    loadExistingInterview,
    stream,
    currentInterview,
    interviewId: contextInterviewId,
  } = useInterview();
  const location = useLocation();
  const { interviewData } = (location.state as { interviewData?: InterviewDto }) || {};
  const { id: interviewIdFromUrl } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const stage = searchParams.get("stage") as "continue" | null;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("InterviewIdle mounted with:", {
      interviewIdFromUrl,
      hasInterviewData: !!interviewData,
      hasStream: !!stream,
      stage,
      contextInterviewId,
      hasCurrentInterview: !!currentInterview,
    });

    // If we have interview data from navigation state and haven't loaded it yet
    if (interviewData && interviewIdFromUrl && !currentInterview) {
      console.log("Loading interview data into context...");
      loadExistingInterview(interviewData, stream || undefined, interviewIdFromUrl, stage || "new");
    }

    setIsLoading(false);
  }, [
    interviewData,
    stream,
    loadExistingInterview,
    interviewIdFromUrl,
    stage,
    currentInterview,
    contextInterviewId,
  ]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Your component JSX here */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Interview Ready</h1>
          <p className="text-gray-600">Interview ID: {contextInterviewId || interviewIdFromUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default InterviewIdle;
