import React from "react";
import { ChevronDownIcon, Info } from "lucide-react";

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
    {
      timestamp: "10:21",
      question: "How do you see this opportunity?",
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
      <h2 className="text-xl font-semibold text-left mb-4">{dummyData.candidateName}</h2>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Video Section */}
        <div className="flex-[3] rounded-xl overflow-hidden">
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
        <div className="flex-[2] bg-[#F8FAFC] p-12 rounded-xl flex flex-col justify-between w-full min-w-[250px] md:max-w-[300px]">
          <div className="flex flex-col gap-2 text-start">
            <p className="text-sm">
              Overall Score <Info className="inline w-4 h-4 ml-1 text-blue-500" />
            </p>
            <p className="text-4xl font-bold text-gray-900">{dummyData.overallScore}%</p>
          </div>
          <div className="text-start mt-6 space-y-2">
            <div className="whitespace-nowrap flex">
              <span className="text-sm text-[#94A3B8]">Interview date :</span>
              <span className="text-base ml-2 text-gray-700 font-medium">{dummyData.interviewDate}</span>
            </div>
            <div className="whitespace-nowrap flex">
              <span className="text-sm text-[#94A3B8]">Interview time :</span>
              <span className="text-base ml-2 text-gray-700 font-medium">{dummyData.interviewTime}</span>
            </div>
          </div>

        </div>
      </div>


      {/* Scores Section */}
      <div className="mt-6 text-sm">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg text-gray-700 whitespace-nowrap pt-1">Scores :</h2>
          <div className="flex flex-wrap gap-4 rounded-2xl bg-[#EFFFFF] p-4 text-[#94A3B8] w-full">
            {dummyData.scores.map((score, index) => (
              <div key={`${score.label}-${index}`} className="whitespace-nowrap">
                {score.label}
                <span className="ml-2 text-blue-500 font-medium">{score.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QA Table */}
      <div className="mt-6 max-h-[400px] overflow-y-auto py-6 pt-0 rounded-xl bg-[#FCFCFC]">
        {/* Header Row */}
        <div className="pt-6 bg-[#FCFCFC]">
          <div className="grid grid-cols-[1fr_2fr_2fr] text-sm text-center text-gray-500 ">
            <p className="border-r border-gray-300 px-6 py-3">Timestamps</p>
            <p className="border-r border-gray-300 px-6 py-3">Questions</p>
            <p className="px-6 py-3">Feedback</p>
          </div>
        </div>

        {/* Feedback Rows */}
        {dummyData.feedbackList.map((entry, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_2fr_2fr] text-sm text-gray-700"
          >
            <div className="border-r border-gray-300 px-6 py-4 text-blue-600 font-semibold flex justify-center items-center">
              <span className="bg-[#CDFFFF] px-9 py-2 rounded-2xl">
                {entry.timestamp}
              </span>
            </div>
            <div className="border-r border-gray-300 px-6 py-4">
              <p className="font-medium text-gray-800">{entry.question}</p>
              <div className="w-full flex justify-center mt-2">
                <button className="flex items-center text-blue-600 border px-2 py-1 rounded-full text-sm">
                  Read answer
                  <ChevronDownIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 text-black">{entry.feedback}</div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default InterviewFeedbackCard;
