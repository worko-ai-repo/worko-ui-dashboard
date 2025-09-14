import { useDashboardContext } from "@Context/Dashboard.context";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { NormalizedUser } from "@Utils/NormalizeUser";
import secureStorage from "@Utils/SecureStorage.utils";
import { toTitleCase } from "@Utils/Titlecase.utils";
import { X } from "lucide-react";
import { useEffect, useState } from "react";


interface FeedbackModalProps {
  show: boolean;
  jobTitle:string;
  feedbackContent: any;
  onClose: () => void;
}


const RejectionFeedbackModal = ({ show, jobTitle,feedbackContent, onClose }: FeedbackModalProps) => {
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
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible && !show) return null;
  return (
      <div
        className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
            isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
        } ${isVisible ? "visible" : "invisible"}`}
        >
        <div
            className={`bg-white rounded-l-lg p-6 w-full max-w-xl relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
            isAnimatingIn ? "translate-x-0" : "translate-x-full"
            }`}
        >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
            
        <div className="flex justify-start gap-3">
          <div className="w-full">
            <h1 className="text-lg font-semibold mb-4 text-left">
              Feedback summary for :{" "}
              <span className="text-blue-600">{toTitleCase(jobTitle) || "NA"}</span>
            </h1>
            <div className="border rounded-xl bg-gray-200 text-sm p-4 text-left overflow-y-auto max-h-[180px]">
              {(() => {
                    try {
                      const feedbackItems = JSON.parse(feedbackContent);
                      if (Array.isArray(feedbackItems)) {
                        return feedbackItems.map(({ heading, detail }: { heading: string; detail: string }, idx: number) => (
                          <div key={idx} className="mb-4">
                            <h4 className="font-semibold text-black">{heading.length? heading : "N/A"}</h4>
                            <p className="mt-1 text-gray-400">{detail.length?detail:"N/A"}</p>
                          </div>
                        ));
                      }
                      return <p>{feedbackContent}</p>;
                    } catch {
                      return <p>{feedbackContent}</p>;
                    }
                  })()}
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default RejectionFeedbackModal;