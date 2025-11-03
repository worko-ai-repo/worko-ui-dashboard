import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Upload, Send, ChevronDown } from "lucide-react";
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
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import AdminServiceObj from "@Components/Dashboard/WorkoAdmin/Services/Admin.service";

export type HireFormInputs = {
  jobTitle: string;
  workMode: string;
  location: string;
  department: string;
  ctc: string;
  offerLetter: FileList | null;
  remarks: string;
  joiningDate: string;
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

export default function HireNowForm({ jobData,onClose }: { jobData?: JobApplicationDetailsDto , onClose: () => void}) {
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
      jobTitle: "",
      workMode: "",
      location: "",
      department: "",
      ctc: "",
      offerLetter: null,
      remarks: "",
      joiningDate: "",
    },
  });

  // Use useEffect to reset the form values when jobResponse changes
  useEffect(() => {
    if (jobResponse) {
      const formData = {
        jobTitle: jobResponse.jobTitle || "",
        workMode: jobResponse.workMode || "",
        location: jobResponse.location?.city?.[0] || "",
        department: jobResponse.department || "",
        ctc: jobResponse.salaryRange?.max ? jobResponse.salaryRange.max.toString() : "",
        offerLetter: null,
        remarks: "",
        joiningDate: "",
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
  }, [jobResponse, reset]);

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

      // Prepare payload for admin job update - only include required fields
      const jobUpdatePayload = {
        companyId: jobResponse.companyId!,
        status: jobResponse.status,
      };

      // Call the update job API
      const isAdmin = RBAC.can("play_admin");
      let response;

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
      response = await CorporateServiceObj.updateJob(corporatePayload, {}, jobResponse.id!);

      if (!response || Array.isArray(response)) {
        throw new Error("Failed to update job details");
      }

      toast.success("Job details updated successfully", getToastOptions({}));

      // Invalidate job queries
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

      // Step 2: Request pre-signed URL for offer letter
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
        ...(data.remarks && { offerLetterRemarks: data.remarks }),
        userId: jobData?.applicantDetails.name,
        status: "OFFER_SENT",
        offerLetterCloudFileName: cloudFileName,
        emailId: jobData?.applicantDetails.email,
        userType: userType,
        applicantName: jobData?.applicantDetails.name || "Applicant",
        joiningDate: data.joiningDate,
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
          ? "Job updated and offer letter sent successfully!"
          : "Offer letter sent successfully!",
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
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 my-3 text-left">
      <h2 className="text-lg font-semibold text-gray-800">Hire now</h2>

      {hasJobFieldsChanged && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            Job details will be updated when you submit the offer letter.
          </p>
        </div>
      )}

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
          className="w-full rounded-xl bg-gray-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
          <span className="text-red-500 mr-1">*</span>
          Attach offer Letter
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

      {/* Joining Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Joining Date
        </label>
        <ReusableInput
          register={register("joiningDate", {
            required: "Joining date is required",
          })}
          type="date"
          error={errors?.joiningDate?.message}
        />
      </div>

      {/* Remarks */}
      <div className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Remarks</label>
          <textarea
            placeholder="write here"
            {...register("remarks")}
            className="mt-1 h-[95px] w-full px-4 py-2 pl-[26px] border rounded-lg bg-[#EBEFF3] focus:outline-none"
          />
          {errors?.remarks && <p className="text-sm text-red-500 mt-1">{errors.remarks.message}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="flex justify-center items-center w-fit gap-2 mb-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
          <Send size={16} />
          {hasJobFieldsChanged ? "Update Job & Send Offer" : "Send Offer"}
        </button>
      </div>
    </form>
  );
}
