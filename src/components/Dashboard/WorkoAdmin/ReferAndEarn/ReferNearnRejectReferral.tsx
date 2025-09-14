import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { ModalBodyTable } from "@Components/Modals/ModalBodyTable";
import { ReferAndEarnDto } from "@Interfaces/AdminServices.dto";
import SimpleSelectInput from "@Components/Shared/PostJob/InputSelect";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ReferAndEarnStatusType } from "@TypesAndConstants/JobsAndApplication.type";
import AdminServiceObj from "../Services/Admin.service";

interface ReferNearnRejectReferralProps {
  data: ReferAndEarnDto;
  refetch: () => void;
  onClose: () => void;
}

interface RejectReferralFormData {
  rejectionReason: string;
  rejectionComments?: string;
}

// Predefined rejection reasons
const rejectionReasonOptions = [
  { value: "INVALID_BANK_DETAILS", label: "Invalid Bank Details" },
  { value: "DUPLICATE_REFERRAL", label: "Duplicate Referral" },
  { value: "CANDIDATE_NOT_QUALIFIED", label: "Candidate Not Qualified" },
  { value: "POLICY_VIOLATION", label: "Policy Violation" },
  { value: "INCOMPLETE_DOCUMENTATION", label: "Incomplete Documentation" },
  { value: "TECHNICAL_ISSUES", label: "Technical Issues" },
  { value: "FRAUDULENT_ACTIVITY", label: "Fraudulent Activity Suspected" },
  { value: "OTHERS", label: "Others (Please specify)" },
];

const ReferNearnRejectReferral: React.FC<ReferNearnRejectReferralProps> = ({
  data,
  refetch,
  onClose,
}) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<RejectReferralFormData>({
    defaultValues: {
      rejectionReason: "",
      rejectionComments: "",
    },
    mode: "onChange",
  });

  // Watch the rejection reason to show/hide comments field
  const selectedReason = watch("rejectionReason");
  const showCommentsField = selectedReason === "OTHERS";

  /**
   * Handle Reject Referral Click
   */
  const handleRejectReferralClick = () => {
    setShowRejectForm(true);
  };

  /**
   * Handle Submit
   */
  const onSubmit = async (formData: RejectReferralFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare the payload - only update status and rejection reason
      const payload = {
        status: "WITHDRAWAL_REJECTED" as ReferAndEarnStatusType,
        withDrawalRequestRejectedReason: showCommentsField
          ? formData.rejectionComments
          : rejectionReasonOptions.find((option) => option.value === formData.rejectionReason)
              ?.label || formData.rejectionReason,
      };

      const response = await AdminServiceObj.patchReferAndEarnStatus(data.id, {
        status: "WITHDRAWAL_REJECTED",
        withDrawalRequestRejectedReason: payload.withDrawalRequestRejectedReason,
      });
      if (!response) {
        throw new Error("No response from server");
      }

      toast.success("Referral rejected successfully!", getToastOptions());

      refetch();
      reset();
      onClose();
    } catch (error) {
      console.error("Error rejecting referral:", error);
      toast.error("Failed to reject referral. Please try again.", getToastOptions());
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle Back to Details
   */
  const handleBackToDetails = () => {
    setShowRejectForm(false);
    reset();
  };

  return (
    <div className="w-[455px]  relative bg-white rounded-xl overflow-hidden p-6">
      {!showRejectForm ? (
        // Details View
        <>
          {/* Header */}
          <div className="text-black text-left text-sm font-semibold font-poppins leading-tight mb-6">
            Referral Details
          </div>

          {/* Details Section */}
          <div className="space-y-2 mb-6">
            <ModalBodyTable
              className="!min-w-[120px]"
              label="Referee name"
              value={data.referrerDetails?.name || "N/A"}
            />

            {/*   <ModalBodyTable
              className="!min-w-[120px]"
              label="Referred candidate"
              value={data.referredCandidateDetails?.name || "N/A"}
            />

            <ModalBodyTable
              className="!min-w-[120px]"
              label="Job title"
              value={data.jobDetails?.jobTitle || "N/A"}
            /> */}

            <ModalBodyTable
              className="!min-w-[120px]"
              label="Company"
              value={data.companyDetails?.name || "N/A"}
            />

            {/* <ModalBodyTable
              className="!min-w-[120px]"
              label="Referral date"
              value={data.referralDate ? new Date(data.referralDate).toLocaleDateString() : "N/A"}
            /> */}
          </div>

          {/* Amount Section */}
          <div className="flex justify-between items-center mb-8">
            <span className="text-slate-400 text-xs font-medium font-inter">Commission Amount</span>
            <div className="flex items-center gap-1">
              <span className="text-red-600 text-base font-semibold font-poppins">
                ₹{data.commissionAmount?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* Reject Referral Button */}
          <div className="w-full ">
            <button
              onClick={handleRejectReferralClick}
              className="w-44 mx-auto h-11 bg-red-600 hover:bg-red-700 rounded-lg flex justify-center items-center gap-2 transition-colors">
              <XMarkIcon className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs  font-semibold font-poppins">Reject Request</span>
            </button>
          </div>
        </>
      ) : (
        // Reject Form View
        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
          {/* Header */}
          <div className="text-black  text-left text-sm font-semibold font-poppins leading-tight mb-6">
            Reject Withdrawal Request
          </div>

          {/* Form Fields */}
          <div className="flex-1 p-1 flex flex-col text-left justify-start overflow-auto space-y-4">
            {/* Rejection Reason Dropdown */}
            <Controller
              name="rejectionReason"
              control={control}
              rules={{
                required: "Please select a rejection reason",
              }}
              render={({ field }) => (
                <SimpleSelectInput
                  label="Rejection Reason*"
                  placeholder="Select reason for rejection"
                  options={rejectionReasonOptions}
                  {...field}
                  error={errors.rejectionReason?.message}
                  required
                />
              )}
            />

            {/* Comments Field (shown only when "Others" is selected) */}
            {showCommentsField && (
              <Controller
                name="rejectionComments"
                control={control}
                rules={{
                  required: "Please provide comments when selecting 'Others'",
                  minLength: { value: 10, message: "Comments must be at least 10 characters" },
                  maxLength: { value: 500, message: "Comments must not exceed 500 characters" },
                }}
                render={({ field }) => (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comments <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      {...field}
                      placeholder="Please provide detailed reason for rejection..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                    {errors.rejectionComments && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.rejectionComments.message}
                      </p>
                    )}
                  </div>
                )}
              />
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={handleBackToDetails}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm">
              Back
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed text-gray-600"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Rejecting...
                </>
              ) : (
                <>
                  <XMarkIcon className="w-4 h-4" />
                  Reject
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReferNearnRejectReferral;
