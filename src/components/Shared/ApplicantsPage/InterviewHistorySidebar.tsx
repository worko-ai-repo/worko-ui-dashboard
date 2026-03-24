import React, { useMemo, useState } from "react";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";

interface InterviewHistorySidebarProps {
  jobApplication: JobApplicationDetailsDto;
  onClose: () => void;
  rounds?: HistoryRound[];
}

export interface HistoryRound {
  id: string;
  roundNumber: number;
  scheduledAt: Date | null;
  feedback?: string;
  rating?: number | null;
  interviewType?: string;
  recruiterNote?: string;
  rules?: string;
  extraInterviewers?: { name: string; email: string }[];
  joiningLink?:string;
  interviewStatus?: "SCHEDULED" | "CANCELLED";
  cancelReason?: string;
  cancelFeedback?: string;
}

const InterviewHistorySidebar: React.FC<InterviewHistorySidebarProps> = ({
  jobApplication,
  onClose,
  rounds: roundsProp,
}) => {
  const rounds = roundsProp ?? [];

  const [activeRoundId, setActiveRoundId] = useState<string | null>(
    rounds.length ? rounds[0].id : null
  );

  const activeRound = useMemo(
    () => rounds.find((r) => r.id === activeRoundId) ?? null,
    [rounds, activeRoundId]
  );

  const canShowFeedback = useMemo(() => {
    if (!activeRound || !activeRound.scheduledAt) return false;
    const now = new Date();
    return activeRound.scheduledAt.getTime() <= now.getTime();
  }, [activeRound]);

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
                <div>
                  <p className="text-xs font-bold text-black">Scheduled at</p>
                  <p className="text-sm text-gray-500">
                    {activeRound.scheduledAt
                      ? activeRound.scheduledAt.toLocaleString()
                      : "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-black">Interview Type</p>
                  <p className="text-sm text-gray-500 whitespace-pre-line">
                    {activeRound.interviewType || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-black">Recruiter&apos;s Note</p>
                  <p className="text-sm text-gray-500 whitespace-pre-line">
                    {activeRound.recruiterNote || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-black">Rules</p>
                  <p className="text-sm text-gray-500 whitespace-pre-line">
                    {activeRound.rules || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-black">Extra interviewers</p>
                  {activeRound.extraInterviewers && activeRound.extraInterviewers.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {activeRound.extraInterviewers.map((person, index) => (
                        <li key={`${person.email}-${index}`} className="text-sm text-gray-500">
                          {person.name} ({person.email})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-900">-</p>
                  )}
                </div>
                
                <div>
                  <p className="text-xs font-bold text-black">Link</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-500 break-all">
                      {activeRound.joiningLink || "-"}
                    </span>
                    <button
                      type="button"
                      disabled={!activeRound.joiningLink}
                      onClick={() => {
                        if (!activeRound.joiningLink) return;
                        window.open(activeRound.joiningLink, "_blank", "noopener,noreferrer");
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                        activeRound.joiningLink
                          ? "text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                          : "text-gray-400 border-gray-200 cursor-not-allowed"
                      }`}
                    >
                      Join
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold text-black">Status</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                      activeRound.interviewStatus === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}
                  >
                    {activeRound.interviewStatus === "CANCELLED" ? "Cancelled" : "Scheduled"}
                  </span>
                </div>

                {activeRound.interviewStatus === "CANCELLED" && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div>
                      <p className="text-xs font-bold text-black">Cancel reason</p>
                      <p className="text-sm text-gray-500">{activeRound.cancelReason || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-black">Cancel feedback</p>
                      <p className="text-sm text-gray-500 whitespace-pre-line">
                        {activeRound.cancelFeedback || "-"}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  {/* <p className="text-xs font-bold text-black">Feedback</p> */}
                  {canShowFeedback ? (
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <p className="text-xs font-bold text-black">Rating - </p>
                        <p className="text-sm text-gray-500">
                          {typeof activeRound.rating === "number" ? activeRound.rating : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-black">Feedback</p>
                        <p className="text-sm text-gray-500 whitespace-pre-line">
                          {activeRound.feedback || "No feedback submitted yet."}
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewHistorySidebar;

