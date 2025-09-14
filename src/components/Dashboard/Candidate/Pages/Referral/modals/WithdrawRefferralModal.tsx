import { SendIcon } from "lucide-react";
import { FC, useEffect, useState } from "react"; 



interface WithdrawRefferralModalProps {
  reason: string;
  comments: string;
  setReason: (reason: string) => void;
  setComments: (comments: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const WithdrawRefferralModal: FC<WithdrawRefferralModalProps> = ({
  reason,
  comments,
  setReason,
  setComments,
  onSubmit,
  onClose,
  isOpen,
}) => {
  const options = [
    "Got referral from somewhere else",
    "Don’t want to pursue this role",
    "Got job already",
    "Raised by mistake",
    "Others"
  ];
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

 useEffect(() => {
    if (isOpen) {
      setVisible(true);
      const timer = setTimeout(() => setIsAnimatingIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}
    >
      <div
        className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}
      >
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
          className="w-30 flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-4 py-3  rounded-xl hover:bg-blue-300"
        >
          <SendIcon className="w-4 h-4" />
          Submit
        </button>
      </div>
    </div>
  );
};

export default WithdrawRefferralModal;
