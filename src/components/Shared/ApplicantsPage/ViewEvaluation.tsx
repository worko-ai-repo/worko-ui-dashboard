import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Mock data structure based on your provided interface
const MOCK_DATA = [
  {
    id: "01JZAWEYNEM7BJPCTB79P0ZGGH",
    evaluatorName: "Sam Das",
    jobId: "01JYZP3SKMZTSRSBVDCEN5W5N5",
    jobApplicationId: "01JZ851T8XBSMHCMH5Z213XETC",
    status: "INTERVIEW_SCHEDULED",
    companyId: "01JWAQF1G96E0SE9XHXSFGHNWW",
    createdAt: "2025-04-24T14:11:49.551Z",
    updatedAt: "2025-04-24T14:11:49.551Z",
    applicantUserId: "e1134dca-6071-70ff-2941-54fcce656f38",
    evaluationRequesterCorporateUserId: "5HJEPQMC51E3SGPFFT1Z2RFKVZ",
    createdByUserEmail: "rohith.appala@worko.ai",
    evaluationRequestId: "01JZAWB03PBJD3VWSAN5CMF044",
    statusTracker: [
      {
        detailedFeedback: "Normal feedback can be positive, constructive, or negative, and it can be formal or informal. Effective feedback is respectful, tactful, and non-threatening.",
        score: 2,
        htmlDetailedFeedback: "<p>Normal feedback can be positive, constructive, or negative, and it can be formal or informal. Effective feedback is respectful, tactful, and non-threatening.</p>",
        newStatus: "INTERVIEW_SCHEDULED",
        actionDate: "2025-04-24T14:11:49.508+00:00",
      },
    ],
    scheduledInterviewDetails: [
      {
        date: "2025-05-24",
        startTime: "7:00 pm",
        endTime: "8:00 pm",
        availability: 1,
        actionDate: "2025-05-24T11:36:46.753Z",
        timeSlot: "60 mins",
      },
      {
        date: "2025-05-24",
        startTime: "7:00 pm",
        endTime: "8:00 pm",
        availability: 1,
        actionDate: "2025-05-24T11:36:46.753Z",
        timeSlot: "60 mins",
      },
    ],
  },
  {
    id: "01JZAWEYNEM7BJPCTB79P0ZGGJ",
    evaluatorName: "Jane Smith",
    jobId: "01JYZP3SKMZTSRSBVDCEN5W5N5",
    jobApplicationId: "01JZ851T8XBSMHCMH5Z213XETC",
    status: "PENDING",
    companyId: "01JWAQF1G96E0SE9XHXSFGHNWW",
    createdAt: "2025-04-25T14:11:49.551Z",
    updatedAt: "2025-04-25T14:11:49.551Z",
    applicantUserId: "e1134dca-6071-70ff-2941-54fcce656f38",
    evaluationRequesterCorporateUserId: "5HJEPQMC51E3SGPFFT1Z2RFKVZ",
    createdByUserEmail: "jane.smith@worko.ai",
    evaluationRequestId: "01JZAWB03PBJD3VWSAN5CMF045",
    statusTracker: [
      {
        detailedFeedback: "Candidate shows strong technical skills but needs improvement in communication. Overall performance is above average with room for growth.",
        score: 4,
        htmlDetailedFeedback: "<p>Candidate shows strong technical skills but needs improvement in communication. Overall performance is above average with room for growth.</p>",
        newStatus: "PENDING",
        actionDate: "2025-04-25T14:11:49.508+00:00",
      },
    ],
    scheduledInterviewDetails: [],
  },
];

interface Props {
  jobApplicationId: string;
}

const ResponseEvaluation: React.FC<Props> = ({ jobApplicationId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const responses = MOCK_DATA;
  const isLoading = false;
  const error = null;

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading evaluations</div>;
  if (!responses || responses.length === 0) return <div>No evaluations found</div>;

  const currentEvaluation = responses[activeTab];
  const latest = currentEvaluation?.statusTracker?.[currentEvaluation?.statusTracker?.length - 1] || null;
  const interviews = currentEvaluation?.scheduledInterviewDetails || [];

  return (
    <div className="w-full max-w-md mx-auto bg-white overflow-hidden">
      {/* Tab Headers */}
      <div className="flex">
        {responses.map((response, index) => (
          <div key={response.id} className="flex items-center">
            <button onClick={() => setActiveTab(index)} className={`px-4 py-3 text-sm font-semibold ${index === activeTab ? "text-black border-b-2 border-black" : "text-gray-400"}`} style={{ fontFamily: "Poppins" }}>
              Evaluator {index + 1}
            </button>

            {/* Vertical separator (not after last tab) */}
            {index < responses.length - 1 && <div className="w-px h-5 bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Evaluator Info Section */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: "Inter" }}>
              Evaluated by
            </span>
            <span className="text-gray-900 text-xs font-medium" style={{ fontFamily: "Poppins" }}>
              {currentEvaluation?.evaluatorName || "N/A"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: "Inter" }}>
              Date
            </span>
            <span className="text-gray-900 text-xs font-medium" style={{ fontFamily: "Poppins" }}>
              {currentEvaluation?.createdAt ? new Date(currentEvaluation.createdAt).toLocaleDateString("en-GB") : "N/A"}
            </span>
          </div>

          {latest?.score !== undefined && (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: "Inter" }}>
                Evaluation score
              </span>
              <span className="text-gray-900 text-xs font-medium" style={{ fontFamily: "Poppins" }}>
                {latest.score}/5
              </span>
            </div>
          )}

          {latest?.detailedFeedback && (
            <div className="flex items-start gap-3">
              <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: "Inter" }}>
                Feedback
              </span>
              <span className="text-gray-900 text-xs font-normal leading-tight max-w-xs" style={{ fontFamily: "Poppins" }}>
                {latest.detailedFeedback}
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: "Inter" }}>
              Schedule interview
            </span>
            <span className="text-gray-900 text-xs font-medium" style={{ fontFamily: "Poppins" }}>
              {interviews.length > 0 ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Availability Schedule Section */}
        {interviews.length > 0 && (
          <div className="flex justify-between items-start">
            <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: "Inter" }}>
              Availability Schedule
            </span>

            <div className="flex flex-col w-1/2 gap-2">
              {/* Table Headers */}
              <div className="flex text-gray-500 text-xs font-medium mb-2" style={{ fontFamily: "Inter" }}>
                <div className="w-1/2">Date</div>
                <div className="w-1/2">Time</div>
              </div>

              {/* Table Rows */}
              <div className="space-y-2">
                {interviews.map((interview, index) => (
                  <div key={index} className="flex">
                    <div className="w-1/2">
                      <div className="bg-cyan-100 rounded-[9px] px-3 inline-block">
                        <span className="text-black text-xs font-medium" style={{ fontFamily: "Inter" }}>
                          {interview.date ? new Date(interview.date).toLocaleDateString("en-GB") : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="w-1/2">
                      <div className="bg-cyan-100 rounded-[9px] px-3 inline-block">
                        <span className="text-black text-xs font-medium" style={{ fontFamily: "Inter" }}>
                          {interview.startTime || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseEvaluation;
