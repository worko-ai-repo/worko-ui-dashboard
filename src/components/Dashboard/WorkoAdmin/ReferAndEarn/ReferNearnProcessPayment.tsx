import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { ModalBodyTable } from "@Components/Modals/ModalBodyTable";
import { ReferAndEarnDto, ReferAndEarnPaymentDoneDetailsDto } from "@Interfaces/AdminServices.dto";
import Input from "@Components/Shared/PostJob/Input";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import AdminServiceObj from "../Services/Admin.service";

interface ReferNearnProcessPaymentProps {
  data: ReferAndEarnDto;
  refetch: () => void;
  onClose: () => void;
}

const ReferNearnProcessPayment: React.FC<ReferNearnProcessPaymentProps> = ({
  data,
  refetch,
  onClose,
}) => {
  const { userDetails } = useAppContext();
  const [showUTRInput, setShowUTRInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<ReferAndEarnPaymentDoneDetailsDto>({
    defaultValues: {
      actionDate: new Date().toISOString().split("T")[0],
      amountPaid: data.commissionAmount || 0,
      uniqueTransactionReference: "",
      userId: secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERID) ?? userDetails?.id ?? "",
      userType: "ADMIN",
    },
    mode: "onChange",
  });

  /**
   * Handle Process Payment Click
   */
  const handleProcessPaymentClick = () => {
    setShowUTRInput(true);
  };

  /**
   * Handle Submit
   */
  const onSubmit = async (formData: ReferAndEarnPaymentDoneDetailsDto) => {
    setIsSubmitting(true);
    try {
      console.log("Payment processing payload:", formData);

      const response = await AdminServiceObj.patchReferAndEarnStatus(data.id, {
        paymentDoneDetails: formData,
      });
      if (!response) {
        throw new Error("No response from server");
      }

      toast.success("Payment processed successfully!", getToastOptions());
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment. Please try again.", getToastOptions());
    } finally {
      setIsSubmitting(false);
      refetch();
      reset();
      onClose();
    }
  };

  /**
   * Handle Back to Details
   */
  const handleBackToDetails = () => {
    setShowUTRInput(false);
    reset();
  };

  return (
    <div className="w-[455px] h-80 relative bg-white rounded-xl overflow-hidden p-6">
      {!showUTRInput ? (
        // Details View
        <>
          {/* Header */}
          <div className="text-black text-left text-sm font-semibold font-poppins leading-tight mb-6">
            Payment Details
          </div>

          {/* Details Section */}
          <div className="space-y-2 mb-6 !capitalize ">
            <ModalBodyTable
              className="!min-w-[120px]  "
              label="Referee name"
              value={data.referrerDetails.name || "N/A"}
            />

            <ModalBodyTable
              className="!min-w-[120px]"
              label="IFSC Code"
              value={data.referrerBankDetails?.ifscCode || "N/A"}
            />

            <ModalBodyTable
              className="!min-w-[120px]"
              label="Branch name"
              value={data.referrerBankDetails?.branchName || "N/A"}
            />

            <ModalBodyTable
              className="!min-w-[120px]"
              label="Account number"
              value={data.referrerBankDetails?.accountNumber || "N/A"}
            />
          </div>

          {/* Amount Section */}
          <div className="flex justify-between items-center mb-8">
            <span className="text-slate-400 text-xs font-medium font-inter">Amount</span>
            <div className="flex items-center gap-1">
              <span className="text-blue-600 text-base font-semibold font-poppins">
                ₹ {data.commissionAmount?.toLocaleString() || 0}
              </span>
            </div>
          </div>

          {/* Process Payment Button */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
            <button
              onClick={handleProcessPaymentClick}
              className="w-44 h-11 bg-blue-600 hover:bg-blue-700 rounded-lg flex justify-center items-center gap-2 transition-colors">
              <PaperAirplaneIcon className="w-3.5 h-3.5 text-white -rotate-45" />
              <span className="text-white text-xs font-semibold font-poppins">Process payment</span>
            </button>
          </div>
        </>
      ) : (
        // UTR Input View
        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
          {/* Header */}
          <div className="text-black text-left text-sm font-semibold font-poppins leading-tight mb-6">
            Enter Transaction Details
          </div>

          {/* UTR Input */}
          <div className="flex-1 flex flex-col text-left justify-center space-y-4">
            <Controller
              name="uniqueTransactionReference"
              control={control}
              rules={{
                required: "UTR number is required",
                minLength: { value: 12, message: "UTR number must be at least 12 characters" },
                pattern: {
                  value: /^[A-Za-z0-9]+$/,
                  message: "UTR number should contain only alphanumeric characters",
                },
              }}
              render={({ field }) => (
                <Input
                  label="UTR Number"
                  placeholder="Enter UTR/Transaction Reference Number"
                  {...field}
                  error={errors.uniqueTransactionReference?.message}
                  required
                />
              )}
            />

            {/* Amount Display */}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <span className="text-slate-400 text-xs font-medium font-inter block mb-1">
                Payment Amount
              </span>
              <span className="text-blue-600 text-lg font-semibold font-poppins">
                ₹{data.commissionAmount?.toLocaleString() || 0}
              </span>
            </div>
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
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4 -rotate-45" />
                  Pay
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReferNearnProcessPayment;
