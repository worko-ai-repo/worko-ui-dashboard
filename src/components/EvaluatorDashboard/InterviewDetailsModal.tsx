import { InterviewHistoryResponse, InterviewItem } from "@Components/Shared/ApplicantsPage/InterviewHistorySidebar";
import InterviewSubmissionSidebar from "@Components/Shared/ApplicantsPage/InterviewSubmissionSidebar";
import { useAppContext } from "@Context/App.context";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import httpServiceObj from "@Services/ApiHandler.service";
import secureStorage from "@Utils/SecureStorage.utils";
import { getToastOptions } from "lib-worko-ui";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

interface InterviewDetailsModalProps {
  data: {
    date: string;
    time: string;
    recruiterNote: string;
    meetingLink: string;
  };
  candidateName: string;
  hrName:string;
  onClose: () => void;
  jobApplicationIdFromChild:string;
}

const InterviewDetailsModal: React.FC<InterviewDetailsModalProps> = ({
  data,
  candidateName,
  hrName,
  jobApplicationIdFromChild,
}) => {
  const userEmailAndId = secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERDETAILS) as {
    sub: string;
    email: string;
  }
  const userId = userEmailAndId.sub
  const userEmail = userEmailAndId.email
  const [listOfInterviewsData, setListOfInterviewsData] = useState<InterviewItem[]>([]);
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [isLoading,setIsLoading] = useState<boolean>(false);
  const [view, setView] = useState<"main" | "feedback">("main");
  
  const fetchAllInterviews = async() =>{
    try {
      setIsLoading(true)
      const {response, error} = await httpServiceObj.get<InterviewHistoryResponse>(`/user-job-interview/${jobApplicationIdFromChild}/interviews`,true, {}, false, "JOB")
      if(error){
        toast.error(error.message,getToastOptions({}))
        return
      }
      if (response?.data) {
        const filteredData = response.data
          .sort((a, b) => a.roundNumber - b.roundNumber)
          .filter((round: any) =>
            round?.attendees?.some(
              (att: any) =>
                att.email === userEmail &&
                att.type === "EVALUATOR"
            )
          );
        setListOfInterviewsData(filteredData);
        setActiveRoundIndex(0);
      }
    } catch (error) {
      console.error(error,"error while calling the list of interviews created by corporate or admin")
    } finally {
      setIsLoading(false)
    }
  }
  useEffect(()=>{
    fetchAllInterviews()
  },[])

  const handleSubmitFeedback = async (roundId: string, feedback: string, rating: number | null) => {
    try {
      const payload = {
        evaluator:{
          feedback,
          rating,
      }}
      const { response, error } = await httpServiceObj.patch<InterviewItem>(
        `/user-job-interview/${jobApplicationIdFromChild}/interviews/${roundId}/complete`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (error) {
        toast.error(error.message, getToastOptions({}));
        return;
      }
      setListOfInterviewsData((prev) =>
        prev.map((item) =>
          item.id === roundId
            ? {...item, ...response}
            : item
        )
      );
      setView("main");
      toast.success("Feedback Submitted",getToastOptions({}))
    } catch (error) {
      console.error(error, "Error submitting feedback");
    }
  };

  const activeRound = listOfInterviewsData?.[activeRoundIndex];
  const latestRound = listOfInterviewsData?.[listOfInterviewsData.length - 1];
  const currentEvaluator = (activeRound?.completion?.evaluators as Record<string, any>)?.[userId];
  const currentEvaluatorDetails = activeRound?.attendees?.filter(attendees => attendees.email === userEmail);

  const isLatestRound = activeRound?.roundNumber === latestRound?.roundNumber;

  const hasTimePassed =
    activeRound?.scheduledAt &&
    new Date(activeRound.scheduledAt).getTime() <= new Date().getTime();

  const showFeedbackButton =
    isLatestRound &&
    hasTimePassed &&
    activeRound?.status !== "CANCELLED" &&
    currentEvaluator === undefined;

  const canShowFeedback = useMemo(() => {
    if (!activeRound || !activeRound.scheduledAt) return false;
    const now = new Date();
    return new Date(activeRound.scheduledAt).getTime() <= now.getTime();
  }, [activeRound]);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="w-full max-w-md p-6 border border-gray-200 rounded-2xl shadow-sm bg-gray-50 animate-pulse space-y-4">
        
          <div className="h-4 w-40 bg-gray-200 rounded" />

          <div className="h-3 w-28 bg-gray-200 rounded" />

          <div className="space-y-3 mt-4">
            <div className="h-10 bg-gray-200 rounded-lg" />
            <div className="h-10 bg-gray-200 rounded-lg" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>

          <div className="h-10 w-28 bg-gray-200 rounded-lg mt-4" />
        </div>
      </div>
    );
  }

  if (!isLoading && listOfInterviewsData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">
            No interviews available
          </p>
          <p className="text-sm text-gray-500 mt-2">
            There are no interview rounds scheduled yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 space-y-6 h-full overflow-y-auto">
      {view === "feedback" && activeRound && (
          <InterviewSubmissionSidebar
            name = {candidateName}
            jobTitle={(activeRound as any)?.jobTitle || ""}
            roundId={activeRound?.id || ""}
            onClose={() => setView("main")}
            onSubmitted={({ roundId, feedback, rating }) =>
              handleSubmitFeedback(roundId, feedback, rating)
            }
          />
        )}

      {/* Header */}
      {view === "main" && (
      <>
        <div className="flex justify-start items-center border-b pb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Interview Details
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              for {candidateName}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {listOfInterviewsData?.map((round: any, index: number) => (
            <button
              key={index}
              onClick={() => setActiveRoundIndex(index)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                index === activeRoundIndex
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              }`}
            >
              Round {round.roundNumber}
            </button>
          ))}
        </div>

      <div className="space-y-3">
              {/* Round + Status */}
              {/* <div>
                <p className="text-xs font-medium text-blue-500">
                  Status & Time
                </p>

                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                      activeRound?.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : activeRound?.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {activeRound?.status}
                  </span>

                  <span className="text-sm text-gray-500">
                    {activeRound?.scheduledAt
                      ? new Date(activeRound.scheduledAt).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div> */}

              {/* Interview Type */}
              {/* <div>
                <p className="text-xs font-medium text-blue-500">Interview Type</p>
                <p className="text-sm text-gray-500">
                  {(activeRound as any)?.interviewType || "-"}
                </p>
              </div> */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                {/* Status & Time */}
                <div className="p-2 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center justify-start mb-1 gap-3">
                  <p className="text-xs font-semibold text-blue-500">
                    Status & Time
                  </p>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                      activeRound?.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : activeRound?.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {activeRound?.status}
                  </span>
                </div>
                  <p className="text-sm text-gray-500">
                    {new Date(activeRound.scheduledAt).toLocaleString()}
                  </p>
                </div>

                {/* Interview Type */}
                <div className="p-2 border border-gray-200 rounded-lg bg-white">
                  <p className="text-xs font-semibold text-blue-500 mb-1">
                    Interview Type
                  </p>

                  <p className="text-sm text-gray-500 whitespace-pre-line">
                    {activeRound.interviewType || "-"}
                  </p>
                </div>

              </div>

        {/* Rules */}
        {/* <div>
          <p className="text-xs font-medium text-blue-500">Rules</p>
          <p className="text-sm text-gray-500 whitespace-pre-line">
            {(activeRound as any)?.ruleForCandidate || "-"}
          </p>
        </div> */}

        {/* Attendees */}
        {/* {(activeRound as any)?.attendees?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-blue-500">Attendees</p>
            <ul className="mt-2 space-y-1">
              {(activeRound as any).attendees.map((a: any, index: number) => (
                <li key={index} className="text-xs text-gray-500">
                  {a.name} ({a.email})
                </li>
              ))}
            </ul>
          </div>
        )} */}

        {/* Recruiter Note */}
        {/* <div>
          <p className="text-xs font-medium text-blue-500">Recruiter Note</p>
          <p className="text-sm text-gray-500 whitespace-pre-line">
            {activeRound?.recruiterNote || "-"}
          </p>
        </div> */}

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="p-2 border border-gray-200 rounded-lg">
                    <p className="text-xs font-bold text-blue-500">Rules</p>
                    <p className="text-sm text-gray-500 whitespace-pre-line">
                      {activeRound.ruleForCandidate || "-"}
                    </p>
                  </div>
                  <div className="p-2 border border-gray-200 rounded-lg">
                    <p className="text-xs font-bold text-blue-500">Attendees</p>
                    <ul className="mt-2 space-y-1 list-disc pl-4 marker:text-black">
                      <li
                        className="text-xs text-gray-500"
                      >
                        {hrName} 
                      </li>
                      <li
                        className="text-xs text-gray-500"
                      >
                        {activeRound?.applicantName} 
                      </li>
                      {(activeRound.attendees?.length ?? 0) > 0 &&
                      (activeRound.attendees || []).map((interviewer, index) => (
                        <li
                          key={`${interviewer.email}-${index}`}
                          className="text-xs text-gray-500"
                        >
                          {interviewer.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {!activeRound?.completion?.organizer?.rating &&
                !activeRound?.completion?.organizer?.feedback &&
                !activeRound?.cancellationReason &&
                !activeRound?.cancellationFeedback &&
                <div>
                  <p className="text-xs font-bold text-blue-500">Recruiter&apos;s Note</p>
                  <p className="text-sm text-gray-500 whitespace-pre-line">
                    {activeRound.recruiterNote || "-"}
                  </p>
                </div>
                }

        {/* Meeting Link */}
        {Date.now() <= new Date(activeRound.scheduledAt).getTime() + 70 * 60 * 1000 && (
        <div>
          <p className="text-xs font-medium text-blue-500">Meeting Link</p>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500 break-all">
              {activeRound?.meetingLink || "-"}
            </span>

            <button
              type="button"
              disabled={!activeRound?.meetingLink}
              onClick={() => {
                if (!activeRound?.meetingLink) return;
                window.open(activeRound.meetingLink, "_blank");
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                activeRound?.meetingLink
                  ? "text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                  : "text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
            >
              Join
            </button>
          </div>
        </div>
        )}
        
        {/* Completed Info */}
        {activeRound?.status === "COMPLETED" && (
          // <div className="space-y-2 pt-2 border-t border-gray-200">
          //   <div>
          //     <p className="text-xs font-medium text-gray-500">Rating</p>
          //     <p className="text-sm text-gray-900">
          //       {(activeRound as any)?.completion?.organizer?.rating || "-"} / 5
          //     </p>
          //   </div>

          //   <div>
          //     <p className="text-xs font-medium text-gray-500">Feedback</p>
          //     <p className="text-sm text-gray-900 whitespace-pre-line">
          //       {(activeRound as any)?.completion?.organizer?.feedback || "-"}
          //     </p>
          //   </div>
          // </div>
          <div>
            {canShowFeedback ? (
              <div className="space-y-3 p-2 border border-gray-200 rounded-lg mt-2">
                <p className="font-extrabold text-blue-500">Recruiter/Organizer Feedback</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-medium text-black">Rating - </p>
                  <p className="text-sm text-gray-500">
                    {activeRound?.completion?.organizer?.rating} / 5
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-black">Feedback</p>
                  <p className="text-sm text-gray-500 whitespace-pre-line">
                    {activeRound?.completion?.organizer?.feedback}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Feedback will be visible once the recruiter submits it.
              </p>
            )}
          </div>
        )}

        {/* Evaluator Feedback */}
        {currentEvaluator && (
          <div className="space-y-3 pt-3 p-4 border border-gray-200 rounded-lg mt-2">
            <p className="font-extrabold text-blue-500">Evaluator Feedback</p>

            <div className="space-y-2">
              <div className="space-y-2 border-b pb-2">
                
                <div>
                  <p className="text-xs font-medium text-black">Evaluator Name</p>
                  <p className="text-sm text-gray-500">
                    {currentEvaluatorDetails[0]?.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-black">Evaluator Email</p>
                  <p className="text-sm text-gray-500">
                    {currentEvaluatorDetails[0]?.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-black">Rating</p>
                  <p className="text-sm text-gray-500">
                    {currentEvaluator.rating} / 5
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-black">Feedback</p>
                  <p className="text-sm text-gray-500 whitespace-pre-line">
                    {currentEvaluator.feedback}
                  </p>
                </div>

              </div>
            </div>
          </div>
        )}
        {/* {activeRound?.completion?.evaluators &&
          Object.keys(activeRound.completion.evaluators).length > 0 && (
            <div>
            <p className="font-extrabold">Evaluators Feedback</p>
            <div className="space-y-4 pt-2 border-t border-gray-200">
              {Object.entries(activeRound.completion.evaluators).map(
                ([userId, evaluator]: any) => (
                  <div key={userId} className="space-y-2 border-b pb-2">
                    
                    <div>
                      <p className="text-xs font-medium text-gray-500">Evaluator Name</p>
                      <p className="text-sm text-gray-900">{evaluator.name}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500">Evaluator Email</p>
                      <p className="text-sm text-gray-900">{evaluator.email}</p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500">Rating</p>
                      <p className="text-sm text-gray-900">
                        {evaluator.rating} / 5
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-500">Feedback</p>
                      <p className="text-sm text-gray-900 whitespace-pre-line">
                        {evaluator.feedback}
                      </p>
                    </div>

                  </div>
                )
              )}
            </div>
            </div>
        )} */}

        {/* Cancelled Info */}
        {activeRound?.status === "CANCELLED" && (
          <div className="space-y-2 p-2 border border-gray-200 rounded-lg">
            <div>
              <p className="text-xs font-medium text-blue-500">Cancel reason</p>
              <p className="text-sm text-gray-500">
                {(activeRound as any)?.cancellationReason || "-"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-blue-500">Cancel feedback</p>
              <p className="text-sm text-gray-500 whitespace-pre-line">
                {(activeRound as any)?.cancellationFeedback || "-"}
              </p>
            </div>
          </div>
        )}
        {showFeedbackButton &&(
          <button
            onClick={() => setView("feedback")}
            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 w-fit"
          >
            Submit feedback for Round {activeRound?.roundNumber}
          </button>
        )}
      </div>
      </>
    )}
    </div>
  );
};

export default InterviewDetailsModal;