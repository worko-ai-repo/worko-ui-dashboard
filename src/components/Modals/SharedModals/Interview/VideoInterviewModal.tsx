import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Calendar,
  Clock,
  Play,
  Building2,
  User,
  Trophy,
  AlertCircle,
  X,
  ChevronDown,
  Eye,
} from "lucide-react";
import { InterviewDto, InterviewStatusType } from "@TypesAndConstants/Interview.dto";
import { useAppContext } from "@Context/App.context";

import NoDataPresent from "@Components/Shared/NoDataPresent";
import SmallGauge from "@Components/Shared/SmallGauge";
import interviewServiceObj from "@Services/Interview.service";

import { formatObjectForDisplay } from "@Utils/FormatText.utils";
import { getToastOptions } from "lib-worko-ui";

interface VideoInterviewModalProps {
  onClose: () => void;
  isOpen: boolean;
  handleViewDetails: (interview: InterviewDto) => void;
  interviews: InterviewDto[];
  isLoading: boolean;
}

/**
 * formatInterviewDuration
 * @param duration in milliseconds
 * @returns
 */
export const formatInterviewDuration = (duration?: number): string => {
  if (!duration) return "N/A";
  const totalSeconds = Math.round(duration / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

/**
 * formatInterviewDate
 * @param dateString
 * @returns
 */
export const formatInterviewDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isInterviewRequestOnly = (interview: InterviewDto) => {
  return (
    interview.totalQuestions === 0 &&
    (!interview.interviewHistory || interview.interviewHistory.length === 0)
  );
};

const VideoInterviewModal: FC<VideoInterviewModalProps> = ({
  onClose,
  isOpen,
  handleViewDetails,
  interviews,
  isLoading,
}) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});
  const { userDetails } = useAppContext();
  const basePath = import.meta.env.APP_PROXY_DASH ? `/${import.meta.env.APP_PROXY_DASH}` : "";

  const openInterviewWindow = (relativePath: string) => {
    const interviewUrl = `${basePath}${relativePath}`;
    const newWindow = window.open(interviewUrl, "_blank");

    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      toast.error("Popup blocked! Please allow popups for this site.");
    }
  };

  const handleRequestedInterviewStart = () => {
    openInterviewWindow(`/interview/new?stage=new`);
    onClose();
  };

  useEffect(() => {
    let animateInTimer: number;
    let animateOutTimer: number;

    if (isOpen) {
      setVisible(true);
      animateInTimer = window.setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
    } else {
      setIsAnimatingIn(false);
      animateOutTimer = window.setTimeout(() => {
        setVisible(false);
      }, 300);
    }

    return () => {
      clearTimeout(animateInTimer);
      clearTimeout(animateOutTimer);
    };
  }, [isOpen]);

  const toggleRequestExpansion = (interviewId: string) => {
    setExpandedRequests((prev) => ({
      ...prev,
      [interviewId]: !prev[interviewId],
    }));
  };

  const getStatusColor = (status: InterviewStatusType): string => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: InterviewStatusType) => {
    switch (status) {
      case "COMPLETED":
        return <Trophy className="w-4 h-4" />;
      case "IN_PROGRESS":
        return <Play className="w-4 h-4" />;
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "CANCELLED":
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const pendingInterviews = interviews.filter(
    (interview) => interview.status === "PENDING" || interview.status === "IN_PROGRESS"
  );

  const completedInterviews = interviews.filter(
    (interview) => interview.status === "COMPLETED" || interview.status === "CLOSED"
  );

  const InterviewCard = ({
    interview,
    onInitiateRequest,
  }: {
    interview: InterviewDto;
    onInitiateRequest?: (interview: InterviewDto) => void;
  }) => {
    // Determine if interview is pending or in progress
    const isPending = interview.status === "PENDING" || interview.status === "IN_PROGRESS";
    const isExpanded = expandedRequests[interview.id] || false;
    const hasRequests = interview.requestedBy && interview.requestedBy.length > 0;
    const questionsAttempted =
      interview.interviewHistory?.filter((history) => history.chunkUploadStatus === "UPLOADED")
        .length || 0;
    const questionsManullaySkipped = interview.interviewHistory?.filter(
      (history) => history.userAnswer.trim() === "Candidate skipped the question" || history.userAnswer.trim() === ""
    ).length || 0;
    debugger
    const totalAttempted = questionsAttempted - questionsManullaySkipped;

    const hasPartialProgress = questionsAttempted > 0 || interview.status === "IN_PROGRESS";
    const canContinue =
      (interview.status === "PENDING" || interview.status === "IN_PROGRESS") && hasPartialProgress;
    const isRequestOnly = isInterviewRequestOnly(interview);

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
        {/* Main Card Content */}
        <div className="flex items-start gap-4">
          {/* Left side - Gauge */}
          {!isPending && (
            <div className="flex-shrink-0">
              <SmallGauge score={interview.score} size={70} strokeWidth={7} />
            </div>
          )}

          {/* Middle - Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                  interview.status
                )}`}>
                {getStatusIcon(interview.status)}
                {interview.status.replace("_", " ")}
              </span>
              {isPending ? (
                <span className="text-sm text-gray-500">{interview.totalQuestions} questions</span>
              ) : (
                <span className="text-sm text-gray-500">
                  Questions Attempted: {totalAttempted}/{interview.totalQuestions}
                </span>
              )}
            </div>

            {/* Company Requests Dropdown */}
            {hasRequests && (
              <div className="mb-3" onClick={() => toggleRequestExpansion(interview.id)}>
                <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 transition-colors w-full">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 flex-shrink-0 -rotate-90" />
                  )}
                  <span className="font-medium">
                    Requested by {interview.requestedBy!.length}{" "}
                    {interview.requestedBy!.length === 1 ? "company" : "companies"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-2 ml-6 space-y-2">
                    {interview.requestedBy!.map((request, index: number) => (
                      <div key={index} className="bg-white rounded-md p-3 border border-gray-200">
                        <div className="flex items-start gap-2">
                          <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 text-sm">
                            <div className="font-medium text-gray-900">
                              {request.companyName || "Not Disclosed"}
                            </div>
                            <div className="text-gray-600 mt-1">
                              Position: {request.position || "Not Disclosed"}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              Requested: {formatInterviewDate(request.requestedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isPending && isRequestOnly && (
              <div className="mb-3 flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-blue-600" />
                <div>
                  This interview was requested by{" "}
                  <span className="font-semibold">
                    {interview.requestedBy?.[0]?.companyName || "a recruiter"}
                  </span>
                  . Start now to respond to the request.
                </div>
              </div>
            )}

            {/* Score Breakdown for Completed */}
            {!isPending && interview.scoreBreakdown && (
              <div className="mb-3 bg-white rounded-md p-2 border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Score Breakdown:</div>
                <div className="flex flex-wrap gap-3 text-xs">
                  {formatObjectForDisplay(interview.scoreBreakdown).map(({ label, value }) => (
                    <span key={label} className="text-gray-700">
                      <span className="font-medium">{label}:</span> {value}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics */}
            {!isPending && (
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                  {interview.status
                    .toLowerCase()
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (char) => char.toUpperCase())}
                  : {formatInterviewDate(isPending ? interview.createdAt : interview.updatedAt)}
                  </span>
                </div>
                </div>
            )}

            {/* Footer Info */}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              {interview.userFeedback && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Rating: {interview.userFeedback.rating}/5</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Action Button */}
          <div className="flex-shrink-0">
            {isPending &&
            (interview.status === "PENDING" || interview.status === "IN_PROGRESS") ? (
              isRequestOnly ? (
                <button
                  onClick={() => onInitiateRequest?.(interview)}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors duration-200">
                  <Play className="w-4 h-4 mr-1" />
                  Start Interview
                </button>
              ) : null
            ) : interview.status === "COMPLETED" ? (
              <button
                onClick={() => handleViewDetails(interview)}
                className="inline-flex items-center px-4 py-2 border shadow-2xl bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200">
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}>
      <div
        className={`bg-white rounded-l-lg p-6 w-full max-w-4xl relative transform transition-transform duration-300 ease-in-out self-auto max-h-[90vh] overflow-y-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 z-10">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 pr-8">Video Interviews</h2>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading interviews...</span>
          </div>
        ) : interviews.length === 0 ? (
          <div className="space-y-6">
            <NoDataPresent />
            <div className="text-center text-gray-500 text-sm">
              No interviews found. Start your first interview from your profile.
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending/In Progress Interviews */}
            {pendingInterviews.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending Interviews</h3>
                <div className="space-y-3">
                  {pendingInterviews.map((interview) => (
                    <InterviewCard
                      key={interview.id}
                      interview={interview}
                      onInitiateRequest={(_interview) => handleRequestedInterviewStart()}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Interviews */}
            {completedInterviews.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Interview History</h3>
                <div className="space-y-3">
                  {completedInterviews.map((interview) => (
                    <InterviewCard key={interview.id} interview={interview} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoInterviewModal;
