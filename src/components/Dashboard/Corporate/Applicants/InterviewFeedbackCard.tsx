import React from "react";
import { Info } from "lucide-react";

// Types
interface Score {
  label: string;
  value: number;
}

interface QAFeedback {
  timestamp: string;
  question: string;
  feedback: string;
}

interface InterviewData {
  candidateName: string;
  videoUrl: string;
  posterUrl: string;
  overallScore: number;
  interviewDate: string;
  interviewTime: string;
  scores: Score[];
  feedbackList: QAFeedback[];
}

// Dummy static data
const dummyData: InterviewData = {
  candidateName: "Avijit Dutta Gupta",
  videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
  posterUrl: "https://dummyimage.com/640x360/cccccc/000000&text=Interview+Video",
  overallScore: 85,
  interviewDate: "12-05-2025",
  interviewTime: "7:20 AM",
  scores: [
    { label: "Confidence", value: 71 },
    { label: "Attitude", value: 60 },
    { label: "Domain knowledge", value: 86 },
    { label: "Comm skill", value: 70 },
  ],
  feedbackList: [
    {
      timestamp: "2:38",
      question: "What is your experience?",
      feedback:
        "You are currently performing well and your responses are clear and concise. To improve, consider incorporating more context and details when answering questions, and perhaps offer alternative perspectives or solutions where appropriate.",
    },
    {
      timestamp: "10:21",
      question: "How do you see this opportunity?",
      feedback:
        "You are currently performing well and your responses are clear and concise. To improve, consider incorporating more context and details when answering questions, and perhaps offer alternative perspectives or solutions where appropriate.",
    },
  ],
};

const InterviewFeedbackCard = () => {
  return (
    <div className="w-full max-w-5xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Video Section */}
        <div className="flex-1 rounded-xl overflow-hidden">
          <video
            controls
            poster={dummyData.posterUrl}
            className="w-full h-full rounded-xl"
          >
            <source src={dummyData.videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Score Section */}
        <div className="bg-[#F8FAFC] p-4 rounded-xl w-full md:w-64 flex flex-col justify-between">
          <div>
            <p className="text-sm text-gray-500">Overall Score <Info className="inline w-4 h-4 ml-1 text-gray-400" /></p>
            <p className="text-4xl font-bold text-gray-900">{dummyData.overallScore}%</p>
          </div>
          <div className="mt-6">
            <p className="text-sm text-gray-500">Interview date :</p>
            <p className="text-base text-gray-700 font-medium">{dummyData.interviewDate}</p>
            <p className="text-sm text-gray-500 mt-2">Interview time :</p>
            <p className="text-base text-gray-700 font-medium">{dummyData.interviewTime}</p>
          </div>
        </div>
      </div>

      {/* Scores Section */}
      <div className="flex flex-wrap items-center gap-4 mt-6 text-sm">
        <p className="font-medium text-gray-700">Scores :</p>
        {dummyData.scores.map((score) => (
          <span
            key={score.label}
            className="bg-[#EBF8FF] text-blue-600 px-3 py-1 rounded-full"
          >
            {score.label} {score.value}%
          </span>
        ))}
      </div>

      {/* QA Table */}
      <div className="mt-6 bg-[#F9FBFC] rounded-xl max-h-72 overflow-y-auto">
        <div className="grid grid-cols-3 text-left text-sm text-gray-500 px-6 py-3 border-b sticky top-0 bg-[#F9FBFC] z-10">
          <p>Timestamps</p>
          <p>Questions</p>
          <p>Feedback</p>
        </div>

        {dummyData.feedbackList.map((entry, index) => (
          <div
            key={index}
            className="grid grid-cols-3 px-6 py-4 border-b text-sm bg-white"
          >
            <div className="text-blue-600 font-medium">{entry.timestamp}</div>
            <div>
              <p className="text-gray-700 font-medium">{entry.question}</p>
              <button className="text-blue-600 text-sm mt-1 underline">
                Read answer
              </button>
            </div>
            <div className="text-gray-600">{entry.feedback}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InterviewFeedbackCard;
