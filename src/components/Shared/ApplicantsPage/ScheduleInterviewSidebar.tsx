import React, { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { ScheduleInterviewPayload } from "@Interfaces/CorporateServices.dto";
import { Info, CalendarCheck } from "lucide-react";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import CancelInterviewSidebar from "@Components/Shared/ApplicantsPage/CancelInterviewSidebar";
import RescheduleInterviewSidebar from "@Components/Shared/ApplicantsPage/RescheduleInterviewSidebar";
import InterviewSubmissionSidebar from "@Components/Shared/ApplicantsPage/InterviewSubmissionSidebar";
import { useAppContext } from "@Context/App.context";
import { Attendee, InterviewItem } from "./InterviewHistorySidebar";
import httpServiceObj from "@Services/ApiHandler.service";
import { AvailabilitySchedulerModal, AttendeeForBusy } from "./AvailabilitySchedulerModal";

type InterviewItemWithCustom = InterviewItem & {
  customInterviewType?: string;
};

interface EvaluatorDetails {
  cognitoUserId: string;
  email: string;
  name: string;
}

const PREDEFINED_INTERVIEW_TYPES = new Set([
  "HR Round",
  "Technical Round",
  "Cultural Round",
  "Business Understanding Round",
  "Product Understanding Round",
]);

function mapInterviewToWithCustom(item: InterviewItem): InterviewItemWithCustom {
  const t = item.interviewType?.trim() || "";
  if (!t) return { ...item };
  if (PREDEFINED_INTERVIEW_TYPES.has(t)) {
    return { ...item, customInterviewType: undefined };
  }
  return {
    ...item,
    interviewType: "__OTHER__",
    customInterviewType: t,
  };
}

function dedupeAttendeesByEmail(attendees: Attendee[]): Attendee[] {
  const seen = new Set<string>();
  return attendees.filter((a) => {
    const email = a.email.toLowerCase().trim();
    if (seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}

function createDraftRound(
  jobApplication: JobApplicationDetailsDto,
  roundNumber: number
): InterviewItemWithCustom {
  const draftId = `temp-${roundNumber}-${Date.now()}`;
  return {
    id: draftId,
    createdAt: "",
    updatedAt: "",
    jobId: jobApplication.jobId || "",
    companyId: jobApplication.companyId || "",
    applicantEmail: jobApplication.applicantDetails?.email || "",
    applicantName: jobApplication.applicantDetails?.name || "",
    applicantId: "",
    organizerId: "",
    organizerEmail: "",
    roundNumber,
    status: "SCHEDULED",
    scheduledAt: "",
    endAt: "",
    timezone: "",
    meetingProvider: "",
    meetingLink: "",
    providerEventId: "",
    completion: {},
    updatedByUserId: "",
    attendees: [],
    recruiterNote: "",
    ruleForCandidate: "",
    cancellationReason: "",
    applicationId: jobApplication.id,
    interviewType: "",
    jobTitle: jobApplication.jobTitle,
    companyName: jobApplication.companyName ?? "",
  };
}

type RoundDraftSchedule = {
  date: Date | null;
  time: string;
};

type RescheduleAttendee = {
  type: "EVALUATOR" | "EXTERNAL";
  userId?: string;
  email: string;
  name: string;
};

interface ScheduleInterviewSidebarProps {
  jobApplication: JobApplicationDetailsDto;
  onClose: () => void;
  localUpdate: (jobId: string, updatedData: any) => void;
}

type SidePanel = "main" | "cancel" | "reschedule" | "feedback";

export const ScheduleInterviewSidebar: React.FC<ScheduleInterviewSidebarProps> = ({
  jobApplication,
  onClose,
  localUpdate,
}) => {
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const { userDetails } = useAppContext();
  const [rounds, setRounds] = useState<InterviewItemWithCustom[]>([]);
  const [activeRoundId, setActiveRoundId] = useState<string>(rounds[0]?.id);
  const activeRound = useMemo(
    () => rounds.find((r) => r.id === activeRoundId) ?? rounds[0],
    [rounds, activeRoundId]
  );
  const latestRound = useMemo(() => (rounds.length ? rounds[rounds.length - 1] : null), [rounds]);
  const isActiveLatestRound = !!activeRound && !!latestRound && activeRound.id === latestRound.id;
  const isDraftLatestRound = isActiveLatestRound && !latestRound?.scheduledAt;

  const [extraInterviewerName, setExtraInterviewerName] = useState("");
  const [extraInterviewerEmail, setExtraInterviewerEmail] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [draftScheduleByRoundId, setDraftScheduleByRoundId] = useState<
    Record<string, RoundDraftSchedule>
  >({});
  const now = new Date();
  const [emailError, setEmailError] = useState("");
  const [evaluatorSuggestions, setEvaluatorSuggestions] = useState<
    { email: string; name: string; userId: string }[]
  >([]);

  const [filteredSuggestions, setFilteredSuggestions] = useState<
    { email: string; name: string; userId: string }[]
  >([]);

  const [sidePanel, setSidePanel] = useState<SidePanel>("main");
  const [feedbackRoundId, setFeedbackRoundId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeEvaluatorId, setActiveEvaluatorId] = useState<string | null>(null);
  const suggestionRef = useRef<HTMLDivElement | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  const handleEmailChange = (value: string) => {
    setExtraInterviewerEmail(value);

    // existing validation
    if (!value) {
      setEmailError("");
      setFilteredSuggestions([]);
      return;
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

  // ─────────────────────────────────────────────────────────────────
  // STEP 3 — Build the attendees list to pass to the modal
  //          (place anywhere after activeRound is defined, e.g. near evaluators)
  // ─────────────────────────────────────────────────────────────────

  const modalAttendees = useMemo<AttendeeForBusy[]>(() => {
    if (!activeRound) return [];
    return (activeRound.attendees ?? [])
      .filter((a) => a.type === "EVALUATOR" || a.type === "EXTERNAL")
      .map((a) => ({
        userId: a.userId,
        email: a.email,
        name: a.name,
      }));
  }, [activeRound]);

  const rescheduleOrganizer = useMemo<AttendeeForBusy>(
    () => ({
      email: userDetails?.email ?? "",
      name: userDetails?.fullName ?? "Organizer",
      userId: userDetails?.id,
    }),
    [userDetails?.email, userDetails?.fullName, userDetails?.id]
  );

  const rescheduleCandidate = useMemo<AttendeeForBusy>(
    () => ({
      email: jobApplication.applicantDetails?.email ?? "",
      name: jobApplication.applicantDetails?.name ?? "Candidate",
    }),
    [jobApplication.applicantDetails?.email, jobApplication.applicantDetails?.name]
  );

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
            userId: evaluator?.id,
          }))
          .filter((e) => e.email); // remove invalid

        setEvaluatorSuggestions(cleaned);
      } catch (error) {
        console.error("Error fetching evaluation responses:", error);
      }
    };

    fetchEvaluationResponses();
  }, [jobApplication?.id]);

  const handleSelectSuggestion = (suggestion: { email: string; name: string; userId?: string }) => {
    setExtraInterviewerEmail(suggestion.email);
    setExtraInterviewerName(suggestion.name);
    setSelectedUserId(suggestion.userId);
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

  const buildStartTimeFromDraft = (roundId: string): string | null => {
    const draft = draftScheduleByRoundId[roundId];
    if (!draft?.date || !draft?.time) return null;

    const [hh, mm] = draft.time.split(":").map((v) => Number(v));
    const next = new Date(draft.date);
    next.setHours(hh || 0, mm || 0, 0, 0);

    return next.toISOString(); // ✅ full ISO
  };

  const handleRoundFieldChange = (patch: Partial<InterviewItemWithCustom>) => {
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
    const alreadyExists = (activeRound.attendees || []).some(
      (a) => a.email.toLowerCase().trim() === extraInterviewerEmail.toLowerCase().trim()
    );

    if (alreadyExists) {
      toast.error("This email has already been added", getToastOptions({}));
      return;
    }

    setRounds((prev) => {
      const updated = prev.map((round) =>
        round.id === activeRound.id
          ? {
              ...round,
              attendees: [
                ...(round.attendees || []),
                {
                  type: (selectedUserId ? "EVALUATOR" : "EXTERNAL") as "EVALUATOR" | "EXTERNAL",
                  name: extraInterviewerName.trim(),
                  email: extraInterviewerEmail.trim(),
                  ...(selectedUserId ? { userId: selectedUserId } : {}),
                },
              ],
            }
          : round
      );
      return updated;
    });

    setExtraInterviewerName("");
    setExtraInterviewerEmail("");
    setSelectedUserId(undefined);
  };

  const canAddNextRound = useMemo(() => {
    if (!rounds.length) return false;

    const lastRound = rounds[rounds.length - 1];

    // allow if cancelled
    if (lastRound.status === "CANCELLED") return true;

    if (!lastRound.scheduledAt) return false;

    const now = new Date();
    const timePassed = new Date(lastRound.scheduledAt).getTime() <= now.getTime();

    const organizerCompletion = lastRound.completion?.organizer;

    const feedbackDone =
      lastRound.status === "COMPLETED" &&
      Boolean(organizerCompletion?.feedback?.trim()) &&
      organizerCompletion?.rating !== null &&
      organizerCompletion?.rating !== undefined;

    return Boolean(timePassed && feedbackDone);
  }, [rounds]);

  const latestJoinLink = useMemo(() => {
    if (!rounds.length) return "";
    const latest = rounds[rounds.length - 1];
    return latest.meetingLink || "";
  }, [rounds]);

  const handleJoin = () => {
    if (!latestJoinLink) return;
    window.open(latestJoinLink, "_blank", "noopener,noreferrer");
  };

  const handleAddNextRound = () => {
    if (!canAddNextRound) return;
    const nextNumber = rounds.length ? Math.max(...rounds.map((r) => r.roundNumber)) + 1 : 1;
    const newRound = createDraftRound(jobApplication, nextNumber);
    setRounds((prev) => [...prev, newRound]);
    setDraftScheduleByRoundId((prev) => ({
      ...prev,
      [newRound.id]: { date: null, time: "" },
    }));
    setActiveRoundId(newRound.id);
  };

  const handleScheduleSubmit = async () => {
    if (!latestRound) return;

    const startTime = buildStartTimeFromDraft(latestRound.id);
    if (!startTime) {
      toast.error("Please select date and time", getToastOptions({}));
      return;
    }

    if (new Date(startTime).getTime() < new Date().getTime()) {
      toast.error("Selected date and time cannot be in the past", getToastOptions({}));
      return;
    }

    const resolvedInterviewType =
      latestRound.interviewType === "__OTHER__"
        ? (latestRound.customInterviewType || "").trim()
        : (latestRound.interviewType || "").trim();

    if (!resolvedInterviewType) {
      toast.error("Please select an interview type", getToastOptions({}));
      return;
    }
    setIsSubmitting(true);
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60);

    const attendees = dedupeAttendeesByEmail(latestRound.attendees || []);

    const newAttendees = await Promise.all(
      attendees.map(async (attendees) => {
        if (attendees.type === "EVALUATOR") {
          const { response, error } = await httpServiceObj.get<EvaluatorDetails>(
            `/evaluator-detail/${attendees?.email}/email`,
            true,
            {},
            false,
            "JOB"
          );
          if (response?.cognitoUserId) return { ...attendees, userId: response.cognitoUserId };
          if (error) {
            const { userId, ...rest } = attendees;
            return rest;
          }
        }
        return attendees;
      })
    );

    const payload: ScheduleInterviewPayload = {
      organizerEmail: userDetails?.email ?? "",
      jobTitle: jobApplication?.jobTitle,
      companyName: jobApplication?.companyName,
      interviewType: resolvedInterviewType,
      startTime,
      endTime: endTime.toISOString(),
      attendees: newAttendees,
      recruiterNote: (latestRound.recruiterNote ?? "").trim() || undefined,
      ruleForCandidate: (latestRound.ruleForCandidate ?? "").trim() || undefined,
    };

    const tempId = latestRound.id;

    try {
      const { response, error } = await CorporateServiceObj.scheduleInterview(
        jobApplication.id,
        payload
      );

      if (error) {
        toast.error(error.message || "Failed to schedule interview", getToastOptions({}));
        return;
      }

      if (!response) {
        toast.error("Failed to schedule interview", getToastOptions({}));
        return;
      }

      if (rounds.length === 1 && !latestRound?.scheduledAt) {
        localUpdate(jobApplication.id, { interviewRoundCount: 1 });
      }

      const responseData = response as any;

      toast.success("Interview scheduled successfully", getToastOptions({}));

      setRounds((prev) =>
        prev.map((round) =>
          round.id === tempId
            ? mapInterviewToWithCustom({
                ...round,
                ...responseData,
                id: responseData.id || responseData.interviewId || tempId,
                scheduledAt: responseData.scheduledAt || responseData.startTime || startTime,
                endAt: responseData.endAt || responseData.endTime || endTime.toISOString(),
                attendees: responseData.attendees || round.attendees || [],
                rating: responseData.rating === null ? undefined : responseData.rating,
              })
            : round
        )
      );

      setActiveRoundId(responseData.id || responseData.interviewId || tempId);
      setDraftScheduleByRoundId((prev) => {
        const next = { ...prev };
        delete next[tempId];
        next[responseData.id || responseData.interviewId || tempId] = { date: null, time: "" };
        return next;
      });
    } catch (error: any) {
      toast.error(error?.message || "Failed to schedule interview", getToastOptions({}));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInterviewConfirm = async ({
    reason,
    feedback,
  }: {
    reason: string;
    feedback: string;
  }) => {
    if (!jobApplication?.id || !latestRound?.id) return;

    const response = await CorporateServiceObj.cancelInterview(jobApplication.id, latestRound.id, {
      cancellationReason: reason,
      cancellationFeedback: feedback || undefined,
    });

    if (!response) {
      toast.error("Failed to cancel interview", getToastOptions({}));
      return;
    }

    setRounds((prev) =>
      prev.map((r) =>
        r.id === latestRound.id
          ? mapInterviewToWithCustom({
              ...r,
              ...response,
              status: "CANCELLED",
              cancellationReason: reason,
              cancellationFeedback: feedback,
            })
          : r
      )
    );

    toast.success("Interview cancelled", getToastOptions({}));
    setSidePanel("main");
  };

  const handleRescheduleConfirm = async (scheduledAt: Date, attendees: RescheduleAttendee[]) => {
    if (!jobApplication?.id || !latestRound?.id) return;

    const endTime = new Date(scheduledAt);
    endTime.setMinutes(endTime.getMinutes() + 60);

    const response = await CorporateServiceObj.rescheduleInterview(
      jobApplication.id,
      latestRound.id,
      {
        startTime: scheduledAt.toISOString(),
        endTime: endTime.toISOString(),
        attendees,
      }
    );

    if (!response) {
      toast.error("Failed to reschedule interview", getToastOptions({}));
      return;
    }
    const responseData = response as any;

    setRounds((prev) =>
      prev.map((r) =>
        r.id === latestRound.id
          ? mapInterviewToWithCustom({
              ...r,
              ...responseData,
              id: responseData.id || responseData.interviewId || r.id,
              scheduledAt:
                responseData.scheduledAt || responseData.startTime || scheduledAt.toISOString(),
              endAt: responseData.endAt || responseData.endTime || endTime.toISOString(),
              status: responseData.status || r.status,
              attendees: responseData.attendees || attendees || r.attendees || [],
              rating: responseData.rating === null ? undefined : responseData.rating,
            })
          : r
      )
    );

    toast.success("Interview rescheduled", getToastOptions({}));
    setSidePanel("main");
  };

  const handleFeedbackSubmitted = async ({
    roundId,
    feedback,
    rating,
  }: {
    roundId: string;
    feedback: string;
    rating: number | null;
  }) => {
    if (!jobApplication?.id) return;

    const response = await CorporateServiceObj.completeInterview(jobApplication.id, roundId, {
      organizer: {
        feedback,
        rating,
      },
    });

    if (!response) {
      toast.error("Failed to submit feedback", getToastOptions({}));
      throw new Error("complete failed");
    }

    setRounds((prev) =>
      prev.map((r) =>
        r.id === roundId
          ? mapInterviewToWithCustom({
              ...r,
              ...response,
              feedback: feedback || r.feedback,
              rating: rating ?? r.rating,
            })
          : r
      )
    );

    toast.success("Feedback submitted", getToastOptions({}));
    setSidePanel("main");
    setFeedbackRoundId(null);
  };

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        setIsLoading(true);
        if (!jobApplication?.id) return;

        const response = await CorporateServiceObj.getInterviewsByApplicationId(jobApplication.id);

        const items = response?.data || [];

        const mappedRounds: InterviewItemWithCustom[] = items
          .map((item) => mapInterviewToWithCustom(item))
          .sort((a, b) => (a.roundNumber ?? 0) - (b.roundNumber ?? 0)); // sort ascending

        if (mappedRounds.length === 0) {
          const draft = createDraftRound(jobApplication, 1);
          setRounds([draft]);
          setActiveRoundId(draft.id);
          setDraftScheduleByRoundId((prev) => ({
            ...prev,
            [draft.id]: { date: null, time: "" },
          }));
          return;
        }

        // adding evalutor name and email in completion.evaluators object
        const enrichedItems = mappedRounds.map((round, index) => {
          const originalItem = items[index];

          const attendeeMap = Object.fromEntries(
            (originalItem?.attendees || [])
              .filter((a) => a.type === "EVALUATOR" && a.userId)
              .map((a) => [a.userId, { name: a.name, email: a.email }])
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
        setActiveRoundId(mappedRounds[0]?.id);

        setDraftScheduleByRoundId((prev) => {
          const next = { ...prev };
          mappedRounds.forEach((r) => {
            if (!next[r.id]) next[r.id] = { date: null, time: "" };
          });
          return next;
        });
      } catch (error) {
        console.error("Failed to fetch interviews", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRounds();
  }, [jobApplication?.id]);

  const openFeedbackForRound = (roundId: string) => {
    setFeedbackRoundId(roundId);
    setSidePanel("feedback");
  };

  const handleRemoveInterviewer = (email: string) => {
    if (!activeRound) return;

    setRounds((prev) =>
      prev.map((round) =>
        round.id === activeRound.id
          ? {
              ...round,
              attendees: (round.attendees || []).filter((a) => a.email !== email),
            }
          : round
      )
    );
  };

  const evaluators = activeRound?.completion?.evaluators
    ? Object.entries(activeRound.completion.evaluators)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setFilteredSuggestions([]);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

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
    <>
      <div className="flex flex-col h-full bg-white">
        {sidePanel === "cancel" && latestRound && (
          <CancelInterviewSidebar
            jobApplication={jobApplication}
            roundNumber={latestRound.roundNumber}
            onClose={() => setSidePanel("main")}
            onSubmit={handleCancelInterviewConfirm}
          />
        )}

        {sidePanel === "reschedule" && latestRound && (
          <RescheduleInterviewSidebar
            jobApplication={jobApplication}
            organizer={rescheduleOrganizer}
            candidate={rescheduleCandidate}
            attendees={latestRound.attendees || []}
            initialScheduledAt={latestRound.scheduledAt ? new Date(latestRound.scheduledAt) : null}
            onClose={() => setSidePanel("main")}
            onSubmit={handleRescheduleConfirm}
          />
        )}

        {sidePanel === "feedback" && feedbackRoundId && (
          <InterviewSubmissionSidebar
            name={jobApplication.applicantDetails?.name}
            jobTitle={jobApplication.jobTitle}
            // jobApplication={jobApplication}
            roundId={feedbackRoundId}
            onClose={() => {
              setSidePanel("main");
              setFeedbackRoundId(null);
            }}
            onSubmitted={handleFeedbackSubmitted}
          />
        )}

        {sidePanel === "main" && (
          <>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Schedule Interview</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {jobApplication.applicantDetails?.name} &bull; {jobApplication.jobTitle}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 space-y-6">
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
                      }`}>
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
                          className="ml-1 text-xs font-bold cursor-pointer hover:text-red-500">
                          ✕
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {rounds.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddNextRound}
                    disabled={!canAddNextRound}
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content={
                      !canAddNextRound && !isDraftLatestRound
                        ? "Please submit the feedback for last round"
                        : ""
                    }
                    data-tooltip-place="top"
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                      canAddNextRound
                        ? "text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                        : "text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}>
                    Add Next Round
                  </button>
                )}
              </div>

              {activeRound && (
                <>
                  {activeRound.scheduledAt ? (
                    <div className="space-y-3">
                      {/* <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-gray-50"> */}
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="p-2 border border-gray-200 rounded-lg bg-white">
                          <div className="flex items-center justify-start mb-1 gap-3">
                            <p className="text-xs font-semibold text-blue-500">Status & Time</p>

                            <span
                              className={`px-2 py-0.5 rounded-full text-[0.65rem] font-semibold ${
                                activeRound?.status === "CANCELLED"
                                  ? "bg-red-100 text-red-700"
                                  : activeRound?.status === "COMPLETED"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}>
                              {activeRound?.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">
                            {new Date(activeRound.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="p-2 border border-gray-200 rounded-lg bg-white">
                          <p className="text-xs font-semibold text-blue-500 mb-1">Interview Type</p>
                          <p className="text-sm text-gray-500 whitespace-pre-line">
                            {activeRound.interviewType === "__OTHER__"
                              ? activeRound.customInterviewType || "-"
                              : activeRound.interviewType || "-"}
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
                        {/* {(activeRound.attendees?.length ?? 0) > 0 && ( */}
                        <div className="p-2 border border-gray-200 rounded-lg">
                          <p className="text-xs font-bold text-blue-500">Attendees</p>
                          <ul className="mt-2 space-y-1 list-disc pl-4 marker:text-black">
                            <li className="text-xs text-gray-500">
                              {userDetails?.fullName}
                              {/* ({userDetails?.email}) */}
                            </li>
                            <li className="text-xs text-gray-500">
                              {jobApplication?.applicantDetails?.name}
                              {/* ({jobApplication?.applicantDetails?.email}) */}
                            </li>
                            {(activeRound.attendees?.length ?? 0) > 0 &&
                              (activeRound.attendees || []).map((interviewer, index) => (
                                <li
                                  key={`${interviewer.email}-${index}`}
                                  className="text-xs text-gray-500">
                                  {interviewer.name}
                                  {/* ({interviewer.email}) */}
                                </li>
                              ))}
                          </ul>
                        </div>
                        {/* )} */}
                      </div>

                      {!activeRound?.completion?.organizer?.rating &&
                        !activeRound?.completion?.organizer?.feedback &&
                        !activeRound?.cancellationReason &&
                        !activeRound?.cancellationFeedback && (
                          <div>
                            <p className="text-xs font-bold text-blue-500">Recruiter&apos;s Note</p>
                            <p className="text-sm text-gray-500 whitespace-pre-line">
                              {activeRound.recruiterNote || "-"}
                            </p>
                          </div>
                        )}

                      {Date.now() <=
                        new Date(activeRound.scheduledAt).getTime() + 70 * 60 * 1000 && (
                        <div>
                          <p className="text-xs font-bold text-blue-500">Link</p>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm text-gray-500 break-all">
                              {activeRound.meetingLink || "-"}
                            </span>
                            <button
                              type="button"
                              disabled={!activeRound.meetingLink}
                              onClick={() => {
                                if (!activeRound.meetingLink) return;
                                window.open(
                                  activeRound.meetingLink,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }}
                              className={`px-3 py-1 text-xs font-semibold rounded-lg border ${
                                activeRound.meetingLink
                                  ? "text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                                  : "text-gray-400 border-gray-200 cursor-not-allowed"
                              }`}>
                              Join
                            </button>
                          </div>
                        </div>
                      )}
                      {activeRound.status === "CANCELLED" && (
                        <div className="space-y-2 p-2 border border-gray-200 rounded-lg">
                          <div>
                            <p className="text-xs font-medium text-gray-500">Cancel reason</p>
                            <p className="text-sm text-gray-900">
                              {activeRound.cancellationReason || "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Cancel feedback</p>
                            <p className="text-sm text-gray-900 whitespace-pre-line">
                              {activeRound.cancellationFeedback || "-"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Completed Info */}
                      {activeRound?.status === "COMPLETED" && (
                        <div className="space-y-3 p-2 border border-gray-200 rounded-lg mt-2">
                          <p className="font-extrabold text-blue-500">
                            Recruiter/Organizer Feedback
                          </p>
                          <div>
                            <p className="text-xs font-medium text-black">Rating</p>
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
                      )}

                      {/* Evaluator Feedback */}
                      {activeRound?.completion?.evaluators &&
                        Object.keys(activeRound.completion.evaluators).length > 0 && (
                          <div>
                            {/* <p className="font-extrabold text-blue-500">Evaluators Feedback</p> */}
                            <div className="space-y-4 pt-2 border-gray-200">
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
                                      }`}>
                                      {evaluator.name || "Evaluator"}
                                    </button>
                                  ))}
                                </div>

                                {/* Details */}
                                <div className="space-y-3 p-2 border border-gray-200 rounded-lg mt-2">
                                  {evaluators
                                    .filter(
                                      ([userId]) =>
                                        userId === (activeEvaluatorId ?? evaluators[0]?.[0])
                                    )
                                    .map(([userId, evaluator]: any) => (
                                      <div key={userId} className="space-y-2">
                                        <p className="font-extrabold text-blue-500">
                                          Evaluator Feedback
                                        </p>
                                        <div>
                                          <p className="text-xs font-medium text-black">
                                            Evaluator Name
                                          </p>
                                          <p className="text-sm text-gray-500">{evaluator.name}</p>
                                        </div>

                                        <div>
                                          <p className="text-xs font-medium text-black">
                                            Evaluator Email
                                          </p>
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
                        )
                      )} */}
                            </div>
                          </div>
                        )}

                      {new Date(activeRound.scheduledAt).getTime() <= now.getTime() &&
                        activeRound.status !== "CANCELLED" &&
                        activeRound.status !== "COMPLETED" && (
                          <button
                            onClick={() => openFeedbackForRound(activeRound.id)}
                            className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 w-fit">
                            Submit feedback for Round {activeRound?.roundNumber}
                          </button>
                        )}
                      {/* {new Date(activeRound.scheduledAt).getTime() <= now.getTime() &&
                activeRound.status !== "CANCELLED" && (
                  activeRound.status === "COMPLETED" &&
                  activeRound.completion?.organizer?.feedback?.trim() &&
                  activeRound.completion?.organizer?.rating !== null &&
                  activeRound.completion?.organizer?.rating !== undefined ? (
                    
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Rating</p>
                        <p className="text-sm text-gray-900">
                          {activeRound.completion.organizer.rating} / 5
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Feedback</p>
                        <p className="text-sm text-gray-900 whitespace-pre-line">
                          {activeRound.completion.organizer.feedback}
                        </p>
                      </div>
                    </div>

                  ) : (
                    <button
                      type="button"
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 w-fit"
                      onClick={() => openFeedbackForRound(activeRound.id)}
                    >
                      Submit feedback for Round {activeRound.roundNumber}
                    </button>
                  )
              )} */}
                    </div>
                  ) : (
                    <>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-900">
                              Add interview panel
                            </label>
                            <p className="text-xs text-gray-500">
                              Add additional interviewers by name and email. Candidate and recruiter
                              are added automatically.
                            </p>
                          </div>

                          <div ref={suggestionRef} className="relative">
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
                            }`}>
                                Add
                              </button>
                            </div>
                            {filteredSuggestions.length > 0 && (
                              <div
                                // onBlur={() => setTimeout(() => setFilteredSuggestions([]), 150)}
                                className="border rounded-lg mt-1 max-h-20 overflow-y-auto bg-white shadow">
                                {filteredSuggestions.map((s, index) => (
                                  <div
                                    key={index}
                                    onClick={() => handleSelectSuggestion(s)}
                                    className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100">
                                    {s.email}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                          {(activeRound.attendees?.length ?? 0) > 0 && (
                            <div className="mt-2 space-y-2">
                              <p className="text-xs font-medium text-gray-700">
                                Added interviewers
                              </p>
                              <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                {(activeRound.attendees || []).map((interviewer, index) => (
                                  <li
                                    key={`${interviewer.email}-${index}`}
                                    className="flex items-center justify-between px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg">
                                    {/* <div className="flex justify-around items-center gap-2"> */}
                                    <div className="flex flex-col">
                                      <span className="font-medium text-gray-900">
                                        {interviewer.name}
                                      </span>
                                      <span className="text-gray-600">{interviewer.email}</span>
                                    </div>
                                    <div>
                                      <button
                                        className="ml-3 text-gray-500 hover:text-red-500 text-xl"
                                        onClick={() => handleRemoveInterviewer(interviewer.email)}>
                                        ✕
                                      </button>
                                    </div>
                                    {/* </div> */}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-900">
                            Interview Type
                          </label>
                          <select
                            value={
                              PREDEFINED_INTERVIEW_TYPES.has(activeRound.interviewType || "")
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="">Select interview type</option>
                            <option value="HR Round">HR Round</option>
                            <option value="Technical Round">Technical Round</option>
                            <option value="Cultural Round">Cultural Round</option>
                            <option value="Business Understanding Round">
                              Business Understanding Round
                            </option>
                            <option value="Product Understanding Round">
                              Product Understanding Round
                            </option>
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
                            <Info size={10} />
                            <p className="text-[10px]">
                              Recruiter&apos;s Note will only be shown to evaluator's
                            </p>
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
                            value={activeRound.ruleForCandidate}
                            onChange={(e) =>
                              handleRoundFieldChange({ ruleForCandidate: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Add any instructions or rules for this interview."
                          />
                        </div>

                                            <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-900">
                          Date &amp; Time (Round {activeRound.roundNumber})
                        </label>
                        {draftScheduleByRoundId[activeRound.id]?.date &&
                        draftScheduleByRoundId[activeRound.id]?.time ? (
                          <div className="flex items-center justify-between px-3 py-2 border border-indigo-200 rounded-lg bg-indigo-50">
                            <span className="text-sm font-medium text-indigo-800">
                              {(() => {
                                const d = draftScheduleByRoundId[activeRound.id].date!;
                                const [hh, mm] = draftScheduleByRoundId[activeRound.id].time
                                  .split(":")
                                  .map(Number);
                                const start = new Date(d);
                                start.setHours(hh, mm, 0, 0);
                                const end = new Date(start.getTime() + 60 * 60 * 1000);
                                const fmt = (dt: Date) =>
                                  dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                                return `${d.toLocaleDateString([], {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })} · ${fmt(start)} – ${fmt(end)}`;
                              })()}
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowAvailabilityModal(true)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 ml-3 shrink-0">
                              Change
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              //If attendees are 0 give tooltip to add attendees first
                              (activeRound.attendees?.length ?? 0) === 0
                            }
                            data-tooltip-id="my-tooltip"
                            data-tooltip-content={
                              (activeRound.attendees?.length ?? 0) === 0
                                ? "Please add attendees before selecting date and time"
                                : "Select the date and time for the interview"
                            }
                            onClick={() => setShowAvailabilityModal(true)}
                            className="w-full px-3 py-2.5 border border-dashed border-indigo-300 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition text-left flex items-center gap-2 disabled:cursor-not-allowed">
                            <CalendarCheck size={14} />
                            Select date &amp; time
                          </button>
                        )}
                      </div>


                      </>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="px-3 py-4 flex justify-end gap-3 border-t border-gray-200">
              {
                isActiveLatestRound ? (
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
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancel
                      </button>
                    ) : (
                      <>
                        {latestRound?.status !== "CANCELLED" &&
                          latestRound?.status !== "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() => setSidePanel("cancel")}
                              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                              Cancel Interview
                            </button>
                          )}

                        {latestRound?.status !== "CANCELLED" &&
                          latestRound?.status !== "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!latestRound) return;
                                setSidePanel("reschedule");
                              }}
                              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                              Reschedule
                            </button>
                          )}
                        {Date.now() <=
                          new Date(activeRound.scheduledAt).getTime() + 70 * 60 * 1000 && (
                          <button
                            type="button"
                            disabled={!latestJoinLink}
                            onClick={handleJoin}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg border ${
                              latestJoinLink
                                ? "text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                                : "text-gray-400 border-gray-200 cursor-not-allowed bg-white"
                            }`}>
                            Join
                          </button>
                        )}
                      </>
                    )}

                    {isDraftLatestRound && (
                      <button
                        type="button"
                        disabled={
                          isSubmitting ||
                          !draftScheduleByRoundId[activeRound.id]?.date ||
                          !draftScheduleByRoundId[activeRound.id]?.time ||
                          !activeRound.interviewType ||
                          (activeRound.interviewType === "__OTHER__" &&
                            !(activeRound.customInterviewType || "").trim())
                        }
                        onClick={handleScheduleSubmit}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                          isSubmitting ||
                          !draftScheduleByRoundId[activeRound.id]?.date ||
                          !draftScheduleByRoundId[activeRound.id]?.time ||
                          !activeRound.interviewType ||
                          (activeRound.interviewType === "__OTHER__" &&
                            !(activeRound.customInterviewType || "").trim())
                            ? "bg-gray-300 cursor-not-allowed text-white"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}>
                        {isSubmitting ? "Submitting" : "Submit"}
                      </button>
                    )}
                  </>
                ) : null
                // (
                //   <button
                //     type="button"
                //     onClick={onClose}
                //     className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                //   >
                //     Close
                //   </button>
                // )
              }
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Close
              </button>
            </div>
          </>
        )}
      </div>

      {showAvailabilityModal && activeRound && (
        <AvailabilitySchedulerModal
          attendees={modalAttendees}
          durationMinutes={60}
          initialDate={draftScheduleByRoundId[activeRound.id]?.date ?? null}
          initialTime={draftScheduleByRoundId[activeRound.id]?.time ?? ""}
          onSelect={(date, time) => {
            setDraftDate(activeRound.id, date);
            setDraftTime(activeRound.id, time);
            setShowAvailabilityModal(false);
          }}
          onClose={() => setShowAvailabilityModal(false)}
        />
      )}
    </>
  );
};

export default ScheduleInterviewSidebar;
