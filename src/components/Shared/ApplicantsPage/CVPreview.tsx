import React, { useEffect } from "react";
import { X, Check, Send, ClipboardCheck } from "lucide-react";
import { JobApplicationUpdatePayloadDto, handleJobApplicationStatusUpdate } from "@Components/Dashboard/Corporate/Applicants/Applicants";
import { useQueryClient } from "@tanstack/react-query";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { JobApplicationActionType, shouldShowAction, TabType } from "@Utils/ApplicationButtonVisibility.utils";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { useAppContext } from "@Context/App.context";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";

const sampleCV = "https://www.africau.edu/images/default/sample.pdf";
interface CVPreviewProps {
  onClose: () => void;
  setIsAddEvaluatorModal?: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRejectModalOpen?: React.Dispatch<React.SetStateAction<{ payload: { [key: string]: any }; jobId: string } | null>>;
  // pdfuri: string;
  /*   misData: {
    payload: JobApplicationUpdatePayloadDto;
    jobId: string;
  }; */
  setEvaluatorFormProps?: React.Dispatch<React.SetStateAction<any>>;
  jobApplicationData: JobApplicationDetailsDto;
  activeTab?: TabType;
}

const CVPreview = ({ onClose, setIsAddEvaluatorModal, setIsRejectModalOpen, setEvaluatorFormProps, jobApplicationData, activeTab = "All" }: CVPreviewProps) => {
  const queryClient = useQueryClient();
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const pdfuri = jobApplicationData?.applicantDetails.cvAwsS3SignedUrl;
  const isCorporate = window.location.href.includes("corporate");
  const userType = isCorporate ? secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE) : UserRole.ADMIN;
  if (!userType) {
    throw new Error("User type not found in secure storage");
  }
  const misData = {
    payload: {
      applicantName: jobApplicationData.applicantDetails.name,
      emailId: (secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) as string) || "",
      status: jobApplicationData.status as JobApplicationStatusType,
      userId: userDetails ? userDetails?.id : "",
      userType: userType,
    },
    jobId: jobApplicationData.jobId,
  };
  //  Map applicant data here instead of in parent
  const applicantData = jobApplicationData
    ? {
        id: jobApplicationData.id,
        jobId: jobApplicationData.jobId,
        jobTitle: jobApplicationData.jobTitle,
        companyId: jobApplicationData.companyId,
        applicantUserId: jobApplicationData.applicantDetails.id,
        applicantUserEmail: jobApplicationData.applicantDetails.email,
        applicantUserName: jobApplicationData.applicantDetails.name,
        hrName: userDetails?.fullName || "",
        hrCurrentCompanyName: userDetails?.companyId || "",
      }
    : undefined;

  const invalidateJobs = () => {
    queryClient.invalidateQueries({
      queryKey: ["CorporateJobsApplicationQuery"],
    });
  };

  // Handle send to evaluator with proper state management
  const handleSendToEvaluator = () => {
    // First set the evaluator form props
    if (setEvaluatorFormProps && applicantData) {
      setEvaluatorFormProps({
        Defaultvalues: {
          jobApplicationId: [applicantData.id],
          jobId: applicantData.jobId,
          jobTitle: applicantData.jobTitle,
          applicantUserName: [applicantData.applicantUserName],
          companyId: applicantData.companyId,
          applicantUserId: [applicantData.applicantUserId],
          applicantUserEmail: [applicantData.applicantUserEmail],
          hrName: applicantData.hrName,
          hrCurrentCompanyName: applicantData.hrCurrentCompanyName,
        },
      });
    }

    // Use setTimeout to ensure state is set before opening modal
    setTimeout(() => {
      onClose();
      setIsAddEvaluatorModal?.(true);
    }, 0);
  };

  // Handle interview process
  const handleProcessInterview = () => {
    onClose();
    misData.payload.status = "PROCESSING_INTERVIEW";
    handleJobApplicationStatusUpdate?.(misData.payload, misData.jobId, invalidateJobs);
  };

  // Handle on hold
  const handleOnHold = () => {
    onClose();
    misData.payload.status = "ON_HOLD";
    handleJobApplicationStatusUpdate?.(misData.payload, misData.jobId, invalidateJobs);
  };

  // Handle hire action
  const handleHire = () => {
    onClose();
    misData.payload.status = "HIRING_IN_PROCESS";
    handleJobApplicationStatusUpdate?.(misData.payload, misData.jobId, invalidateJobs);
  };

  useEffect(() => {
    const btns: JobApplicationActionType[] = ["HIRE", "HIRE_NOW", "REJECT"];
    btns.forEach((btn) => {
      console.log(`shouldShowAction(${btn}, jobApplicationData, activeTab):`, shouldShowAction(btn, jobApplicationData, activeTab));
    });
  }, [jobApplicationData, activeTab]);
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-4 justify-between">
        <h2 className="text-lg font-semibold">CV</h2>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex-1 border-2 border-gray-400 w-full min-h-[82vh] object-fit rounded-xl overflow-hidden">
            <iframe src={pdfuri} title="CV Preview" className="w-full h-full object-fit" />
          </div>

          <div className="flex flex-wrap gap-4">
            {/* Reject Button */}
            {shouldShowAction("REJECT", jobApplicationData, activeTab) && (
              <button
                onClick={() => {
                  onClose();
                  setIsRejectModalOpen?.(misData);
                }}
                className="flex items-center gap-2 border border-red-600 text-red-600 font-medium px-4 py-2 rounded-lg transition">
                <X className="w-4 h-4" />
                Reject
              </button>
            )}

            {/* Hire Button */}
            {shouldShowAction("HIRE", jobApplicationData, activeTab) && (
              <button onClick={handleHire} className="flex items-center gap-2 border border-green-600 text-green-600 font-medium px-4 py-2 rounded-lg transition">
                <Check className="w-4 h-4" />
                Hire
              </button>
            )}

            {/* Hire Now Button (for different contexts) */}
         {/*    {shouldShowAction("HIRE_NOW", jobApplicationData, activeTab) && (
              <button
                onClick={() => {
                  onClose();
                  setIsHireNowModalOpen?.(true);
                }}
                className="flex items-center gap-2 border border-green-600 text-green-600 font-medium px-4 py-2 rounded-lg transition">
                <Check className="w-4 h-4" />
                Hire Now
              </button>
            )} */}

            {/* Send to Evaluator Button */}
            {shouldShowAction("SEND_TO_EVALUATOR", jobApplicationData, activeTab) && (
              <button onClick={handleSendToEvaluator} className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <Send className="w-4 h-4" />
                Send for evaluation
              </button>
            )}

            {/* Process Interview Button */}
            {shouldShowAction("PROCESS_INTERVIEW", jobApplicationData, activeTab) && (
              <button onClick={handleProcessInterview} className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <ClipboardCheck className="w-4 h-4" />
                Process interview
              </button>
            )}

            {/* On Hold Button */}
            {shouldShowAction("ONHOLD", jobApplicationData, activeTab) && (
              <button className="text-blue-700 font-medium transition border p-2 rounded-lg" onClick={handleOnHold}>
                On Hold
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVPreview;
