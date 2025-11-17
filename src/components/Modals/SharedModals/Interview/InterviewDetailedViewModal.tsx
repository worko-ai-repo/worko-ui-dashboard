import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { FC, useRef, useState } from "react";

import { formatObjectForDisplay } from "@Utils/FormatText.utils";
import { formatInterviewDuration } from "./VideoInterviewModal";
import MultiSegmentVideoPlayer, {
  MultiSegmentVideoPlayerHandle,
  SegmentTiming,
} from "@Components/Interview/MultiSegmentVideoPlayer";

interface InterviewDetailedViewModalProps {
  userName: string;
  interviewDetails: InterviewDto;
}
const InterviewDetailedViewModal: FC<InterviewDetailedViewModalProps> = ({
  userName,
  interviewDetails,
}) => {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [questionTimings, setQuestionTimings] = useState<SegmentTiming[]>([]);
  const videoPlayerRef = useRef<MultiSegmentVideoPlayerHandle | null>(null);

  const formatTimestamp = (seconds?: number) => {
    if (seconds === undefined || seconds === null) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleQuestion = (index: number) => {
    setExpandedQuestion(expandedQuestion === index ? null : index);
  };

  const findQuestionTiming = (
    questionId?: string,
    questionNumber?: number,
    questionText?: string,
    fallbackIndex?: number
  ) => {
    return questionTimings.find((timing, index) => {
      if (questionId && timing.questionId === questionId) {
        return true;
      }
      if (questionNumber && timing.questionNumber === questionNumber) {
        return true;
      }
      if (questionText && timing.questionText === questionText) {
        return true;
      }
      if (fallbackIndex !== undefined && index === fallbackIndex) {
        return true;
      }
      return false;
    });
  };

  const handleTimestampClick = (
    questionId?: string,
    questionNumber?: number,
    questionText?: string,
    fallbackIndex?: number
  ) => {
    const timing = findQuestionTiming(questionId, questionNumber, questionText, fallbackIndex);
    if (!timing || !videoPlayerRef.current) return;
    videoPlayerRef.current.seekToTime(timing.startTime);
  };

  return (
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-6 capitalize">{userName}</h1>

        {/* First Row - 70/30 split */}
        <div className="grid grid-cols-10  gap-6 mb-6">
          {/* Left side - Video player (70%) */}
          <div className="col-span-7 bg-gray-900 rounded-lg overflow-hidden relative h-[350px]">
            <MultiSegmentVideoPlayer
              ref={videoPlayerRef}
              interviewId={interviewDetails.id}
              onSegmentTimingsChange={setQuestionTimings}
            />
          </div>

          {/* Right side - Overall Score (30%) */}
          <div className="col-span-3 bg-white flex flex-col justify-between rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-start gap-2 mb-4">
              <div className="flex items-center gap-2 ">
                {" "}
                <h2 className="text-xl font-semibold text-gray-700">Overall Score</h2>
                <Info className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-6xl font-bold text-gray-800 mb-8">
                {interviewDetails?.score}%
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-400">Interview date:</span>
                <span className="font-semibold text-gray-800">
                  {interviewDetails?.initiatedAt
                    ? new Date(interviewDetails.initiatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-gray-400">Interview duration:</span>
                <span className="font-semibold text-gray-800">
                  {formatInterviewDuration(interviewDetails.duration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row - Score Breakdown */}
        <div className="flex items-center  rounded-lg  p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 ">Scores: &nbsp;</h3>
          <div className="flex justify-evenly p-3 rounded-lg gap-6 bg-cyan-100 flex-1  ">
            {formatObjectForDisplay(interviewDetails.scoreBreakdown || {}).map(
              ({ label, value }, index) => (
                <div key={index}>
                  <span className="text-md font-semibold text-gray-400 mr-2">{label}</span>
                  <span className={`text-sm text-blue-500 font-semibold`}>{value}%</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Third Row - Questions Table */}
        <div className="bg-white relative rounded-lg shadow-lg overflow-hidden max-h-[300px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-gray-700 text-sm w-[13%]">
                  Question start
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700 text-sm w-[43%]">
                  Questions
                </th>
                <th className="px-6 py-4 text-center font-semibold text-gray-700 text-sm w-[44%]">
                  AI Feedback
                </th>
              </tr>
            </thead>
            <tbody>
              {interviewDetails?.interviewHistory &&
              interviewDetails.interviewHistory.length > 0 ? (
                interviewDetails.interviewHistory.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors border-gray-200">
                    <td className="px-6 py-4 align-top border-r border-blue-300">
                      {(() => {
                        const timing = findQuestionTiming(item.questionId, undefined, item.questionText, index);
                        const label = timing ? formatTimestamp(timing.startTime) : "N/A";
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              handleTimestampClick(item.questionId, undefined, item.questionText, index)
                            }
                            disabled={!timing}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                              timing
                                ? "bg-cyan-100 text-cyan-700 hover:bg-cyan-200"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}>
                            {label}
                          </button>
                        );
                      })()}
                    </td>

                    <td className="px-6 py-4 align-top text-center border-r border-blue-300">
                      <div className="font-medium text-gray-800 mb-2">{item.questionText}</div>
                      <button
                        onClick={() => toggleQuestion(index)}
                        className="flex mx-auto bg-cyan-100 rounded-full px-3 py-1 items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors">
                        {expandedQuestion === index ? "Hide answer" : "Read answer"}
                        {expandedQuestion === index ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      {expandedQuestion === index && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                          {item.userAnswer || "No answer provided"}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-2 mb-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.isCorrect
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                          {item.isCorrect ? "Correct" : "Needs Improvement"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {item.feedback || "Feedback pending"}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <p className="text-gray-500 text-sm">No interview questions available</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
  );
};

export default InterviewDetailedViewModal;
