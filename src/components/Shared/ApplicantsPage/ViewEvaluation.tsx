import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import { ApiResponseDto, JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { EvaluationResponseItemDto } from "@Interfaces/CorporateServices.dto";
import { Check, ClipboardCheck, Plus, X } from "lucide-react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { JobApplicationUpdatePayloadDto } from "@Components/Dashboard/Corporate/Applicants/Applicants";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { useAppContext } from "@Context/App.context";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
// Updated import - replace the old import with the new one

import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { shouldShowAction, TabType } from "@Utils/ApplicationButtonVisibility.utils";
import NoDataPresent from "../NoDataPresent";
import { JobApplicationStatusEnum } from "@Enums/JobAndApplication.enum";

interface Props {
  jobApplicationData: JobApplicationDetailsDto;
  handleUpdate: (
    status: JobApplicationStatusType,
    row: JobApplicationDetailsDto,
    hasRefetch?: boolean
  ) => void;
  setIsRejectModalOpen: React.Dispatch<
    React.SetStateAction<{
      payload: JobApplicationUpdatePayloadDto;
      jobId: string;
    } | null>
  >;
  setOpenAddEvaluatorModal: (count: number, jobApplicationId: string) => void;
  onClose: () => void;
}

/**
 * Check if the job application can have more evaluators added
 * Button should only show if status tracker contains all these statuses:
 * APPLIED, ACCEPTED, REJECTED, ON_HOLD, CV_DOWNLOADED, UNDER_EVALUATION, PROCESSING_INTERVIEW, INTERVIEW_DONE
 */
const canAddmoreEvaluator = (jobApplicationData: JobApplicationDetailsDto): boolean => {
  const requiredStatuses = [
    JobApplicationStatusEnum.APPLIED,
    JobApplicationStatusEnum.ACCEPTED,
    JobApplicationStatusEnum.REJECTED,
    JobApplicationStatusEnum.ON_HOLD,
    JobApplicationStatusEnum.CV_DOWNLOADED,
    JobApplicationStatusEnum.UNDER_EVALUATION,
    JobApplicationStatusEnum.PROCESSING_INTERVIEW,
    JobApplicationStatusEnum.INTERVIEW_DONE,
  ];

  // Get all statuses from the status tracker
  const statusTrackerStatuses =
    jobApplicationData?.statusTracker?.map((tracker) => tracker.newStatus) || [];

  // Check if all required statuses are present in the status tracker
  const hasAllRequiredStatuses = requiredStatuses.every((status) =>
    statusTrackerStatuses.includes(status)
  );

  return hasAllRequiredStatuses;
};

const ResponseEvaluation: React.FC<Props> = ({
  jobApplicationData,
  handleUpdate,
  setIsRejectModalOpen,
  onClose,
  setOpenAddEvaluatorModal,
}) => {
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const corporateUserType = secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE);
  const userType = secureStorage
    .getItem<UserRole[]>(SecureStorageKeyEnum.USERTYPE)
    ?.includes(UserRole.ADMIN)
    ? "ADMIN"
    : corporateUserType || UserRole.CORPORATE_ADMIN;
  const [activeTab, setActiveTab] = useState(0);

  const {
    data: response,
    isLoading,
    error,
  } = useQuery<ApiResponseDto<EvaluationResponseItemDto>>({
    queryKey: ["evaluations", jobApplicationData.id],
    queryFn: async () => {
      return await CorporateServiceObj.getEvaluationResponses({
        jobApplicationId: jobApplicationData.id,
      });
    },
    refetchOnWindowFocus: false,
    enabled: !!jobApplicationData.id,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading evaluations</div>;
  if (!response || response?.data.length === 0) return <NoDataPresent />;

  const finalData = response.data as EvaluationResponseItemDto[];
  const sortedData = [...finalData].reverse(); // Create a reversed copy
  const currentEvaluation = sortedData[activeTab];
  const latest =
    currentEvaluation?.statusTracker?.[currentEvaluation?.statusTracker?.length - 1] || null;
  const interviews = currentEvaluation?.scheduledInterviewDetails || [];

  // Updated: Use the new action visibility system
  // Since this is a modal/evaluation view, we'll use "All" as the default tab type
  const activeTabType: TabType = "All";
  const handleAddMoreEvaluators = () => {
    const data = response.data[0];
    if (!data) return;
    else {
      setOpenAddEvaluatorModal?.(8 - response.data.length, data.jobApplicationId);
    }
    // Use setTimeout to ensure state is set before opening modal
    setTimeout(() => {
      onClose();
    }, 0);
  };
  return (
    <div className="mx-auto mt-6 bg-white overflow-hidden ">
      {/* Tab Headers */}
      <div className="flex  items-center no-scrl no-scrl-web flex-wrap w-[95%] overflow-auto">
        {sortedData.map((response, index) => (
          <div key={response.id} className="flex justify-start items-center">
            <button
              onClick={() => setActiveTab(index)}
              className={`px-4 py-3 capitalize truncate  text-sm text-nowrap font-semibold ${
                index === activeTab ? "text-black border-b-2 border-black" : "text-gray-400"
              }`}
              style={{ fontFamily: "Poppins" }}>
              {response.evaluatorName || `Evaluator ${index + 1}`}
            </button>

            {/* Vertical separator (not after last tab) */}
            {index < sortedData.length - 1 && <div className="w-px h-5 bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>
      {canAddmoreEvaluator(jobApplicationData) && (
        <button
          className="addEvaluator absolute right-2 top-8  "
          onClick={() => {
            handleAddMoreEvaluators();
          }}
          disabled={response.data.length >= 8}>
          <Plus
            className={`w-8 h-8 border rounded-lg font-bold bg-white shadow-md ${
              response.data.length >= 8
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "text-blue-500 cursor-pointer"
            }`}
          />
        </button>
      )}

      {/* Tab Content */}
      <div className="p-6 space-y-6">
        {/* Evaluator Info Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-gray-500 font-medium" style={{ fontFamily: "Inter" }}>
              Evaluated by:
            </span>
            <span
              className="text-gray-900 font-medium capitalize"
              style={{ fontFamily: "Poppins" }}>
              {currentEvaluation?.evaluatorName || "N/A"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-500 font-medium" style={{ fontFamily: "Inter" }}>
              Date:
            </span>
            <span className="text-gray-900 font-medium" style={{ fontFamily: "Poppins" }}>
              {currentEvaluation?.createdAt
                ? new Date(currentEvaluation.createdAt).toLocaleDateString("en-GB")
                : "N/A"}
            </span>
          </div>

          {latest?.score !== undefined && (
            <div className="flex items-center gap-4">
              <span className="text-gray-500 font-medium" style={{ fontFamily: "Inter" }}>
                Evaluation Score:
              </span>
              <span className="text-gray-900 font-medium" style={{ fontFamily: "Poppins" }}>
                {latest.score}/5
              </span>
            </div>
          )}

          {latest?.newStatus !== "INTERVIEW_SCHEDULED" && (
            <div className="flex items-center gap-4">
              <span className="text-gray-500 font-medium" style={{ fontFamily: "Inter" }}>
                Status:
              </span>
              <span
                className={`px-3 py-1 rounded-full font-medium text-white capitalize ${
                  latest?.newStatus === "REJECTED" ? "bg-red-500" : "bg-yellow-500"
                }`}
                style={{ fontFamily: "Poppins" }}>
                {latest.newStatus.replace(/_/g, " ").toLowerCase()}
              </span>
            </div>
          )}

          {latest?.detailedFeedback && (
            <div className="flex items-start gap-4">
              <span
                className="text-gray-500 font-medium capitalize"
                style={{ fontFamily: "Inter" }}>
                Feedback:
              </span>
              <span
                className="text-gray-900 font-normal text-left leading-tight capitalize"
                style={{ fontFamily: "Poppins" }}>
                {latest.detailedFeedback}
              </span>
            </div>
          )}

          {latest?.comment && (
            <div className="flex items-start gap-4">
              <span
                className="text-gray-500 font-medium capitalize"
                style={{ fontFamily: "Inter" }}>
                Comment:
              </span>
              <span
                className="text-gray-900 font-normal leading-tight capitalize"
                style={{ fontFamily: "Poppins" }}>
                {latest.comment}
              </span>
            </div>
          )}

          {latest?.reason && (
            <div className="flex items-start gap-4">
              <span className="text-gray-500 font-medium" style={{ fontFamily: "Inter" }}>
                Reason:
              </span>
              <span
                className="text-gray-900 font-normal leading-tight"
                style={{ fontFamily: "Poppins" }}>
                {latest.reason}
              </span>
            </div>
          )}

          <div className="flex items-center gap-4">
            <span className="text-gray-500 font-medium" style={{ fontFamily: "Inter" }}>
              Schedule Interview:
            </span>
            <span className="text-gray-900 font-medium" style={{ fontFamily: "Poppins" }}>
              {interviews.length > 0 ? "Yes" : "No"}
            </span>
          </div>
        </div>

        {/* Availability Schedule Section */}
        {interviews.length > 0 && (
          <div className="flex justify-start gap-2 items-start ">
            <span className="text-gray-500  font-medium" style={{ fontFamily: "Inter" }}>
              Availability Schedule:
            </span>

            <div className="flex flex-col  w-62   gap-3">
              {/* Table Headers */}
              <div className="flex text-gray-500  font-medium" style={{ fontFamily: "Inter" }}>
                <div className="w-1/3">Date</div>
                <div className="w-1/3 ml-6">Time</div>
              </div>

              {/* Table Rows */}
              {interviews.map((interview, index) => (
                <div key={index} className="flex gap-2">
                  <div className="w-1/3 mr-4">
                    <div className="bg-cyan-100 rounded-lg px-4 py-1 inline-block">
                      <span
                        className="text-gray-700 font-semibold  "
                        style={{ fontFamily: "Inter" }}>
                        {interview.date
                          ? new Date(interview.date).toLocaleDateString("en-GB")
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="w-1/2">
                    <div className="bg-cyan-100 rounded-lg px-4 text-nowrap py-1 inline-block">
                      <span
                        className="text-gray-700 lowercase font-semibold  "
                        style={{ fontFamily: "Inter" }}>
                        {interview.startTime + " to " + interview.endTime || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Section - Updated to use new visibility system */}
      <div className="flex justify-between items-center px-3">
        <div className="flex-1 flex items-center gap-4 p-2">
          {/* Process Interview Button */}
          {shouldShowAction("PROCESS_INTERVIEW", jobApplicationData, activeTabType) && (
            <button
              onClick={() => {
                handleUpdate("PROCESSING_INTERVIEW", jobApplicationData, true);
                onClose();
              }}
              className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              <PaperAirplaneIcon className="-rotate-45 w-4 h-4" />
              Process interview
            </button>
          )}

          {/* Hire Button */}
          {shouldShowAction("HIRE", jobApplicationData, activeTabType) && (
            <button
              onClick={() => {
                handleUpdate("HIRING_IN_PROCESS", jobApplicationData, true);
                onClose();
              }}
              className="flex items-center gap-2 border border-green-600 text-green-600 font-medium px-4 py-2 rounded-lg transition">
              <Check className="w-4 h-4" />
              Hire
            </button>
          )}

          {/* Reject Button */}
          {shouldShowAction("REJECT", jobApplicationData, activeTabType) && (
            <button
              onClick={() => {
                const payload: JobApplicationUpdatePayloadDto = {
                  applicantName: jobApplicationData.applicantDetails.name,
                  emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
                  status: "REJECTED",
                  userId: userDetails ? userDetails?.id : "",
                  userType: userType,
                };
                onClose();
                setIsRejectModalOpen({ payload, jobId: jobApplicationData.id });
              }}
              className="flex items-center gap-2 border border-red-600 text-red-600 font-medium px-4 py-2 rounded-lg transition">
              <X className="w-4 h-4" />
              Reject
            </button>
          )}
        </div>

        {/* On Hold Button */}
        {shouldShowAction("ONHOLD", jobApplicationData, activeTabType) && (
          <button
            className="text-blue-700 font-medium transition border p-2.5 rounded-lg"
            onClick={() => {
              handleUpdate("ON_HOLD", jobApplicationData, true);
              onClose();
            }}>
            On Hold
          </button>
        )}
      </div>
    </div>
  );
};

export default ResponseEvaluation;
