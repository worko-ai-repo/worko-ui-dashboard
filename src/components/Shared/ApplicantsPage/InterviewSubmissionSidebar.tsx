import React, { useState } from "react";
interface InterviewSubmissionSidebarProps {
  name : string;
  jobTitle : string;
  roundId: string;
  onClose: () => void;
  onSubmitted?: (payload: {
    roundId: string;
    feedback: string;
    rating: number | null;
  }) => void | Promise<void>;
}

const InterviewSubmissionSidebar: React.FC<InterviewSubmissionSidebarProps> = ({
  name,
  jobTitle,
  roundId,
  onClose,
  onSubmitted,
}) => {
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await Promise.resolve(onSubmitted?.({ roundId, feedback: feedback.trim(), rating }));
      onClose();
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-3 py-4 border-b">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Interview Feedback</h2>
          <p className="mt-1 text-xs text-gray-500">
            {name} &bull; {jobTitle}
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
          disabled={isSubmitting}
          type="button"
          onClick={handleSubmit}
          className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition
            ${isSubmitting
              ? "bg-indigo-300 cursor-not-allowed opacity-70"
              : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {isSubmitting ? "Submitting" : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default InterviewSubmissionSidebar;

