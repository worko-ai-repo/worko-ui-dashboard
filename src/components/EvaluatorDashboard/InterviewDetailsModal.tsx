import React from "react";

interface InterviewDetailsModalProps {
  data: {
    date: string;
    time: string;
    recruiterNote: string;
    meetingLink: string;
  };
  candidateName: string;
  onClose: () => void;
}

const InterviewDetailsModal: React.FC<InterviewDetailsModalProps> = ({
  data,
  candidateName,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-start items-center border-b pb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Interview Details
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            for {candidateName}
          </p>
        </div>
      </div>

      {/* Date */}
      <div className="flex gap-3">
        <div className="text-lg font-semibold text-gray-800">
          <h3 className="text-sm font-medium text-gray-600 mb-1 text-start">
            Date
          </h3>
          {data?.date || "NA"}
        </div>

        <div className="text-lg font-semibold text-gray-800">
          <h3 className="text-sm font-medium text-gray-600 mb-1 text-start">
            Time
          </h3>
          {data?.time || "NA"}
        </div>
      </div>


      {/* Recruiter Note */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-3 text-start">
          Recruiter Note
        </h3>
        <div className="bg-gray-100 p-4 rounded-lg max-h-[150px] overflow-y-auto">
          <p className="text-sm text-gray-700 leading-relaxed">
            {data?.recruiterNote || "No note provided."}
          </p>
        </div>
      </div>

      {/* Meeting Link */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2 text-start">
          Meeting Link
        </h3>

        <div className="flex items-center gap-3">
          <a
            href={data?.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline break-all text-sm flex-1"
          >
            {data?.meetingLink || "NA"}
          </a>

          {data?.meetingLink && (
            <button
              onClick={() => window.open(data.meetingLink, "_blank")}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-all duration-200 whitespace-nowrap"
            >
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewDetailsModal;