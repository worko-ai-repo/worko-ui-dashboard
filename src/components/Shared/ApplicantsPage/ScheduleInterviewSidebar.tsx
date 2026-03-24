import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { Info } from "lucide-react";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";

interface ExtraInterviewer {
  name: string;
  email: string;
}

export interface InterviewRound {
  id: string;
  roundNumber: number;
  scheduledAt: Date | null;
  interviewType: string;
  recruiterNote?: string;
  rules: string;
  extraInterviewers: ExtraInterviewer[];
  feedbackSubmitted?: boolean;
  feedbackNotes?: string;
  feedbackRating?: number | null;
  joiningLink?:string;
  interviewStatus?: "SCHEDULED" | "CANCELLED";
  cancelReason?: string;
  cancelFeedback?: string;
  cancelledAt?: Date | null;
  customInterviewType?: string;
}

type RoundDraftSchedule = {
  date: Date | null;
  time: string;
};

interface ScheduleInterviewSidebarProps {
  jobApplication: JobApplicationDetailsDto;
  onClose: () => void;
  /**
   * Optional existing rounds from API once available
   */
  existingRounds?: InterviewRound[];
  onRoundsChange?: (rounds: InterviewRound[]) => void;
  /**
   * Opens feedback sidebar for a specific round
   */
  onOpenFeedbackSidebar?: (roundId: string) => void;
  onOpenCancelSidebar?: () => void;
  onOpenRescheduleSidebar?: () => void;
}

