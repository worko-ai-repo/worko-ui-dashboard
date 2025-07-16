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

  // In real implementation, uncomment this
  // const { data, isLoading, error } = useQuery({
  //   queryKey: ["evaluation-responses", jobApplicationId],
  //   queryFn: async () => {
  //     const response = await CorporateServiceObj.getEvaluationResponses({ jobApplicationId });
  //     return response?.data || [];
  //   },
  //   enabled: !!jobApplicationId,
  // });

  const responses = MOCK_DATA;
  const isLoading = false;
  const error = null;

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading evaluations</div>;
  if (!responses || responses.length === 0) return <div>No evaluations found</div>;

  const currentEvaluation = responses[activeTab];
  const latest = currentEvaluation?.statusTracker?.[currentEvaluation.statusTracker.length - 1];
  const interviews = currentEvaluation?.scheduledInterviewDetails || [];

  return (
    <div className="w-full max-w-md mx-auto  bg-white overflow-hidden">
      {/* Tab Headers */}
      <div className="flex">
  {responses.map((response, index) => (
    <div key={response.id} className="flex items-center">
      <button
        onClick={() => setActiveTab(index)}
        className={`px-4 py-3 text-sm font-semibold ${
          index === activeTab ? 'text-black border-b-2 border-black' : 'text-gray-400'
        }`}
        style={{ fontFamily: 'Poppins' }}
      >
        Evaluator {index + 1}
      </button>

      {/* Vertical separator (not after last tab) */}
      {index < responses.length - 1 && (
        <div className="w-px h-5 bg-gray-300 mx-1" />
      )}
    </div>
  ))}
</div>


      {/* Vertical separator for tabs */}
      {responses.length > 1 && (
        <div className="absolute w-px h-5 bg-gray-300 left-1/2 transform -translate-x-1/2 top-6"></div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {/* Evaluator Info Section */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: 'Inter' }}>
              Evaluated by
            </span>
            <span className="text-gray-900 text-xs font-medium" style={{ fontFamily: 'Poppins' }}>
              {currentEvaluation.evaluatorName}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: 'Inter' }}>
              Date
            </span>
            <span className="text-gray-900 text-xs font-medium" style={{ fontFamily: 'Poppins' }}>
              {new Date(currentEvaluation.createdAt).toLocaleDateString('en-GB')}
            </span>
          </div>
          
          {latest?.score !== undefined && (
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: 'Inter' }}>
                Evaluation score
              </span>
              <span className="text-gray-900 text-xs font-medium" style={{ fontFamily: 'Poppins' }}>
                {latest.score}/5
              </span>
            </div>
          )}
          
          {latest?.detailedFeedback && (
            <div className="flex items-start gap-3">
              <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: 'Inter' }}>
                Feedback
              </span>
              <span className="text-gray-900 text-xs font-normal leading-tight max-w-xs" style={{ fontFamily: 'Poppins' }}>
                {latest.detailedFeedback}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-medium" style={{ fontFamily: 'Inter' }}>
              Schedule interview
            </span>
            <span className="text-gray-900 text-xs font-medium" style={{ fontFamily: 'Poppins' }}>
              {interviews.length > 0 ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Availability Schedule Section */}
        {interviews.length > 0 && (
  <div className=" flex justify-between items-start ">
    <span className="text-gray-500 text-xs font-medium " style={{ fontFamily: 'Inter' }}>
      Availability Schedule
    </span>

    <div className="flex flex-col w-1/2 gap-2 ">
      {/* Table Headers */}
      <div className="flex text-gray-500 text-xs font-medium mb-2" style={{ fontFamily: 'Inter' }}>
        <div className="w-1/2">Date</div>
        <div className="w-1/2">Time</div>
      </div>

      {/* Table Rows */}
      <div className="space-y-2">
        {interviews.map((interview, index) => (
          <div key={index} className="flex">
            <div className="w-1/2">
              <div className="bg-cyan-100 rounded-[9px] px-3  inline-block">
                <span className="text-black text-xs font-medium" style={{ fontFamily: 'Inter' }}>
                  {new Date(interview.date).toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
            <div className="w-1/2">
              <div className="bg-cyan-100 rounded-[9px] px-3  inline-block">
                <span className="text-black text-xs font-medium" style={{ fontFamily: 'Inter' }}>
                  {interview.startTime}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}


        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-[10px] text-xs font-semibold"
            style={{ fontFamily: 'Poppins' }}
            onClick={() => window.open("https://www.figma.com/proto/ENzqo1AmC80w4cmN6alJgz/Worko-Dashboards?node-id=156-6188")}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2L13 8L2 14V2Z" fill="white"/>
            </svg>
            Process interview
          </button>
          
          <button
            className="flex items-center gap-2 border border-red-500 text-red-500 px-4 py-2 rounded-[10px] text-xs font-semibold"
            style={{ fontFamily: 'Poppins' }}
            onClick={() => alert("Reject action")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Reject
          </button>
          
          <button
            className="flex items-center gap-2 border border-green-500 text-green-500 px-4 py-2 rounded-[10px] text-xs font-semibold"
            style={{ fontFamily: 'Poppins' }}
            onClick={() => alert("Hire action")}
          >
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Hire
          </button>
        </div>
      </div>

      {/* Expand/Collapse Button */}
      <button className="absolute top-4 right-4 w-5 h-5 bg-white rounded shadow-md flex items-center justify-center">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 1V11M1 6H11" stroke="#316BFF" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
};

export default ResponseEvaluation;