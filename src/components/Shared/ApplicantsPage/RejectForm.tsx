import { ChevronDownIcon, Mic, MicOff } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { SubmitButton } from "../../Dashboard/Corporate/SubmitButton";
import { JobApplicationUpdatePayloadDto } from "../../Dashboard/Corporate/Applicants/Applicants";
import CorporateServiceObj from "../../Dashboard/Corporate/Services/Corporate.service";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { useQueryClient } from "@tanstack/react-query";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";

type RejectionFormData = JobApplicationUpdatePayloadDto & {
  reason: string;
  userComment: string;
  jobId: string;
  isBulk?: boolean;
};

const onSubmit = async (data: RejectionFormData, onSuccessCallback: () => void) => {
  try {
    const { jobId, ...dataWithoutJobId } = data;
    dataWithoutJobId.status = "REJECTED";
    const response = await CorporateServiceObj.updateApplicationStatus(dataWithoutJobId, jobId);
    if (!response) throw new Error("Failed to update application status");
    toast.success(`Application Rejected Successfully`, getToastOptions({}));
  } catch (error) {
    console.error("Error updating status:", error);
    toast.error(`Failed to update application status: ${error}`, getToastOptions({}));
  } finally {
    return onSuccessCallback();
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
    setValue,
  } = useForm<RejectionFormData>({
    defaultValues: {
      reason: "",
      userComment: "",
      jobId: jobId,
      ...payload,
    },
    mode: "onChange",
  });

  const selectedReason = watch("reason");

  const invalidateJobs = () => {
    RBAC.can("play_admin")
      ? queryClient.invalidateQueries({
          queryKey: ["AdminJobsApplicationQuery"],
        })
      : queryClient.invalidateQueries({
          queryKey: ["CorporateJobsApplicationQuery"],
        });
  };

  // Use package hook
  const {
    transcript,
    finalTranscript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (finalTranscript) {
      const currentComment = watch("userComment");
      const newComment = currentComment ? `${currentComment} ${finalTranscript}` : finalTranscript;
      setValue("userComment", newComment);
      resetTranscript(); // clear buffer so it won’t re-append
    }
  }, [finalTranscript, watch, setValue, resetTranscript]);

  const handleMicClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      SpeechRecognition.startListening({ continuous: true, language: "en-IN" });
    }
  };

  const handleTextareaFocus = () => {
    if (listening) {
      SpeechRecognition.stopListening();
    }
  };

  return (
    <div className="size-full mt-4 text-left">
      <form
        onSubmit={handleSubmit((data) => onSubmit(data, invalidateJobs))}
        className="flex flex-col space-y-4 size-full">
        {/* Reason select */}
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-[26px]">
            Why are you rejecting?
          </label>
          <div className="relative">
            <select
              {...register("reason", { required: "Please select a reason" })}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white p-3 pr-10 text-sm text-gray-700 focus:outline-none"
              defaultValue="">
              <option value="" disabled hidden>
                Choose your reason for rejection
              </option>
              <option value="Salary Expectation Mismatch">Salary Expectation Mismatch</option>
              <option value="Experience Expectation Mismatch">
                Experience Expectation Mismatch
              </option>
              <option value="Educational Background Expectation Mismatch">
                Educational Background Expectation Mismatch
              </option>
              <option value="Not From The Required Industry ">
                Not From The Required Industry
              </option>
              <option value="Position Went On Hold / Closed">Position Went On Hold / Closed</option>
              <option value="other">Other</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon size={16} className="text-gray-500" />
            </div>
          </div>
          {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>}
        </div>

        {/* Comment + Mic */}
        <div className="flex flex-col gap-2">
          <div className="relative">
            <textarea
              {...register("userComment", {
                validate: (value) =>
                  selectedReason === "other" && !value.trim()
                    ? "Please provide a comment when selecting 'Other'"
                    : true,
              })}
              placeholder="Please provide detailed feedback. Click the mic to dictate or type manually."
              className="w-full h-[231px] rounded-xl bg-gray-100 p-3 text-sm focus:outline-none"
              rows={4}
              onFocus={handleTextareaFocus}
            />
            {errors.userComment && (
              <p className="text-red-500 text-xs">{errors.userComment.message}</p>
            )}
            {/* Mic controls */}
            {browserSupportsSpeechRecognition && (
              <button
                type="button"
                onClick={handleMicClick}
                className={`
                 absolute bottom-3 right-3 w-8 h-8 flex items-center justify-center rounded-full
                  transition-all duration-300 text-white
                  ${listening ? "bg-red-600 animate-pulse" : "bg-gray-600 hover:bg-gray-700"}
                `}>
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
          </div>

          {!browserSupportsSpeechRecognition && (
            <p className="text-gray-500 text-xs">
              Speech recognition is not supported in your browser
            </p>
          )}

          <SubmitButton type="submit" label="Submit" />
        </div>
      </form>
    </div>
  );
};

export default RejectionForm;
