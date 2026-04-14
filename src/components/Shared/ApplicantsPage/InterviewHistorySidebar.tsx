import React, { useEffect, useMemo, useState } from "react";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@Context/App.context";

export interface InterviewHistoryResponse {
  data: InterviewItem[];
  pagination: Pagination;
}
export interface Attendee {
  type: "EVALUATOR" | "EXTERNAL";
  userId?: string;
  email: string;
  name: string;
}

export interface Pagination {
  count: number;
  pageSize: number;
}
export interface InterviewItem {
  id: string;
  createdAt: string; // ISO date
  updatedAt: string;
  applicationId: string;
  jobId: string;
  companyId: string;
  applicantEmail: string;
  applicantName: string;
  applicantId: string;
  organizerId: string;
  organizerEmail: string;
  interviewType: string;
  jobTitle: string;
  companyName: string;
  roundNumber: number;
  status: "SCHEDULED" | "CANCELLED" | "RESCHEDULED" | "COMPLETED";
  scheduledAt: string;
  endAt: string;
  timezone: string;
  meetingProvider: string;
  meetingLink: string;
  providerEventId: string;
  attendees: Attendee[];
  completion?: {
  organizer?: {
    rating?: number;
    feedback?: string;
    submittedAt?: string;
  };
  evaluators?: {
    rating?: number;
    feedback?: string;
    submittedAt?: string;
  };
};
  recruiterNote: string;
  ruleForCandidate: string;
  updatedByUserId: string;
  cancellationReason?:string;
  cancellationFeedback?:string;
  rating?: number | null;
  feedback?:string;
}
interface InterviewHistorySidebarProps {
  jobApplication: JobApplicationDetailsDto;
  onClose: () => void;
}

