import React, { useEffect, useState } from "react";
import { X, Check, Send, ClipboardCheck, Maximize, Download, Loader2 } from "lucide-react";
import {
  JobApplicationUpdatePayloadDto,
  handleJobApplicationStatusUpdate,
} from "@Components/Dashboard/Corporate/Applicants/Applicants";
import { useQueryClient } from "@tanstack/react-query";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { CompanyDetails, JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import {
  JobApplicationActionType,
  shouldShowAction,
  TabType,
} from "@Utils/ApplicationButtonVisibility.utils";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { useAppContext } from "@Context/App.context";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import httpServiceObj from "@Services/ApiHandler.service";

interface CVPreviewProps {
  onClose: () => void;
  setIsAddEvaluatorModal?: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRejectModalOpen?: React.Dispatch<
    React.SetStateAction<{ payload: { [key: string]: any }; jobId: string } | null>
  >;
  // pdfuri: string;
  /*   misData: {
    payload: JobApplicationUpdatePayloadDto;
    jobId: string;
  }; */
  setEvaluatorFormProps?: React.Dispatch<React.SetStateAction<any>>;
  jobApplicationData: JobApplicationDetailsDto;
  activeTab?: TabType;
}

const handleCVUrlGenerator = async (jobApplicationData: JobApplicationDetailsDto) => {
  if (!jobApplicationData) {
    toast.error("Document file not found", getToastOptions({}));
    return;
  }
  try {
    switch (jobApplicationData?.applicantDetails.cvAwsS3ResourceType) {
      case "USER_RESUME": {
        const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(
          `/file/${jobApplicationData?.applicantDetails.id}/${jobApplicationData?.applicantDetails.CV}/USER_RESUME`,
          true,
          {},
          false,
          "BASE"
        );
        if (error || !response) {
          toast.error(error?.message || "An unknown error occurred", getToastOptions({}));
          return;
        }
        return response.objectUrl;
      }
      case "AGENCY_SUBMIT_USER_CV": {
        const payload = {
          companyId: jobApplicationData?.companyId, //Job he applied
          jobId:jobApplicationData?.jobId, //Job he applied
          agencyUserId: jobApplicationData?.agencyUserId, // Agency user who submitted the CV
          candidateCvAwsS3FileName: jobApplicationData?.applicantDetails?.CV, // CV file name
        }

        const { response, error } = await httpServiceObj.post<any>(
          `${import.meta.env.APP_PROXY_AGENCY_BASE}/file/gsu2v/AGENCY_SUBMIT_USER_CV`,
          payload,
          true,
          {},
          true
        );
        if (error) {
          toast.error(error.message, getToastOptions({}));
          return;
        }
        return response.objectUrl; 
      }
     default:
        toast.error("Unsupported document type", getToastOptions({}));
        return;
    }
  } catch (error) {
    console.error("Error viewing document:", error);
    toast.error("Failed to view document", getToastOptions({}));
  }
};

const CVPreview = ({
  onClose,
  setIsAddEvaluatorModal,
  setIsRejectModalOpen,
  setEvaluatorFormProps,
  jobApplicationData,
  activeTab = "All",
}: CVPreviewProps) => {
  const queryClient = useQueryClient();
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const pdfuri = jobApplicationData?.applicantDetails.cvAwsS3SignedUrl;
  const isCorporate = window.location.href.includes("corporate");
  const userType = isCorporate
    ? secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE)
    : "ADMIN";
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
    jobId: jobApplicationData.id,
  };
  const companyDetails: CompanyDetails | null = secureStorage.getItem(
    SecureStorageKeyEnum.CORPORATECOMPANYDERAILS
  );

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
        hrCurrentCompanyName: RBAC.can("play_admin") ? "WORKO" : companyDetails?.name || "",
      }
    : undefined;

  const invalidateJobApplication = () => {
    RBAC.can("play_admin")
      ? queryClient.invalidateQueries({
          queryKey: ["AdminJobsApplicationQuery"],
        })
      : queryClient.invalidateQueries({
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
          hrCurrentCompanyName: RBAC.can("play_admin") ? "WORKO" : companyDetails?.name || "",
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
  const handleProcessInterview = async () => {
    onClose();
    misData.payload.status = "PROCESSING_INTERVIEW";
    await handleJobApplicationStatusUpdate?.(
      misData.payload,
      misData.jobId,
      invalidateJobApplication
    );
    invalidateJobApplication();
  };

  // Handle on hold
  const handleOnHold = async () => {
    onClose();
    misData.payload.status = "ON_HOLD";
    await handleJobApplicationStatusUpdate?.(
      misData.payload,
      misData.jobId,
      invalidateJobApplication
    );
    invalidateJobApplication();
  };

  // Handle hire action
  const handleHire = async () => {
    onClose();
    misData.payload.status = "HIRING_IN_PROCESS";
    await handleJobApplicationStatusUpdate?.(
      misData.payload,
      misData.jobId,
      invalidateJobApplication
    );
    invalidateJobApplication();
  };

  const [cvUrl, setCvUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const url = await handleCVUrlGenerator(jobApplicationData);
      if (isMounted) setCvUrl(url);
    })();
    return () => { isMounted = false; };
  }, [jobApplicationData]);

  useEffect(() => {
    const btns: JobApplicationActionType[] = ["ACCEPT", "HIRE_NOW", "REJECT"];
    btns.forEach((btn) => {
      // console.log(
      //   `shouldShowAction(${btn}, ${jobApplicationData.status}, ${activeTab}):`,
      //   shouldShowAction(btn, jobApplicationData, activeTab)
      // );
    });
  }, [jobApplicationData, activeTab]);
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-4 justify-between">
        <h2 className="text-lg font-semibold">CV</h2>
        <div className="flex flex-col gap-4 w-full">
          <div className="relative flex-1 border-2 border-gray-400 w-full min-h-[82vh] object-fit rounded-xl overflow-hidden">
            {cvUrl ? (
              <iframe src={cvUrl} title="CV Preview" className="w-full h-full object-fit" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
              </div>
            )}
            <button
              onClick={() => {
                fetch(pdfuri)
                  .then((response) => response.blob())
                  .then((blob) => {
                    const link = document.createElement("a");
                    const url = URL.createObjectURL(blob);
                    link.href = url;
                    const candidateName = jobApplicationData.applicantDetails.name.replace(
                      /\s+/g,
                      "_"
                    );
                    const companyName = (companyDetails?.name || "Company").replace(/\s+/g, "_");
                    const date = new Date().toISOString().split("T")[0];
                    link.download = `Worko_${candidateName}_${jobApplicationData?.applicantDetails?.YOE}_${companyName}_${date}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  })
                  .catch((error) => console.error("Error downloading the file:", error));
              }}
              className="absolute bottom-4 right-16 border bg-blue-200 px-3 py-2 rounded-md shadow text-blue-600">
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.open(cvUrl, "_blank")}
              className="absolute bottom-4 right-3  px-3 py-2 bg-blue-200 rounded-md shadow text-blue-600">
              <Maximize className="w-4 h-4" />
            </button>
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
              <button
                onClick={handleHire}
                className="flex items-center gap-2 border border-green-600 text-green-600 font-medium px-4 py-2 rounded-lg transition">
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
              <button
                onClick={handleSendToEvaluator}
                className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <Send className="w-4 h-4" />
                Send for evaluation
              </button>
            )}

            {/* Process Interview Button */}
            {shouldShowAction("PROCESS_INTERVIEW", jobApplicationData, activeTab) && (
              <button
                onClick={handleProcessInterview}
                className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <ClipboardCheck className="w-4 h-4" />
                Process interview
              </button>
            )}

            {/* On Hold Button */}
            {shouldShowAction("ONHOLD", jobApplicationData, activeTab) && (
              <button
                className="text-blue-700 font-medium transition border p-2 rounded-lg"
                onClick={handleOnHold}>
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
