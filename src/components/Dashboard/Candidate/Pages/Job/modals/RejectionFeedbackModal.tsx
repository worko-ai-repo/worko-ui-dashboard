import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface FeedbackModalProps {
  show: boolean;
  feedbackContent: string;
  onClose: () => void;
}

const RejectionFeedbackModal = ({ show, feedbackContent, onClose }: FeedbackModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300); // Match the transition duration
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible && !show) return null;

  return (
    <div className={`fixed inset-0 flex justify-end z-50 transition-opacity duration-300 ease-in-out ${
      isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
    } ${isVisible ? "visible" : "invisible"}`}>
      <div 
        className={`bg-white min-h-screen w-full max-w-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">Application Feedback</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}

        <div className="p-6 overflow-y-auto text-gray-700 text-left flex-1">
          {(() => {
            try {
              const feedbackItems = JSON.parse(feedbackContent);
              if (Array.isArray(feedbackItems)) {
                return feedbackItems.map(({ heading, detail }: { heading: string; detail: string }, idx: number) => (
                  <div key={idx} className="mb-4">
                    <h4 className="font-semibold text-black">{heading}</h4>
                    <p className="mt-1 text-gray-400">{detail}</p>
                  </div>
                ));
              }
              // fallback if parsed but not array
              return <p>{feedbackContent}</p>;
            } catch {
              // fallback if invalid JSON
              return <p>{feedbackContent}</p>;
            }
          })()}
        </div>


        {/* Footer */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectionFeedbackModal;