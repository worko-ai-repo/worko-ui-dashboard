import { FC, useEffect, useState } from "react";
import { X, Building2, Calendar, Briefcase } from "lucide-react";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import { formatInterviewDate } from "./VideoInterviewModal";

interface CorporateRequestsModalProps {
  onClose: () => void;
  isOpen: boolean;
  interview: InterviewDto | null;
}

const CorporateRequestsModal: FC<CorporateRequestsModalProps> = ({
  onClose,
  isOpen,
  interview,
}) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    let animateInTimer: number;
    let animateOutTimer: number;

    if (isOpen) {
      setVisible(true);
      animateInTimer = window.setTimeout(() => {
        setIsAnimatingIn(true);
      }, 10);
    } else {
      setIsAnimatingIn(false);
      animateOutTimer = window.setTimeout(() => {
        setVisible(false);
      }, 300);
    }

    return () => {
      clearTimeout(animateInTimer);
      clearTimeout(animateOutTimer);
    };
  }, [isOpen]);

  if (!interview || !interview.requestedBy || interview.requestedBy.length === 0) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div
        className={`bg-white rounded-lg p-6 w-full max-w-2xl relative transform transition-transform duration-300 ease-in-out max-h-[80vh] overflow-y-auto mx-4 ${
          isAnimatingIn ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}>
       

        <h2 className="text-2xl font-bold mb-2 pr-8">Corporate Requests</h2>
        <p className="text-sm text-gray-600 mb-6">
          {interview.requestedBy.length}{" "}
          {interview.requestedBy.length === 1 ? "company has" : "companies have"} requested this
          interview
        </p>

        <div className="space-y-4">
          {interview.requestedBy.map((request, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {request.companyName || "Company Name Not Disclosed"}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium">Position:</span>
                      <span>{request.position || "Not Disclosed"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium">Requested on:</span>
                      <span>{formatInterviewDate(request.requestedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Complete the interview to respond to these requests
          </p>
        </div>
      </div>
    </div>
  );
};

export default CorporateRequestsModal;
