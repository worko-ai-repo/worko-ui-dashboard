import { ChevronDownIcon } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { SubmitButton } from "../../Dashboard/Corporate/SubmitButton";
import { JobApplicationUpdatePayloadDto } from "../../Dashboard/Corporate/Applicants/Applicants";
import CorporateServiceObj from "../../Dashboard/Corporate/Services/Corporate.service";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { useQueryClient } from "@tanstack/react-query";

type RejectionFormData = JobApplicationUpdatePayloadDto & {
  reason: string;
  userComment: string;
  jobId: string; // Assuming jobId is part of the form data for context
};

const onSubmit = async (data: RejectionFormData, onSuccessCallback: () => void) => {
  try {
    const { jobId, ...dataWithoutJobId } = data;
    dataWithoutJobId.status = "REJECTED";
    // Dummy function to simulate await
    const response = await CorporateServiceObj.updateApplicationStatus(dataWithoutJobId, jobId);
    if (!response) {
      throw new Error("Failed to update application status");
    }
    toast.success(`Application Rejected Successfully`, getToastOptions({}));
    console.log(`Status updated to ${data.status}`);
    // Optionally, you can refresh the data or perform other actions after updating
  } catch (error) {
    console.error("Error updating status:", error);
    toast.error(`Failed to update application status: ${error}`, getToastOptions({}));
  } finally {
    return onSuccessCallback(); // Invalidate the jobs query to refresh the data
  }
};

const RejectionForm: React.FC<{
  payload: JobApplicationUpdatePayloadDto;
  jobId: string;
}> = ({ payload, jobId }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RejectionFormData>({
    defaultValues: {
      reason: "",
      userComment: "",
      jobId: jobId, // Include jobId in the form data
      ...payload, // Spread the payload to pre-fill any other fields if needed
    },
    mode: "onChange", // Optional: Set validation mode to onChange for real-time validation
  });
  const selectedReason = watch("reason");

  const invalidateJobs = () => {
    queryClient.invalidateQueries({
      queryKey: ["CorporateJobsApplicationQuery"], // You can use partial key
    });
  };

  return (
    <div className="size-full mt-4 text-left">
      <form onSubmit={handleSubmit((data) => onSubmit(data, invalidateJobs))} className="flex flex-col space-y-4 size-full">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-[26px]">Why are you rejecting?</label>
          <div className="relative">
            <select {...register("reason", { required: "Please select a reason" })} className="w-full appearance-none rounded-xl border border-gray-300 bg-white p-3 pr-10 text-sm text-gray-700 focus:outline-none" defaultValue="">
              <option value="" disabled hidden>
                Choose your reason for rejection
              </option>
              Select option to reject
              <option value="Salary Expectation Mismatch">Salary Expectation Mismatch</option>
              <option value="Experience Expectation Mismatch">Experience Expectation Mismatch</option>
              <option value="Educational Background Expectation Mismatch">Educational Background Expectation Mismatch</option>
              <option value="Not From The Required Industry ">Not From The Required Industry </option>
              <option value="Position Went On Hold / Closed">Position Went On Hold / Closed </option>
              <option value="other">Other</option>
            </select>

            {/* Dropdown arrow icon placeholder */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon size={16} className="text-gray-500" />
            </div>
          </div>
          {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <textarea
            {...register("userComment", {
              validate: (value) => (selectedReason === "other" && !value.trim() ? "Please provide a comment when selecting 'Other'" : true),
            })}
            placeholder="Please provide a detail feedback. It will help us to do a better matching"
            className="w-full h-[231px] rounded-xl bg-gray-100 p-3 text-sm  focus:outline-none"
            rows={4}
          />
          {errors.userComment && <p className="text-red-500 text-xs ">{errors.userComment.message}</p>}
          <SubmitButton type="submit" label="Submit" />
        </div>
      </form>
    </div>
  );
};

export default RejectionForm;