const InterviewHistorySidebar: React.FC<InterviewHistorySidebarProps> = ({
  jobApplication,
  onClose,
}) => {
  const {userDetails}=useAppContext();
  const [rounds, setRounds] = useState<InterviewItem[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [activeEvaluatorId, setActiveEvaluatorId] = useState<string | null>(null);

  useEffect(() => {
    if (rounds.length > 0) {
      setActiveRoundId(rounds[0].id);
    }
  }, [rounds]);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery<{
    data: InterviewItem[];
    nextCursor: string | null;
  }>({
    queryKey: ["interviews", jobApplication.id],
    queryFn: async () => {
      return await CorporateServiceObj.getInterviewsByApplicationId(
        jobApplication.id
      );
    },
    refetchOnWindowFocus: false,
    enabled: !!jobApplication.id,
  });

  useEffect(() => {
    if (response?.data) {
      const sortedData = response.data.sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0)) 
      const enrichedItems = sortedData.map((round) => {
        const attendeeMap = Object.fromEntries(
          (round.attendees || [])
            .filter((a) => a.type === "EVALUATOR" && a.userId)
            .map((a) => [
              a.userId,
              { name: a.name, email: a.email },
            ])
        );

        const evaluators = (round.completion?.evaluators || {}) as Record<string, any>;

        const enrichedEvaluators = Object.fromEntries(
          Object.entries(evaluators).map(([userId, evalData]) => [
            userId,
            {
              ...evalData,
              name: attendeeMap[userId]?.name || null,
              email: attendeeMap[userId]?.email || null,
            },
          ])
        );

        return {
          ...round,
          completion: {
            ...round.completion,
            evaluators: enrichedEvaluators,
          },
        };
      });
      setRounds(enrichedItems);
    }
  }, [response]);

  const activeRound = useMemo(
    () => rounds.find((r) => r.id === activeRoundId) ?? null,
    [rounds, activeRoundId]
  );

  const canShowFeedback = useMemo(() => {
    if (!activeRound || !activeRound.scheduledAt) return false;
    const now = new Date();
    return new Date(activeRound.scheduledAt).getTime() <= now.getTime();
  }, [activeRound]);

  const evaluators = activeRound?.completion?.evaluators
  ? Object.entries(activeRound.completion.evaluators)
  : [];

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

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Interview History</h2>
          <p className="mt-1 text-xs text-gray-500">
            {jobApplication.applicantDetails?.name} &bull; {jobApplication.jobTitle}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {rounds.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 font-medium">No history found</p>
            <p className="text-xs text-gray-500">
              Once interview rounds are scheduled and feedback is submitted, they will appear
              here.
            </p>
          </div>
        )}

        {rounds.length > 0 && (
          <>
            <div className="flex gap-2 flex-wrap mb-3">
              {rounds.map((round) => (
                <button
                  key={round.id}
                  type="button"
                  onClick={() => setActiveRoundId(round.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    round.id === activeRoundId
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                  }`}
                >
                  Round {round.roundNumber}
                </button>
              ))}
            </div>

            {activeRound && (
              <div className="space-y-3">
                {/* <p className="text-xs font-bold text-blue-500">
                    Status & Time
                  </p> */}
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
                        {userDetails?.fullName} 
                      </li>
                      <li
                        className="text-xs text-gray-500"
                      >
                        {jobApplication?.applicantDetails?.name} 
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
                  {/* <p className="text-xs font-bold text-blue-500">Attendees</p>
                  {activeRound.attendees && activeRound.attendees.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {activeRound.attendees.map((person, index) => (
                        <li key={`${person.email}-${index}`} className="text-sm text-gray-500">
                          {person.name} ({person.email})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-900">-</p>
                  )} */}
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

                {Date.now() <= new Date(activeRound.scheduledAt).getTime() + 70 * 60 * 1000 && (
                <div>
                  {/* <p className="text-xs font-bold text-blue-500">Link</p> */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-1 items-center">
                    <p className="text-xs font-bold text-blue-500">Link - </p>
                    <span className="text-sm text-gray-500 break-all">
                      {activeRound.meetingLink || "-"}
                    </span>
                    </div>
                      <button
                        type="button"
                        disabled={!activeRound.meetingLink}
                        onClick={() => {
                          if (!activeRound.meetingLink) return;
                          window.open(activeRound.meetingLink, "_blank", "noopener,noreferrer");
                        }}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                          activeRound.meetingLink
                            ? "text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                            : "text-gray-400 border-gray-200 cursor-not-allowed"
                        }`}
                      >
                        Join
                      </button>
                  </div>
                </div>
                )}
                {/* <div>
                  <p className="text-xs font-bold text-black">Status</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                      activeRound.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {activeRound.status === "CANCELLED" ? "Cancelled" : "Scheduled"}
                  </span>
                </div> */}

                {activeRound.status === "CANCELLED" && (
                  <div className="space-y-2 p-2 border border-gray-200 rounded-lg">
                    <div>
                      <p className="text-xs font-bold text-black">Cancel reason</p>
                      <p className="text-sm text-gray-500">
                        {activeRound.cancellationReason || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">Cancel feedback</p>
                      <p className="text-sm text-gray-500 whitespace-pre-line">
                        {activeRound.cancellationFeedback || "-"}
                      </p>
                    </div>
                  </div>
                )}

                {activeRound.status === "COMPLETED" && (
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
                        Feedback will be visible once the scheduled time for this round has
                        passed.
                      </p>
                    )}
                  </div>
                )}

                {/* Evaluator Feedback */}
                {activeRound?.completion?.evaluators &&
                  Object.keys(activeRound.completion.evaluators).length > 0 && (
                    <div>
                    {/* <p className="font-extrabold text-blue-500">Evaluators Feedback</p> */}
                    <div className="space-y-4 pt-2 border-t border-gray-200">
                      <div>
                        {/* <p className="font-extrabold text-blue-500">Evaluators Feedback</p> */}
                        {/* Tabs */}
                        <div className="flex gap-2 flex-wrap mt-2">
                          {evaluators.map(([userId, evaluator]: any) => (
                            <button
                              key={userId}
                              onClick={() => setActiveEvaluatorId(userId)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                userId === (activeEvaluatorId || evaluators[0][0])
                                  ? "bg-indigo-600 text-white border-indigo-600"
                                  : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                              }`}
                            >
                              {evaluator.name || "Evaluator"}
                            </button>
                          ))}
                        </div>

                        {/* Details */}
                        <div className="space-y-3 pt-3 p-4 border border-gray-200 rounded-lg mt-2">
                          {evaluators
                            .filter(([userId]) =>
                              userId === (activeEvaluatorId ?? evaluators[0]?.[0])
                            )
                            .map(([userId, evaluator]: any) => (
                              <div key={userId} className="space-y-2">
                                <p className="font-extrabold text-blue-500">Evaluator Feedback</p>
                                <div>
                                  <p className="text-xs font-medium text-black">Evaluator Name</p>
                                  <p className="text-sm text-gray-500">{evaluator.name}</p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-black">Evaluator Email</p>
                                  <p className="text-sm text-gray-500">{evaluator.email}</p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-black">Rating</p>
                                  <p className="text-sm text-gray-500">
                                    {evaluator.rating} / 5
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-black">Feedback</p>
                                  <p className="text-sm text-gray-500 whitespace-pre-line">
                                    {evaluator.feedback}
                                  </p>
                                </div>

                              </div>
                            ))}
                        </div>
                      </div>
                      {/* {Object.entries(activeRound.completion.evaluators).map(
                        ([userId, evaluator]: any) => (
                          <div key={userId} className="space-y-2 border-b pb-2">
                            
                            <div className="flex items-center gap-1">
                              <p className="text-xs font-medium text-black">Evaluator Name - </p>
                              <p className="text-sm text-gray-500">{evaluator.name}</p>
                            </div>

                            <div className="flex items-center gap-1">
                              <p className="text-xs font-medium text-black">Evaluator Email - </p>
                              <p className="text-sm text-gray-500">{evaluator.email}</p>
                            </div>

                            <div className="flex items-center gap-1">
                              <p className="text-xs font-medium text-black">Rating - </p>
                              <p className="text-sm text-gray-500">
                                {" "}{evaluator.rating} / 5
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-medium text-black">Feedback</p>
                              <p className="text-sm text-gray-500 whitespace-pre-line">
                                {evaluator.feedback}
                              </p>
                            </div>

                          </div>
                        )
                      )} */}
                    </div>
                    </div>
                )}
                <div className="px-3 py-4 flex justify-end border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewHistorySidebar;

