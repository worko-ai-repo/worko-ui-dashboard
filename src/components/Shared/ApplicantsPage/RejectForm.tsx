import { ChevronDownIcon, Mic, MicOff, RotateCcw, AlertCircle } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { SubmitButton } from "../../Dashboard/Corporate/SubmitButton";
import { JobApplicationUpdatePayloadDto } from "../../Dashboard/Corporate/Applicants/Applicants";
import CorporateServiceObj from "../../Dashboard/Corporate/Services/Corporate.service";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { useQueryClient } from "@tanstack/react-query";
import { useSpeechRecognition } from '@Hooks/useSpeechSynthesis.hook';
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
    // console.log("[Submit] Payload being sent:", dataWithoutJobId);

    const response = await CorporateServiceObj.updateApplicationStatus(dataWithoutJobId, jobId);
    if (!response) throw new Error("Failed to update application status");
    toast.success(`Application Rejected Successfully`, getToastOptions({}));
  } catch (error) {
    console.error("[Submit] Error updating status:", error);
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
      ? queryClient.invalidateQueries({ queryKey: ["AdminJobsApplicationQuery"] })
      : queryClient.invalidateQueries({ queryKey: ["CorporateJobsApplicationQuery"] });
  };

  // Use the correct hook from the first file
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Update form when speech recognition provides new text (same as first file)
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setValue('userComment', transcript);
    }
  }, [transcript, setValue]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClearTranscript = () => {
    resetTranscript();
    setValue('userComment', '');
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
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-gray-800">
              Comments & Feedback
            </label>
            {isSupported && transcript && (
              <button
                type="button"
                onClick={handleClearTranscript}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={12} />
                Clear
              </button>
            )}
          </div>

          <div className="relative">
            <textarea
              {...register("userComment", {
                validate: (value) =>
                  selectedReason === "other" && !value?.trim()
                    ? "Please provide a comment when selecting 'Other'"
                    : true,
              })}
              placeholder={
                isSupported
                  ? "Click the microphone to start dictating, or type your feedback manually..."
                  : "Please type your feedback manually..."
              }
              className={`w-full h-[231px] rounded-xl p-3 text-sm focus:outline-none transition-all duration-200 ${
                isListening
                  ? 'border-2 border-blue-400 bg-blue-50'
                  : 'border border-gray-300 bg-gray-100'
              }`}
              rows={4}
              onFocus={() => {
                if (isListening) {
                  stopListening();
                }
              }}
            />
            {errors.userComment && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.userComment.message}
              </p>
            )}
            
            {/* Mic controls */}
            {isSupported && (
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={!!error}
                className={`
                  absolute bottom-3 right-3 w-12 h-12 flex items-center justify-center rounded-full
                  transition-all duration-300 text-white shadow-lg hover:shadow-xl transform hover:scale-105
                  ${isListening 
                    ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                    : "bg-blue-500 hover:bg-blue-600"
                  }
                  ${error ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}>
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
          </div>

          {/* Speech Recognition Status */}
          {isSupported && (
            <div className="space-y-2">
              {isListening && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  Listening... Speak now
                  {/* {interimTranscript && (
                    <span className="text-gray-500 italic">
                      "{interimTranscript}"
                    </span>
                  )} */}
                </div>
              )}
              
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>
          )}

          {!isSupported && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2 text-sm text-yellow-800">
                <AlertCircle size={16} />
                <span className="font-medium">Speech recognition not available</span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                This feature requires a modern browser and HTTPS connection. 
                Please type your feedback manually.
              </p>
            </div>
          )}

          <SubmitButton type="submit" label="Submit" />
        </div>
      </form>
    </div>
  );
};

export default RejectionForm;