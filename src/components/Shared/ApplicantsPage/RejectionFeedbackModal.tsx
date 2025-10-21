import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import { parseScorePoints } from "@Utils/DetailedAnalysis.utils";
import NoDataPresent from "../NoDataPresent";

interface RejectionFeedbackData {
  reasons: string[];
  comment?: string;
  hasData: boolean;
}

const RejectionFeedback = ({ jobApplication }: { jobApplication: JobApplicationDetailsDto }) => {
  const getFeedbackData = (): RejectionFeedbackData => {
    // Check if manually rejected by user
    if (jobApplication.rejectedByUserId) {
      return {
        reasons: [jobApplication.rejectedByUserId.reason || "No reason provided"],
        comment: jobApplication.rejectedByUserId.userComment,
        hasData: true,
      };
    }

    // Check score-based rejection
    const application = jobApplicationServiceObj.getScoreDetails(jobApplication);
    if (application) {
      const { recruiterNote } = parseScorePoints(application);
      const systemReasons = jobApplicationServiceObj.getRejectionReason(jobApplication);

      return {
        reasons: systemReasons.length > 0 ? systemReasons : [recruiterNote || "No reason provided"],
        hasData: systemReasons.length > 0 || !!recruiterNote,
      };
    }

    // No feedback available
    return {
      reasons: [],
      hasData: false,
    };
  };

  const feedbackData = getFeedbackData();

  if (!feedbackData.hasData) {
    return (
      <div className="flex items-center justify-center py-8">
        <NoDataPresent />
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-auto my-2">
      {/* Rejection Reasons Section */}
      <div className=" rounded-lg p-4">
        <h3 className="text-xl font-semibold text-red-800 mb-1 flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          Rejection Reason{feedbackData.reasons.length > 1 ? "s" : ""}
        </h3>

        <ul className="space-y-2">
          {feedbackData.reasons.map((reason, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-red-700">
              {/* <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span> */}
              <span className="leading-relaxed">{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Additional Comment Section */}
      {feedbackData.comment && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                clipRule="evenodd"
              />
            </svg>
            Additional Comment
          </h4>
          <p
          className="w-full text-sm text-gray-600 break-words"
          style={{ wordBreak: "break-word", whiteSpace: "pre-wrap" }}
          >
            {feedbackData.comment}</p>
        </div>
      )}
    </div>
  );
};

export default RejectionFeedback;
