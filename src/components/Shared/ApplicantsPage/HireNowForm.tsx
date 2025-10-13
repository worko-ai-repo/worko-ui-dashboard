import React, { useEffect } from "react";
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
export default function HireNowForm({ jobData }: { jobData?: JobApplicationDetailsDto }) {
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
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<HireFormInputs>({
    defaultValues: {
      jobTitle: jobResponse?.jobTitle,
      workMode: jobResponse?.workMode,
      location: jobResponse?.location?.city?.[0],
      department: jobResponse?.department,
      ctc: jobResponse?.salaryRange?.max ? jobResponse.salaryRange.max.toString() : "",
      offerLetter: null,
      remarks: "",
      joiningDate: "",
    },
  });
  // Use useEffect to reset the form values when jobResponse changes
  useEffect(() => {
    if (jobResponse) {
      reset({
        jobTitle: jobResponse.jobTitle || "",
        workMode: jobResponse.workMode || "",
        location: jobResponse.location?.city?.[0] || "",
        department: jobResponse.department || "",
        ctc: jobResponse.salaryRange?.max ? jobResponse.salaryRange.max.toString() : "",
        offerLetter: null,
        remarks: "",
        joiningDate: "",
      });
    }
  }, [jobResponse, reset]);

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
        status: "OFFER_SENT",
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 my-3 text-left">
      <h2 className="text-lg font-semibold text-gray-800">Hire now</h2>

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
          className="capitalize"
          register={register("joiningDate", {
            required: "Joining date is required",
          })}
          type="text"
          placeholder="14/11/2023"
          error={errors?.joiningDate?.message}
        />
      </div>

      {/* Remarks */}
      <div className="flex flex-col gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            <span className="text-red-500 mr-1">*</span>Remarks
          </label>
          <textarea
            placeholder="write here"
            {...register("remarks")}
            className="mt-1 h-[95px] w-full px-4 py-2 pl-[26px] border rounded-lg bg-[#EBEFF3] focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="flex justify-center items-center w-fit gap-2 mb-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
          <Send size={16} />
          Send
        </button>
      </div>
    </form>
  );
}