export const ScheduleInterviewSidebar: React.FC<ScheduleInterviewSidebarProps> = ({
  jobApplication,
  onClose,
  existingRounds = [],
  onOpenFeedbackSidebar,
  onRoundsChange,
  onOpenCancelSidebar,
  onOpenRescheduleSidebar,
}) => {
  const [rounds, setRounds] = useState<InterviewRound[]>(() => {
    if (!existingRounds.length) {
      return [
        {
          id: "round-1",
          roundNumber: 1,
          scheduledAt: null,
          interviewType: "",
          rules: "",
          extraInterviewers: [],
          feedbackSubmitted: false,
        },
      ];
    }

    return existingRounds;
  });

  const [activeRoundId, setActiveRoundId] = useState<string>(rounds[0]?.id);
  const activeRound = useMemo(
    () => rounds.find((r) => r.id === activeRoundId) ?? rounds[0],
    [rounds, activeRoundId]
  );
  const latestRound = useMemo(
    () => (rounds.length ? rounds[rounds.length - 1] : null),
    [rounds]
  );
  const isActiveLatestRound = !!activeRound && !!latestRound && activeRound.id === latestRound.id;
  const isDraftLatestRound = isActiveLatestRound && !latestRound?.scheduledAt;

  const [extraInterviewerName, setExtraInterviewerName] = useState("");
  const [extraInterviewerEmail, setExtraInterviewerEmail] = useState("");
  const [draftScheduleByRoundId, setDraftScheduleByRoundId] = useState<
    Record<string, RoundDraftSchedule>
  >(() => {
    const initial: Record<string, RoundDraftSchedule> = {};
    (existingRounds.length ? existingRounds : rounds).forEach((r) => {
      initial[r.id] = { date: null, time: "" };
    });
    return initial;
  });

  const now = useMemo(() => new Date(), []);
  const [isReschedulingLatestRound, setIsReschedulingLatestRound] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [evaluatorSuggestions, setEvaluatorSuggestions] = useState<
    { email: string; name: string }[]
  >([]);

  const [filteredSuggestions, setFilteredSuggestions] = useState<
    { email: string; name: string }[]
  >([]);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const handleEmailChange = (value: string) => {
    setExtraInterviewerEmail(value);

    // existing validation
    if (!value) {
      setEmailError("");
      setFilteredSuggestions([]);
    } else if (!isValidEmail(value)) {
      setEmailError("Invalid email");
    } else {
      setEmailError("");
    }

    // ✅ filter suggestions (email only)
    const filtered = evaluatorSuggestions.filter((e) =>
      e.email.toLowerCase().includes(value.toLowerCase())
    );

    setFilteredSuggestions(filtered);
  };

  useEffect(() => {
    const fetchEvaluationResponses = async () => {
      try {
        if (!jobApplication?.id) return;

        const response = await CorporateServiceObj.getEvaluationResponses({
          jobApplicationId: jobApplication.id,
        });

        if (!response?.data) return;

        const cleaned = response.data
          .map((evaluator) => ({
            email: evaluator?.createdByUserEmail?.trim(),
            name: evaluator?.evaluatorName?.trim(),
          }))
          .filter((e) => e.email); // remove invalid

        setEvaluatorSuggestions(cleaned);
      } catch (error) {
        console.error("Error fetching evaluation responses:", error);
      }
    };

    fetchEvaluationResponses();
  }, [jobApplication?.id]);

  const handleSelectSuggestion = (suggestion: {
    email: string;
    name: string;
  }) => {
    setExtraInterviewerEmail(suggestion.email);
    setExtraInterviewerName(suggestion.name);

    // ✅ FIX: revalidate email
    if (!isValidEmail(suggestion.email)) {
      setEmailError("Invalid email");
    } else {
      setEmailError("");
    }

    setFilteredSuggestions([]);
  };

  const getTimeValue = (d: Date | null) => {
    if (!d) return "";
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const setDraftDate = (roundId: string, date: Date | null) => {
    setDraftScheduleByRoundId((prev) => ({
      ...prev,
      [roundId]: {
        date,
        time: prev[roundId]?.time ?? "",
      },
    }));
  };

  const setDraftTime = (roundId: string, time: string) => {
    setDraftScheduleByRoundId((prev) => ({
      ...prev,
      [roundId]: {
        date: prev[roundId]?.date ?? null,
        time,
      },
    }));
  };

  const buildScheduledAtFromDraft = (roundId: string): Date | null => {
    const draft = draftScheduleByRoundId[roundId];
    if (!draft?.date || !draft?.time) return null;
    const [hh, mm] = draft.time.split(":").map((v) => Number(v));
    const next = new Date(draft.date);
    next.setHours(hh || 0, mm || 0, 0, 0);
    return next;
  };

  const handleRoundFieldChange = (patch: Partial<InterviewRound>) => {
    if (!activeRound) return;
    setRounds((prev) =>
      prev.map((round) => (round.id === activeRound.id ? { ...round, ...patch } : round))
    );
  };

  const handleAddInterviewer = () => {
    if (!activeRound) return;
    if (!extraInterviewerName.trim() || !extraInterviewerEmail.trim()) {
      return;
    }
    if (!isValidEmail(extraInterviewerEmail)) {
      setEmailError("Invalid email");
      return;
    }
    setRounds((prev) =>
      {
        const updated = prev.map((round) =>
          round.id === activeRound.id
            ? {
                ...round,
                extraInterviewers: [
                  ...round.extraInterviewers,
                  {
                    name: extraInterviewerName.trim(),
                    email: extraInterviewerEmail.trim(),
                  },
                ],
              }
            : round
        );
        return updated;
      }
    );

    setExtraInterviewerName("");
    setExtraInterviewerEmail("");
  };

  const canAddNextRound = useMemo(() => {
    if (!rounds.length) return false;
    const lastRound = rounds[rounds.length - 1];
    if (lastRound.interviewStatus === "CANCELLED") return true;
    if (!lastRound.scheduledAt) return false;
    const now = new Date();
    const timePassed = lastRound.scheduledAt.getTime() <= now.getTime();
    return Boolean(lastRound.feedbackSubmitted && timePassed);
  }, [rounds]);

  const latestJoinLink = useMemo(() => {
    if (!rounds.length) return "";
    const latest = rounds[rounds.length - 1];
    return latest.joiningLink || "";
  }, [rounds]);

  const handleJoin = () => {
    if (!latestJoinLink) return;
    window.open(latestJoinLink, "_blank", "noopener,noreferrer");
  };

  const handleRescheduleLatestRound = () => {
    if (!latestRound) return;
    const scheduledAt = buildScheduledAtFromDraft(latestRound.id);
    if (!scheduledAt) return;

    const updatedRounds = rounds.map((round) =>
      round.id === latestRound.id
        ? {
            ...round,
            scheduledAt,
          }
        : round
    );

    setRounds(updatedRounds);
    onRoundsChange?.(updatedRounds);
    setIsReschedulingLatestRound(false);
  };

  const handleAddNextRound = () => {
    if (!canAddNextRound) return;
    const nextNumber = rounds.length + 1;
    const id = `round-${nextNumber}`;
    const newRound: InterviewRound = {
      id,
      roundNumber: nextNumber,
      scheduledAt: null,
      interviewType: "",
      rules: "",
      extraInterviewers: [],
      feedbackSubmitted: false,
    };
    setRounds((prev) => [...prev, newRound]);
    setDraftScheduleByRoundId((prev) => ({
      ...prev,
      [id]: { date: null, time: "" },
    }));
    setActiveRoundId(id);
  };

  const removeDuplicateInterviewersByEmail = (interviewers: ExtraInterviewer[]) => {
    const seen = new Set<string>();

    return interviewers.filter((interviewer) => {
      const email = interviewer.email.toLowerCase().trim();

      if (seen.has(email)) {
        return false; //  remove duplicate
      }

      seen.add(email);
      return true; //  keep first
    });
  };

  const handleSubmitAll = () => {
      if (activeRound) {
        const scheduledAt = buildScheduledAtFromDraft(activeRound.id);

      if (scheduledAt && scheduledAt.getTime() < new Date().getTime()) {
        toast.error("Selected date and time cannot be in the past",getToastOptions({}));
        return;
        }
      }

      // Identify latest round
      const latestRoundId = rounds[rounds.length - 1]?.id;

      // Clean duplicates ONLY in latest round
      const cleanedRounds = rounds.map((round) => {
        if (round.id !== latestRoundId) return round;

        return {
          ...round,
          extraInterviewers: removeDuplicateInterviewersByEmail(
            round.extraInterviewers
          ),
        };
      });

    // Commit only unscheduled rounds that have valid draft date+time
    const committedRounds = cleanedRounds.map((r) => {
      if (r.scheduledAt) return r;
      const scheduledAt = buildScheduledAtFromDraft(r.id);
      if (!scheduledAt) return r;
      return {
        ...r,
        scheduledAt,
      };
    });

    const payload = {
      jobApplicationId: jobApplication.id,
      jobId: jobApplication.jobId,
      applicantName: jobApplication.applicantDetails?.name,
      applicantEmail: jobApplication.applicantDetails?.email,
      rounds: committedRounds.map((round) => ({
        roundNumber: round.roundNumber,
        scheduledAt: round.scheduledAt,
        interviewType: round.interviewType === "__OTHER__"
                      ? (round.customInterviewType || "").trim()
                      : round.interviewType.trim(),
        recruiterNote: (round.recruiterNote ?? "").trim(),
        rules: round.rules.trim(),
        extraInterviewers: round.extraInterviewers,
        feedbackSubmitted: round.feedbackSubmitted ?? false,
        feedbackNotes: round.feedbackNotes ?? "",
        feedbackRating: round.feedbackRating ?? null,
      })),
    };

    // Placeholder for future API integration
    // Replace this console.log with API call when ready
    // e.g. AdminServiceObj.scheduleInterviewRounds(payload)
    // or interviewService.scheduleInterviewRounds(payload)
    // eslint-disable-next-line no-console
    console.log("Schedule Interview Rounds Payload:", payload);

    onRoundsChange?.(committedRounds);
    onClose();
  };

  useEffect(() => {
    if (existingRounds.length === 0) return;
    setRounds(existingRounds);
    setDraftScheduleByRoundId((prev) => {
      const next = { ...prev };
      existingRounds.forEach((r) => {
        if (!next[r.id]) next[r.id] = { date: null, time: "" };
      });
      return next;
    });
    if (!existingRounds.some((r) => r.id === activeRoundId)) {
      setActiveRoundId(existingRounds[0]?.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingRounds]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Schedule Interview</h2>
          <p className="mt-1 text-xs text-gray-500">
            {jobApplication.applicantDetails?.name} &bull; {jobApplication.jobTitle}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Rounds header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-2 flex-wrap">
            {rounds.map((round) => (
            <button
              key={round.id}
              type="button"
              onClick={() => setActiveRoundId(round.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${
                round.id === activeRound?.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              }`}
            >
              <span>Round {round.roundNumber}</span>

              {round.id === latestRound?.id && !round.scheduledAt && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();

                    if (rounds.length > 1) {
                      const updated = rounds.slice(0, -1);
                      setRounds(updated);
                      setActiveRoundId(updated[updated.length - 1].id);
                    } else {
                      onClose();
                    }
                  }}
                  className="ml-1 text-xs font-bold cursor-pointer hover:text-red-500"
                >
                  ✕
                </span>
              )}
            </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddNextRound}
            disabled={!canAddNextRound}
            data-tooltip-id="my-tooltip"
            data-tooltip-content={!canAddNextRound && !isDraftLatestRound ? "Please submit the feedback for last round" : ""}
            data-tooltip-place="top"
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
              canAddNextRound
                ? "text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                : "text-gray-400 border-gray-200 cursor-not-allowed"
            }`}
          >
            Add Next Round
          </button>
        </div>

        {activeRound && (
          <>
            {activeRound.scheduledAt && !isReschedulingLatestRound ? (
              <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Round {activeRound.roundNumber}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                        activeRound.interviewStatus === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {activeRound.interviewStatus === "CANCELLED" ? "Cancelled" : "Scheduled"}
                    </span>
                    <span className="text-sm text-gray-900">
                      {activeRound.scheduledAt.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Interview Type</p>
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {activeRound.interviewType === "__OTHER__"
                      ? activeRound.customInterviewType || "-"
                      : activeRound.interviewType || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">Rules</p>
                  <p className="text-sm text-gray-900 whitespace-pre-line">
                    {activeRound.rules || "-"}
                  </p>
                </div>
                {activeRound.extraInterviewers.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500">Extra interviewers</p>
                    <ul className="mt-2 space-y-1">
                      {activeRound.extraInterviewers.map((interviewer, index) => (
                        <li
                          key={`${interviewer.email}-${index}`}
                          className="text-xs text-gray-700"
                        >
                          {interviewer.name} ({interviewer.email})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500">Link</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-900 break-all">
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

                {activeRound.interviewStatus === "CANCELLED" && (
                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Cancel reason</p>
                      <p className="text-sm text-gray-900">{activeRound.cancelReason || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500">Cancel feedback</p>
                      <p className="text-sm text-gray-900 whitespace-pre-line">
                        {activeRound.cancelFeedback || "-"}
                      </p>
                    </div>
                  </div>
                )}
                {onOpenFeedbackSidebar &&
                  activeRound.scheduledAt.getTime() <= now.getTime() &&
                  !activeRound.feedbackSubmitted &&
                  activeRound.interviewStatus !== "CANCELLED" && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 w-fit"
                      onClick={() => onOpenFeedbackSidebar(activeRound.id)}
                    >
                      Submit feedback for Round {activeRound.roundNumber}
                    </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex gap-1">
                  <div className="space-y-2 flex-1">
                    <label className="block text-sm font-medium text-gray-900">
                      Date (Round {activeRound.roundNumber})
                    </label>
                    <DatePicker
                      selected={draftScheduleByRoundId[activeRound.id]?.date ?? null}
                      onChange={(date) => setDraftDate(activeRound.id, date ?? null)}
                      dateFormat="dd MMM yyyy"
                      minDate={new Date()}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      calendarClassName="!z-50"
                      popperPlacement="bottom-start"
                      popperContainer={({ children }) => (
                        <div className="relative z-[9999] max-w-full">{children}</div>
                      )}
                    />
                  </div>

                  <div className="space-y-2 flex-1">
                    <label className="block text-sm font-medium text-gray-900">Time</label>
                    <input
                      type="time"
                      value={draftScheduleByRoundId[activeRound.id]?.time ?? ""}
                      onChange={(e) => setDraftTime(activeRound.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {!isReschedulingLatestRound && (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        Interview Type
                      </label>
                      <select
                        value={
                          [
                            "HR Round",
                            "Technical Round",
                            "Cultural Round",
                            "Business Understanding Round",
                            "Product Understanding Round",
                          ].includes(activeRound.interviewType)
                            ? activeRound.interviewType
                            : activeRound.customInterviewType
                            ? "Others"
                            : ""
                        }
                        onChange={(e) => {
                          const value = e.target.value;

                          if (value === "") {
                            handleRoundFieldChange({
                              interviewType: "",
                              customInterviewType: "",
                            });
                            return;
                          }

                          if (value === "Others") {
                            handleRoundFieldChange({
                              interviewType: "__OTHER__",
                              customInterviewType: "",
                            });
                            return;
                          }

                          handleRoundFieldChange({
                            interviewType: value,
                            customInterviewType: "",
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select interview type</option>
                        <option value="HR Round">HR Round</option>
                        <option value="Technical Round">Technical Round</option>
                        <option value="Cultural Round">Cultural Round</option>
                        <option value="Business Understanding Round">Business Understanding Round</option>
                        <option value="Product Understanding Round">Product Understanding Round</option>
                        <option value="Others">Others</option>
                      </select>
                        {activeRound.interviewType === "__OTHER__" && (
                          <textarea
                            rows={3}
                            value={activeRound.customInterviewType || ""}
                            onChange={(e) =>
                              handleRoundFieldChange({
                                customInterviewType: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Write custom interview type."
                          />
                        )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        Recruiter&apos;s Note (optional)
                      </label>
                      <div className="flex justify-start items-center gap-1">
                      <Info size={10}/>
                      <p className="text-[10px]">Recruiter&apos;s Note will only be shown to evaluator's</p>
                      </div>
                      <textarea
                        rows={3}
                        value={activeRound.recruiterNote ?? ""}
                        onChange={(e) =>
                          handleRoundFieldChange({ recruiterNote: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Add any notes for the recruiter."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        Rules to add (optional)
                      </label>
                      <textarea
                        rows={3}
                        value={activeRound.rules}
                        onChange={(e) => handleRoundFieldChange({ rules: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Add any instructions or rules for this interview."
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-900">
                          Add interview panel
                        </label>
                        <p className="text-xs text-gray-500">
                          Add additional interviewers by name and email. You can add multiple
                          interviewers.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          value={extraInterviewerName}
                          onChange={(e) => setExtraInterviewerName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Interviewer name"
                        />
                        <input
                          type="email"
                          value={extraInterviewerEmail}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Interviewer email"
                        />
                        <button
                          type="button"
                          onClick={handleAddInterviewer}
                          disabled={
                            !extraInterviewerName.trim() ||
                            !extraInterviewerEmail.trim() ||
                            !!emailError
                          }
                          className={`px-4 py-2 text-sm font-semibold text-white rounded-lg whitespace-nowrap
                            ${
                              !extraInterviewerName.trim() ||
                              !extraInterviewerEmail.trim() ||
                              emailError
                                ? "bg-gray-300 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700"
                            }`}
                        >
                          Add
                        </button>
                      </div>
                      {filteredSuggestions.length > 0 && (
                          <div 
                          onBlur={() => setTimeout(() => setFilteredSuggestions([]), 150)}
                          className="border rounded-lg mt-1 max-h-20 overflow-y-auto bg-white shadow">
                            {filteredSuggestions.map((s, index) => (
                              <div
                                key={index}
                                onClick={() => handleSelectSuggestion(s)}
                                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                              >
                                {s.email}
                              </div>
                            ))}
                          </div>
                        )}
                                                {emailError && (
                          <p className="text-red-500 text-xs mt-1">{emailError}</p>
                        )}
                      {activeRound.extraInterviewers.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <p className="text-xs font-medium text-gray-700">Added interviewers</p>
                          <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {activeRound.extraInterviewers.map((interviewer, index) => (
                              <li
                                key={`${interviewer.email}-${index}`}
                                className="flex items-center justify-between px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">
                                    {interviewer.name}
                                  </span>
                                  <span className="text-gray-600">{interviewer.email}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="px-3 py-4 border-t flex justify-end gap-3">
      {isActiveLatestRound ? (
        <>
          {isDraftLatestRound ? (
            <button
              type="button"
              onClick={() => {
                if (rounds.length > 1) {
                  const updated = rounds.slice(0, -1);
                  setRounds(updated);
                  setActiveRoundId(updated[updated.length - 1].id);
                } else {
                  onClose();
                }
              }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          ) : (
            <>
              {latestRound?.interviewStatus !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCancelSidebar) {
                      onOpenCancelSidebar();
                      return;
                    }
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel Interview
                </button>
              )}

              {latestRound?.interviewStatus !== "CANCELLED" && (
                <button
                  type="button"
                  onClick={() => {
                    if (!latestRound) return;
                    onOpenRescheduleSidebar?.();
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Reschedule
                </button>
              )}

              <button
                type="button"
                disabled={!latestJoinLink}
                onClick={handleJoin}
                className={`px-4 py-2 text-sm font-semibold rounded-lg border ${
                  latestJoinLink
                    ? "text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                    : "text-gray-400 border-gray-200 cursor-not-allowed bg-white"
                }`}
              >
                Join
              </button>
            </>
          )}

          {isDraftLatestRound && (
            <button
              type="button"
              disabled={
                !draftScheduleByRoundId[activeRound.id]?.date ||
                !draftScheduleByRoundId[activeRound.id]?.time ||
                !activeRound.interviewType ||
                (activeRound.interviewType === "__OTHER__" &&
                  !(activeRound.customInterviewType || "").trim())
              }
              onClick={handleSubmitAll}
              className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                !draftScheduleByRoundId[activeRound.id]?.date ||
                !draftScheduleByRoundId[activeRound.id]?.time ||
                !activeRound.interviewType ||
                (activeRound.interviewType === "__OTHER__" &&
                  !(activeRound.customInterviewType || "").trim())
                  ? "bg-gray-300 cursor-not-allowed text-white"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Submit
            </button>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Close
        </button>
      )}
      </div>
    </div>
  );
};

export default ScheduleInterviewSidebar;

