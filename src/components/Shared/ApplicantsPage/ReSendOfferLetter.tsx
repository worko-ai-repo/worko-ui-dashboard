import React, { useEffect, useState } from "react";
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
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import AdminServiceObj from "@Components/Dashboard/WorkoAdmin/Services/Admin.service";

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

export default function ResendOfferLetter({ jobData, onClose }: { jobData?: JobApplicationDetailsDto, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [hasJobFieldsChanged, setHasJobFieldsChanged] = useState(false);
  const [initialJobFields, setInitialJobFields] = useState<string>("");

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
    watch,
    getValues,
    formState: { errors },
  } = useForm<HireFormInputs>({
    defaultValues: {
      offerLetterRemarks: latestOfferLetterIssueRaisedDetails.remarks,
      jobTitle: "",
      workMode: "",
      location: "",
      department: "",
      ctc: "",
      offerLetter: null,
      remarks: "",
    },
  });

  // Use useEffect to reset the form values when jobResponse changes
  useEffect(() => {
    if (jobResponse) {
      const formData = {
        offerLetterRemarks: latestOfferLetterIssueRaisedDetails.remarks,
        jobTitle: jobResponse.jobTitle || "",
        workMode: jobResponse.workMode || "",
        location: jobResponse.location?.city?.[0] || "",
        department: jobResponse.department || "",
        ctc: jobResponse.salaryRange?.max ? jobResponse.salaryRange.max.toString() : "",
        offerLetter: null,
        remarks: "",
      };
      reset(formData);

      // Set initial job fields after a brief delay
      setTimeout(() => {
        const jobFieldsData = JSON.stringify({
          jobTitle: formData.jobTitle,
          workMode: formData.workMode,
          location: formData.location,
          department: formData.department,
          ctc: formData.ctc,
        });
        setInitialJobFields(jobFieldsData);
        setHasJobFieldsChanged(false);
      }, 100);
    }
  }, [jobResponse, reset, latestOfferLetterIssueRaisedDetails.remarks]);

  // Watch for changes in job-related fields
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // Only track changes for job-related fields
      const jobFields = ["jobTitle", "workMode", "location", "department", "ctc"];
      if (name && jobFields.includes(name)) {
        const currentJobFields = JSON.stringify({
          jobTitle: value.jobTitle,
          workMode: value.workMode,
          location: value.location,
          department: value.department,
          ctc: value.ctc,
        });

        if (initialJobFields && currentJobFields !== initialJobFields) {
          setHasJobFieldsChanged(true);
        } else {
          setHasJobFieldsChanged(false);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, initialJobFields]);

  /**
   * Update job details if job fields have changed
   */
  const updateJobIfNeeded = async () => {
    if (!hasJobFieldsChanged || !jobResponse) {
      return true; // No update needed
    }

    try {
      const formValues = getValues();

      // For corporate service, use the full payload structure
      const corporatePayload = {
        companyId: jobResponse.companyId,
        jobTitle: formValues.jobTitle,
        workMode: formValues.workMode,
        department: formValues.department,
        status: jobResponse.status,
        numOfOpenings: jobResponse.numOfOpenings || 1,
        noticePeriod: jobResponse.noticePeriod || 0,
        location: {
          city: [formValues.location],
          country: jobResponse.location?.country || [],
          fullLocation: [formValues.location],
          state: jobResponse.location?.state || [],
        },
        experienceRange: jobResponse.experienceRange || { min: 0, max: 0 },
        salaryRange: {
          min: jobResponse.salaryRange?.min || 0,
          max: parseFloat(formValues.ctc),
        },
        coreSkills: jobResponse.coreSkills || [],
        technicalSkills: jobResponse.technicalSkills || [],
        softSkills: jobResponse.softSkills || [],
        miscellaneousSkills: jobResponse.miscellaneousSkills || [],
        otherRequirements: jobResponse.otherRequirements || "",
        typeofEmployment: jobResponse.typeofEmployment || "FULL_TIME",
        htmlJobDescription: jobResponse.htmlJobDescription || "",
      };

      const response = await CorporateServiceObj.updateJob(corporatePayload, {}, jobResponse.id!);

      if (!response || Array.isArray(response)) {
        throw new Error("Failed to update job details");
      }

      toast.success("Job details updated successfully", getToastOptions({}));

      // Invalidate job queries
      const isAdmin = RBAC.can("play_admin");
      queryClient.invalidateQueries({
        queryKey: isAdmin ? ["AdminJobsQuery"] : ["CorporateJobsQuery"],
      });

      return true;
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("Failed to update job details", getToastOptions({}));
      return false;
    }
  };

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

      // Step 1: Update job if needed
      const jobUpdateSuccess = await updateJobIfNeeded();
      if (!jobUpdateSuccess) {
        toast.error(
          "Failed to update job details. Offer letter upload cancelled.",
          getToastOptions({})
        );
        return;
      }

      // Step 2: Request pre-signed URL
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

      // Step 3: Upload file to S3
      await fetch(awsS3SignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      // Step 4: Update job application status
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

      toast.success(
        hasJobFieldsChanged
          ? "Job updated and offer letter resent successfully!"
          : "Offer letter resent successfully!",
        getToastOptions({})
      );
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
      onClose();
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

      {hasJobFieldsChanged && (
        <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            Job details will be updated when you submit the offer letter.
          </p>
        </div>
      )}

      {/* Job Concern TextArea */}
      <div className=" col-span-2  ">
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1  "></span>Concern Raised by Candidate
        </label>
        <textarea
          className="h-40  p-3 rounded-xl  bg-gray-200/90 font-light text-sm w-full capitalize"
          placeholder=""
          {...register("offerLetterRemarks")}
          disabled
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
          register={register("jobTitle", { required: "Job title is required" })}
          error={errors?.jobTitle?.message}
        />
      </div>

      {/* Work Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Work mode
        </label>
        <select
          {...register("workMode", { required: "Work mode is required" })}
          className="w-full rounded-xl bg-gray-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
          <option value="">Select work mode</option>
          <option value="WFH">Work From Home</option>
          <option value="WFO">Work From Office</option>
          <option value="HYBRID">Hybrid</option>
        </select>
        {errors?.workMode && <p className="text-sm text-red-500 mt-1">{errors.workMode.message}</p>}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Location
        </label>
        <ReusableInput
          className="capitalize"
          register={register("location", { required: "Location is required" })}
          type="text"
          placeholder="Bangalore"
          error={errors?.location?.message}
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Department
        </label>
        <ReusableInput
          className="capitalize"
          register={register("department", { required: "Department is required" })}
          type="text"
          placeholder="Marketing"
          error={errors?.department?.message}
        />
      </div>

      {/* CTC */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>CTC{" "}
          <span className="text-xs text-gray-400">(fix + variable)</span>
        </label>
        <ReusableInput
          className="capitalize"
          register={register("ctc", {
            required: "CTC is required",
            pattern: {
              value: /^\d+(\.\d{1,2})?$/,
              message: "Please enter a valid CTC amount",
            },
          })}
          type="text"
          placeholder="50,00,000.00"
          error={errors?.ctc?.message}
        />
      </div>

      {/* Offer Letter Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span> Attach offer letter
        </label>
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
          <label className="block text-sm font-medium text-gray-700">
            Remarks
          </label>
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
          {hasJobFieldsChanged ? "Update Job & Re-Send" : "Re-Send"}
        </button>
      </div>
    </form>
  );
}
