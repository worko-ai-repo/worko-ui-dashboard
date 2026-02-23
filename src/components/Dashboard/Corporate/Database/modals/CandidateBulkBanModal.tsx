import { SendIcon } from "lucide-react";
import { FC, useEffect, useRef, useState } from "react"; 

interface CandidateBulkBanModalProps {
  reason: string;
  comments: string;
  setReason: (reason: string) => void;
  setComments: (comments: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isOpen: boolean;
  isBulkBanSubmitting:boolean;
}

const CandidateBulkBanModal: FC<CandidateBulkBanModalProps> = ({
  reason,
  comments,
  setReason,
  setComments,
  onSubmit,
  onClose,
  isOpen,
  isBulkBanSubmitting,
}) => {
  const options = [
    "Candidates were previously absconded",
    "Candidates submitted fake documents",
    "Candidates have bad behaviour",
    "Background check not clear",
    "Others"
  ];
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
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
      onMouseDown={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          // reset();
          onClose();
        }
      }}
      className={`fixed inset-0 z-[80] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
          !isAnimatingIn ? "animate-slide-out" : "animate-slide-in"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>

        <h2 className="text-lg font-semibold mb-4 text-start">Ban Candidates</h2>

        {/* Dropdown */}
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Comments <span className="text-red-500">*</span></label>
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
          disabled={isBulkBanSubmitting || reason.length === 0 || comments.length === 0}
          className={`
            w-30 flex items-center gap-1 text-white text-xs font-medium px-4 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed
            ${isBulkBanSubmitting 
            ? "bg-blue-300 cursor-not-allowed opacity-70" 
            : "bg-blue-500 hover:bg-blue-300"
            }
          `}
        >
          <SendIcon className="w-3 h-3" />
          {isBulkBanSubmitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
};

export default CandidateBulkBanModal;
