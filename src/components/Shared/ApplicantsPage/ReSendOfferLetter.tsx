import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Upload, Send, ChevronDown, Eye } from "lucide-react";
import ReusableInput from "../../Dashboard/Corporate/ReusableInput";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { JobDto } from "@Interfaces/JobsAndCompany.dto";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import httpServiceObj from "@Services/ApiHandler.service";
import secureStorage from "@Utils/SecureStorage.utils";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";
import { eyeIcon, viewFeedback } from "@AssetsFolder/assets";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";

export type HireFormInputs = {
  offerLetterRemarks: string;
  jobTitle: string;
  workMode: string;
  location: string;
  department: string;
  ctc: string;
  offerLetter: FileList | null;
  remarks: string;
};

export interface JobOfferLetterDynamoRequestDto {
  jobApplicationId: string;
  userId: string;
  fileName: string;
  fileMimeType: string;
}
export interface JobOfferLetterDynamoResponseDto {
  userFileName: string;
  cloudFileName: string;
  fileMimeType: string;
  fileExtension: string;
  awsS3SignedUrl: string;
}

/**
 * getLatestOfferLetterIssueRaisedDetails
 *
 * @description Get the latest offer letter issue raised details or offer letter details from job application data
 *
 * @param jobData - Job application data containing offer letter issue details
 * @param mode - "ISSUE" for issue raised details, "LETTER" for offer letter details
 * @returns
 */
