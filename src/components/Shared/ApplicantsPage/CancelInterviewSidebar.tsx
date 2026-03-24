import React, { useMemo, useState } from "react";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";

interface CancelInterviewSidebarProps {
  jobApplication: JobApplicationDetailsDto;
  roundNumber: number;
  onClose: () => void;
  onSubmit: (payload: { reason: string; feedback: string }) => void;
}

const REASONS = [
  "Candidate not available",
  "Interviewer not available",
  "Rescheduled",
  "Technical issue",
  "Other",
] as const;

const CancelInterviewSidebar: React.FC<CancelInterviewSidebarProps> = ({
  jobApplication,
  roundNumber,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [feedback, setFeedback] = useState("");

  const isValid = useMemo(() => Boolean(reason?.trim()), [reason]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cancel Interview</h2>
          <p className="mt-1 text-xs text-gray-500">
            Round {roundNumber} &bull; {jobApplication.applicantDetails?.name} &bull;{" "}
            {jobApplication.jobTitle}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">Reason</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900">
            Feedback (optional)
          </label>
          <textarea
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Add cancellation details (optional)."
          />
        </div>
      </div>

      <div className="px-3 py-4 border-t flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!isValid}
          onClick={() => onSubmit({ reason: reason.trim(), feedback: feedback.trim() })}
          className={`px-4 py-2 text-sm font-semibold text-white rounded-lg ${
            isValid ? "bg-red-600 hover:bg-red-700" : "bg-red-300 cursor-not-allowed"
          }`}
        >
          Confirm Cancel
        </button>
      </div>
    </div>
  );
};

export default CancelInterviewSidebar;

