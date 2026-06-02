import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { ReferAndEarnDto, ReferAndEarnUpdateApiDto } from "@Interfaces/AdminServices.dto";
import SimpleSelectInput from "@Components/Shared/PostJob/InputSelect";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import {
  ReferAndEarnJobApplicationStatusType,
  ReferAndEarnStatusType,
} from "@TypesAndConstants/JobsAndApplication.type";
import { ReferAndEarnJobStatusOptionsArray, ReferAndEarnStatusOptionsLabel } from "@TypesAndConstants/common.constants";
import AdminServiceObj from "../Services/Admin.service";

interface ReferAndEarnReferralStatusUpdateModalProps {
  data: ReferAndEarnDto;
  refetch: () => void;
  onClose: () => void;
}

interface StatusUpdateFormData {
  status: ReferAndEarnStatusType;
}

// Convert status options to select format
const allowedStatuses = [
  "WITHDRAWAL_ACCEPTED",
  "WITHDRAWAL_REJECTED",
  "PAYMENT_COMPLETED",
];

const statusSelectOptions = Object.entries(ReferAndEarnStatusOptionsLabel)
  .filter(([key]) => allowedStatuses.includes(key))
  .map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

const ReferAndEarnReferralStatusUpdateModal: React.FC<
  ReferAndEarnReferralStatusUpdateModalProps
> = ({ data, refetch, onClose }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StatusUpdateFormData>({
    defaultValues: {
      status: data.status,
    },
    mode: "onChange",
  });

  /**
   * Handle Submit
   */
  const onSubmit = async (formData: StatusUpdateFormData) => {
    setIsSubmitting(true);
    try {
      const payload: ReferAndEarnUpdateApiDto = {
        status: formData.status,
      };

      const response = await AdminServiceObj.patchReferAndEarnStatus(data.id, payload);
      if (!response) {
        throw new Error("No response from server");
      }

      toast.success("Status updated successfully!", getToastOptions());

      refetch();
      onClose();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status. Please try again.", getToastOptions());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-[400px] relative bg-white rounded-xl overflow-hidden p-6">
      {/* Header */}
      <div className="text-black text-left text-lg font-semibold font-poppins leading-tight mb-6">
        Update Application Status
      </div>

      {/* Status Update Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-left">
        {/* Status Dropdown */}
        <Controller
          name="status"
          control={control}
          rules={{
            required: "Please select a status",
          }}
          render={({ field }) => (
            <SimpleSelectInput
              label="New Status*"
              placeholder="Select new application status"
              options={statusSelectOptions}
              {...field}
              error={errors.status?.message}
              required
            />
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-start gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed text-gray-600"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="-rotate-45 text-blue-500 fill-white w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReferAndEarnReferralStatusUpdateModal;
