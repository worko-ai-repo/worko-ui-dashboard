import React, { useState } from "react";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";

interface InterviewSubmissionSidebarProps {
  jobApplication: JobApplicationDetailsDto;
  roundId: string;
  onClose: () => void;
  onSubmitted?: (payload: { roundId: string; feedback: string; rating: number | null }) => void;
}

const InterviewSubmissionSidebar: React.FC<InterviewSubmissionSidebarProps> = ({
  jobApplication,
  roundId,
  onClose,
  onSubmitted,
}) => {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number | null>(null);

  const handleSubmit = () => {
    const payload = {
      jobApplicationId: jobApplication.id,
      jobId: jobApplication.jobId,
      applicantName: jobApplication.applicantDetails?.name,
      applicantEmail: jobApplication.applicantDetails?.email,
      roundId,
      feedback: feedback.trim(),
      rating,
    };

    // Placeholder for future API integration
    // eslint-disable-next-line no-console
    console.log("Interview Feedback Submission Payload:", payload);

    onSubmitted?.({ roundId, feedback: feedback.trim(), rating });
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Interview Feedback</h2>
          <p className="mt-1 text-xs text-gray-500">
            {jobApplication.applicantDetails?.name} &bull; {jobApplication.jobTitle}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">Rating (optional)</label>
          <select
            value={rating ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setRating(value ? Number(value) : null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select rating</option>
            {[1, 2, 3, 4, 5].map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Feedback / Notes
          </label>
          <textarea
            rows={5}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter interview feedback, strengths, concerns, and recommendation."
          />
        </div>
      </div>

      <div className="px-3 py-4 border-t flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default InterviewSubmissionSidebar;

