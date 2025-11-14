import { FC, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import {
  InterviewDto,
  InterviewStatusType,
} from "@TypesAndConstants/Interview.dto";
import { useAppContext } from "@Context/App.context";

import NoDataPresent from "@Components/Shared/NoDataPresent";
import SmallGauge from "@Components/Shared/SmallGauge";
import interviewServiceObj from "@Services/Interview.service";

import { formatObjectForDisplay } from "@Utils/FormatText.utils";

interface VideoInterviewModalProps {
  onClose: () => void;
  isOpen: boolean;
  handleViewDetails: (interview:InterviewDto) => void;
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

const VideoInterviewModal: FC<VideoInterviewModalProps> = ({ onClose, isOpen,handleViewDetails }) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [expandedRequests, setExpandedRequests] = useState<Record<string, boolean>>({});
  const [isInitiating, setIsInitiating] = useState(false);
  const navigate = useNavigate();
  const { userDetails } = useAppContext();

  const fetchInterviews = async (): Promise<InterviewDto[]> => {
    if (!userDetails?.email) throw new Error("User email not found");

    const { response, error } = await interviewServiceObj.fetchInterviewList(userDetails.email);

    if (error) throw error;
    return response || [];
  };

  const {
    data: interviews = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interviews", userDetails?.email],
    queryFn: fetchInterviews,
    enabled: !!userDetails?.email && isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache time (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

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
      case "EXPIRED":
        return "bg-gray-100 text-gray-800";
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
      case "EXPIRED":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleInitiateInterview = async (interviewId: string) => {
    if (!userDetails?.email) {
      console.error("User email not found");
      toast.error("User email not found. Please log in again.");
      return;
    }

    setIsInitiating(true);
    try {
      const { response: initiatedInterview, error } = await interviewServiceObj.initiateInterview(
        userDetails.email
      );

      if (error) {
        console.error("Failed to initiate interview:", error);
        toast.error(error);
        setIsInitiating(false);
        return;
      }

      if (initiatedInterview) {
        console.log("Interview initiated successfully:", initiatedInterview);
        // Navigate to idle page with interview data - the idle page will load it into context
        navigate(`/interview/${initiatedInterview.id}`, {
          state: { interviewData: initiatedInterview },
        });
        onClose();
      }
    } catch (error) {
      console.error("Error initiating interview:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsInitiating(false);
    }
  };

  const handleContinueInterview = (interview: InterviewDto) => {
    // Navigate with interview data in state and ID in URL
    navigate(`/interview/${interview.id}?stage=continue`, { state: { interviewData: interview } });
    onClose();
  };


  const pendingInterviews = interviews.filter(
    (interview) => interview.status === "PENDING" || interview.status === "IN_PROGRESS"
  );

  const completedInterviews = interviews.filter((interview) => interview.status === "COMPLETED");

  // Check if there's a pending interview that can be continued
  const hasContinuableInterview = pendingInterviews.some((interview) => {
    const questionsAttempted = interview.interviewHistory?.length || 0;
    const hasPartialProgress = questionsAttempted > 0 || interview.status === "IN_PROGRESS";
    return hasPartialProgress;
  });

  // Check if user has completed an interview within last 3 months
  const canStartNewInterview = () => {
    if (pendingInterviews.length > 0) {
      // Has pending interview, can start/continue that one
      return true;
    }

    // Check if any completed interview is within 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentCompletedInterview = completedInterviews.find((interview) => {
      const completedDate = new Date(interview.updatedAt || interview.createdAt);
      return completedDate > threeMonthsAgo;
    });

    return !recentCompletedInterview;
  };

  const getNextAvailableDate = () => {
    if (completedInterviews.length === 0) return null;

    const latestCompleted = completedInterviews.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    })[0];

    const completedDate = new Date(latestCompleted.updatedAt || latestCompleted.createdAt);
    const nextAvailableDate = new Date(completedDate);
    nextAvailableDate.setMonth(nextAvailableDate.getMonth() + 3);

    return nextAvailableDate;
  };

  const isButtonDisabled = !canStartNewInterview() || isInitiating;
  const nextAvailableDate = getNextAvailableDate();

  const InterviewCard = ({
    interview,
    isPending = false,
  }: {
    interview: InterviewDto;
    isPending?: boolean;
  }) => {
    const isExpanded = expandedRequests[interview.id] || false;
    const hasRequests = interview.requestedBy && interview.requestedBy.length > 0;
    const questionsAttempted = interview.interviewHistory?.length || 0;
    const hasPartialProgress = questionsAttempted > 0 || interview.status === "IN_PROGRESS";
    const canContinue =
      (interview.status === "PENDING" || interview.status === "IN_PROGRESS") && hasPartialProgress;

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
                  Questions Attempted: {questionsAttempted}/{interview.totalQuestions}
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
                              {request.companyId || "Not Disclosed"}
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
                {interview.duration && (
                  <div>
                    <span className="text-gray-500">Duration:</span>{" "}
                    <span className="font-medium">
                      {formatInterviewDuration(interview.duration)}
                    </span>
                  </div>
                )}
               <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {isPending ? "Created" : "Completed"}:{" "}
                  {formatInterviewDate(isPending ? interview.createdAt : interview.updatedAt)}
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
            (interview.status === "PENDING" ||
              interview.status === "IN_PROGRESS") ? null : !isPending ? (
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
        ) : error ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600">Failed to load interviews</p>
              <p className="text-sm text-gray-500 mt-1">Please try again later</p>
            </div>
          </div>
        ) : interviews.length === 0 ? (
          <div className="space-y-6">
            <NoDataPresent />
            <div className="flex justify-center pt-4">
              <button
                onClick={() => handleInitiateInterview("")}
                disabled={isInitiating}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Play className="w-5 h-5 mr-2" />
                {isInitiating ? "Starting Interview..." : "Start Interview"}
              </button>
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
                    <InterviewCard key={interview.id} interview={interview} isPending />
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

            {/* Initiate Interview Button */}
            <div className="flex flex-col items-start pt-4 border-t border-gray-200 gap-3">
              {!canStartNewInterview() && nextAvailableDate && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 w-full max-w-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-yellow-800 mb-1">
                        Interview Cooldown Period
                      </p>
                      <p className="text-yellow-700">
                        You can take another interview after{" "}
                        <span className="font-semibold">
                          {nextAvailableDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  // Find the oldest pending/in-progress interview (by createdAt)
                  const sortedPendingInterviews = [...pendingInterviews].sort(
                    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                  );

                  const oldestPendingInterview = sortedPendingInterviews[0];

                  // Check if this interview can be continued (has partial progress)
                  if (oldestPendingInterview) {
                    const questionsAttempted = oldestPendingInterview.interviewHistory?.length || 0;
                    const hasPartialProgress =
                      questionsAttempted > 0 || oldestPendingInterview.status === "IN_PROGRESS";

                    if (hasPartialProgress) {
                      // Continue the existing interview
                      handleContinueInterview(oldestPendingInterview);
                    } else {
                      // Interview exists but no progress yet - initiate it
                      handleInitiateInterview(oldestPendingInterview.id);
                    }
                  } else {
                    // No pending interviews - start a new one
                    handleInitiateInterview("");
                  }
                }}
                disabled={isButtonDisabled}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400">
                <Play className="w-5 h-5 mr-2" />
                {isInitiating
                  ? "Starting Interview..."
                  : pendingInterviews.length > 0
                  ? hasContinuableInterview
                    ? "Continue Interview"
                    : "Start Pending Interview"
                  : "Start New Interview"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoInterviewModal;
