import { FC } from "react";

interface WithdrawRefferralModalProps {
  reason: string;
  comments: string;
  setReason: (reason: string) => void;
  setComments: (comments: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

const WithdrawRefferralModal: FC<WithdrawRefferralModalProps> = ({
  reason,
  comments,
  setReason,
  setComments,
  onSubmit,
  onClose,
}) => {
  const options = [
    "Got referral from somewhere else",
    "Don’t want to pursue this role",
    "Got job already",
    "Raised by mistake",
    "Others"
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 relative">

        {/* Cancel button (top right) */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>

        <h2 className="text-lg font-semibold mb-4">Withdraw Request</h2>

        {/* Dropdown */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a reason</option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Textarea */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Comments (optional)</label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Any additional comments..."
        />

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          Submit
        </button>
      </div>
    </div>
  );
};

export default WithdrawRefferralModal;