export const getLatestOfferLetterIssueRaisedDetails = (
  jobData: JobApplicationDetailsDto | undefined,
  mode: "ISSUE" | "LETTER" = "ISSUE"
) => {
  if (!jobData) {
    return {
      cloudFileName: "",
      remarks: "",
      date: "",
      type: "",
    };
  }

  if (mode === "ISSUE") {
    // Handle offer letter issue raised details
    if (
      !jobData.offerLetterIssueRaisedDetails ||
      jobData.offerLetterIssueRaisedDetails.length === 0
    ) {
      return {
        cloudFileName: "",
        remarks: "",
        date: "",
        type: "",
      };
    }

    // Sort by date and get the latest issue
    const sortedIssues = jobData.offerLetterIssueRaisedDetails.sort(
      (a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime()
    );
    const latestIssue = sortedIssues[0];
    return {
      cloudFileName: latestIssue.cloudFileName,
      remarks: latestIssue.remarks,
      date: latestIssue.actionDate,
      type: latestIssue.userType,
    };
  } else if (mode === "LETTER") {
    // Handle regular offer letter details
    if (!jobData.offerLetterDetails || jobData.offerLetterDetails.length === 0) {
      return {
        cloudFileName: "",
        remarks: "",
        date: "",
        type: "",
      };
    }

    // Sort by date and get the latest offer letter
    const sortedOfferLetters = jobData.offerLetterDetails.sort(
      (a, b) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime()
    );
    const latestOfferLetter = sortedOfferLetters[0];
    return {
      cloudFileName: latestOfferLetter.cloudFileName,
      remarks: latestOfferLetter.remarks,
      date: latestOfferLetter.actionDate,
      type: latestOfferLetter.userType,
    };
  }

  // Default return if mode is not recognized
  return {
    cloudFileName: "",
    remarks: "",
    date: "",
    type: "",
  };
};

/**
 * handleViewDocumentClick
 *
 * @description Handle view document click to generate pre-signed URL and open document in new tab
 *
 * @param applicationData - Job application data containing offer letter details
 * @param mode - "ISSUE" for issue raised details, "LETTER" for offer letter details
 * @returns
 */
export const handleViewDocumentClick = async (
  applicationData: JobApplicationDetailsDto,
  mode: "ISSUE" | "LETTER" = "ISSUE"
) => {
  if (!applicationData) {
    toast.error("Job application data not found", getToastOptions({}));
    return;
  }

  // Check if the required data exists based on mode
  if (
    mode === "ISSUE" &&
    (!applicationData.offerLetterIssueRaisedDetails ||
      applicationData.offerLetterIssueRaisedDetails.length === 0)
  ) {
    toast.error("Offer letter issue details not found", getToastOptions({}));
    return;
  }

  if (
    mode === "LETTER" &&
    (!applicationData.offerLetterDetails || applicationData.offerLetterDetails.length === 0)
  ) {
    toast.error("Offer letter details not found", getToastOptions({}));
    return;
  }

  const latestOfferLetterDetails: {
    cloudFileName: string;
    remarks: string;
    date: string;
    type: string;
  } = getLatestOfferLetterIssueRaisedDetails(applicationData, mode);

  const cloudFileName = latestOfferLetterDetails.cloudFileName;
  if (!cloudFileName) {
    toast.error("Document file not found", getToastOptions({}));
    return;
  }

  try {
    const payload = {
      jobApplicationId: applicationData.id,
      userId: applicationData.applicantDetails.userId,
      cloudFileName: cloudFileName,
    };

    const { response, error } = await httpServiceObj.post<{
      objectUrl: string;
    }>(`/file/gsu2v/HR_OFFER_LETTER_SENT`, payload, true, {}, false, "JOB");

    if (!response || error) {
      throw new Error("Failed to get pre-signed URL for document");
    }

    // Open document in new tab
    const documentUrl = response.objectUrl;
    window.open(documentUrl, "_blank");
  } catch (error) {
    console.error("Error viewing document:", error);
    toast.error("Failed to view document", getToastOptions({}));
  }
};

export default function ResendOfferLetter({ jobData }: { jobData?: JobApplicationDetailsDto }) {
  const queryClient = useQueryClient();
  const jobQuery = useQuery<JobDto>({
    queryKey: ["jobData", jobData?.jobId],
    queryFn: async () => {
      if (!jobData?.jobId) throw new Error("Job ID is required");
      const { response } = await httpServiceObj.get<JobDto>(
        `/job/${jobData.jobId}`,
        true,
        {},
        false,
        "JOB"
      );
      if (!response) {
        throw new Error("Failed to fetch job data");
      }
      return response;
    },
    enabled: !!jobData?.jobId,
  });
  const latestOfferLetterIssueRaisedDetails: {
    cloudFileName: string;
    remarks: string;
    date: string;
    type: string;
  } = getLatestOfferLetterIssueRaisedDetails(jobData);
  const { data: jobResponse, isLoading, isError } = jobQuery;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HireFormInputs>({
    defaultValues: {
      offerLetterRemarks: latestOfferLetterIssueRaisedDetails.remarks,
      jobTitle: jobResponse?.jobTitle,
      workMode: jobResponse?.workMode,
      location: jobResponse?.location?.city?.[0],
      department: jobResponse?.department,
      ctc: jobResponse?.salaryRange?.max ? jobResponse.salaryRange.max.toString() : "",
      offerLetter: null,
      remarks: "",
    },
  });
  // Use useEffect to reset the form values when jobResponse changes
  useEffect(() => {
    if (jobResponse) {
      reset({
        offerLetterRemarks: latestOfferLetterIssueRaisedDetails.remarks,
        jobTitle: jobResponse.jobTitle || "",
        workMode: jobResponse.workMode || "",
        location: jobResponse.location?.city?.[0] || "",
        department: jobResponse.department || "",
        ctc: jobResponse.salaryRange?.max ? jobResponse.salaryRange.max.toString() : "",
        offerLetter: null,
        remarks: "",
      });
    }
  }, [jobResponse, reset]);

  /**
   * Generate pre-signed URLs and open document in new tab
   */

  const onSubmit = async (data: HireFormInputs) => {
    try {
      if (!data.offerLetter || data.offerLetter.length === 0) {
        toast.error("Please upload an offer letter.", getToastOptions({}));
        return;
      }

      const file = data.offerLetter[0];
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed.", getToastOptions({}));
        return;
      }

      // Step 1: Request pre-signed URL
      if (!jobData?.id) {
        throw new Error("Job application ID is required");
      }
      const userType = window.location.href.includes("corporate")
        ? secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE)
        : "ADMIN";

      if (!userType) {
        throw new Error("User type not found in secure storage");
      }

      const payload: JobOfferLetterDynamoRequestDto = {
        jobApplicationId: jobData?.id,
        userId: jobData.applicantDetails.id,
        fileName: file.name,
        fileMimeType: file.type,
      };

      const { response: presignedUrlResponse } =
        await httpServiceObj.post<JobOfferLetterDynamoResponseDto>(
          "/file/gsu2u/HR_OFFER_LETTER_SENT",
          payload,
          true,
          {},
          false,
          "JOB"
        );
      if (!presignedUrlResponse) {
        throw new Error("Failed to get pre-signed URL");
      }
      const { awsS3SignedUrl, cloudFileName } = presignedUrlResponse;

      // Step 2: Upload file to S3
      await fetch(awsS3SignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Step 3: Update job application status
      const updatePayload = {
        userId: jobData?.applicantDetails.name,
        status: "REVISED_OFFER_SENT",
        offerLetterCloudFileName: cloudFileName,
        offerLetterRemarks: data.remarks,
        emailId: jobData?.applicantDetails.email,
        userType: userType,
        applicantName: jobData?.applicantDetails.name || "Applicant",
      };

      const { response } = await httpServiceObj.patch(
        `/job-application/${jobData?.id}/corp-action`,
        updatePayload,
        true,
        {},
        false,
        "JOB"
      );
      if (!response) {
        throw new Error("Failed to update job application status");
      }
      toast.success("Offer letter uploaded and status updated successfully.", getToastOptions({}));
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred. Please try again.", getToastOptions({}));
    } finally {
      RBAC.can("play_admin")
        ? queryClient.invalidateQueries({
            queryKey: ["AdminJobsApplicationQuery"],
          })
        : queryClient.invalidateQueries({
            queryKey: ["CorporateJobsApplicationQuery"],
          });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className=" space-y-4 py-16 text-left grid grid-cols-2 gap-4 ">
      <h2 className=" absolute top-4  text-lg font-semibold text-gray-800">Re-Send Offer Letter</h2>
      <button
        type="button"
        onClick={() => {
          jobData
            ? handleViewDocumentClick(jobData)
            : toast.error("Failed to view document", getToastOptions({}));
        }}
        className="absolute top-3 right-2 px-3 py-2 btn_t1 bg-gradient-to-t rounded-xl w-36 items-center text-left bg-cyan-400 text-white flex gap-2">
        <img src={eyeIcon} alt="viewFeedback" className="w-5 h-5" /> View Offer Letter
      </button>
      {/* Job Concern TextArea */}
      <div className=" col-span-2  ">
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1  "></span>Concern Raised by Candidate
        </label>
        <textarea
          className="h-40  p-3 rounded-xl  bg-gray-200/90 font-light text-sm w-full capitalize"
          placeholder=""
          {...register("offerLetterRemarks")}
          disabled={!!jobResponse?.jobTitle}
        />
      </div>
      {/* Job Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Job title
        </label>
        <ReusableInput
          className="capitalize"
          type="text"
          placeholder="Marketing manager"
          register={register("jobTitle")}
          error={errors?.jobTitle?.message}
          disabled={!!jobResponse?.jobTitle}
        />
      </div>

      {/* Work Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Work mode
        </label>
        <ReusableInput
          className="capitalize"
          type="text"
          placeholder="Remote"
          register={register("workMode")}
          error={errors?.workMode?.message}
          disabled={!!jobResponse?.workMode}
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Location
        </label>
        <ReusableInput
          className="capitalize"
          register={register("location")}
          type="text"
          placeholder="Bangalore"
          error={errors?.location?.message}
          disabled={!!jobResponse?.location?.city?.[0]}
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Department
        </label>
        <div className="relative">
          <ReusableInput
            className="capitalize"
            register={register("department")}
            type="text"
            placeholder="Marketing"
            error={errors?.department?.message}
            disabled={!!jobResponse?.department}
          />
          <ChevronDown className="absolute cursor-pointer right-3 top-4 text-gray-400" size={18} />
        </div>
      </div>

      {/* CTC */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>CTC{" "}
          <span className="text-xs text-gray-400">(fix + variable)</span>
        </label>
        <ReusableInput
          className="capitalize"
          register={register("ctc")}
          type="text"
          placeholder="50,00,000.00"
          error={errors?.ctc?.message}
          disabled={!!jobResponse?.salaryRange?.max}
        />
      </div>

      {/* Offer Letter Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Attach offer letter</label>
        <div className="relative">
          <ReusableInput
            className="capitalize"
            register={register("offerLetter")}
            type="file"
            accept=".pdf"
          />
          <Upload className="absolute right-3 top-4 text-gray-400" size={18} />
        </div>
      </div>

      {/* Remarks */}
      <div className="flex flex-col gap-12 col-span-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Remarks</label>
          <textarea
            placeholder="write here"
            {...register("remarks")}
            className="h-40  p-3 rounded-xl  bg-gray-200/90 font-light text-sm w-full capitalize"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="flex place-self-center justify-center item-center items-center w-fit gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
          <Send size={16} />
          Re-Send
        </button>
      </div>
    </form>
  );
}
