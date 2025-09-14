import { ModalBodyTable } from "@Components/Modals/ModalBodyTable";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { GuidanceRequestDto } from "@Interfaces/AdminServices.dto";
import React, { useEffect, useState } from "react";

interface GuidanceModalProps {
  data: GuidanceRequestDto;
  onStatusChanged?: (status: "RESCHEDULE" | "REJECT") => void;
  onClose: () => void;
}

const GuidanceModal: React.FC<GuidanceModalProps> = ({ data, onStatusChanged, onClose }) => {
  const [finalData, setFinalData] = useState<GuidanceRequestDto | null>(null);
  const [isJoinButtonEnabled, setIsJoinButtonEnabled] = useState(false);

  // Check payment status from statusTracker
  const getPaymentStatusFromTracker = (statusTracker: any[]) => {
    const paymentConfirmationDone = statusTracker?.find(
      (status) => status.newStatus === "PAYMENT_CONFIRMATION_DONE"
    );
    return !!paymentConfirmationDone;
  };

  // Get payment confirmation details from statusTracker
  const getPaymentConfirmationDetails = (statusTracker: any[]) => {
    const paymentConfirmationDone = statusTracker?.find(
      (status) => status.newStatus === "PAYMENT_CONFIRMATION_DONE"
    );
    return paymentConfirmationDone || null;
  };

  // Check if join button should be enabled based on meeting time
  const checkJoinButtonStatus = (meetingDetails: any) => {
    if (!meetingDetails?.date || !meetingDetails?.time) return false;

    const meetingDateTime = new Date(meetingDetails?.date);
    const [hours, minutes] = meetingDetails?.time.split(":");
    meetingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    const now = new Date();
    const fifteenMinsBefore = new Date(meetingDateTime.getTime() - 15 * 60 * 1000);
    const thirtyMinsAfter = new Date(meetingDateTime.getTime() + 30 * 60 * 1000);

    return now >= fifteenMinsBefore && now <= thirtyMinsAfter;
  };

  const isPaid = finalData ? getPaymentStatusFromTracker(finalData?.statusTracker) : false;
  const paymentDetails = finalData ? getPaymentConfirmationDetails(finalData?.statusTracker) : null;

  useEffect(() => {
    // Simulate final cleaned data on mount
    const source = data;

    const formatted = {
      ...source,
      // Example cleanup/transformations:
      scheduleMeetingDetails: source?.scheduleMeetingDetails
        ? {
            ...source?.scheduleMeetingDetails,
            date: new Date(source?.scheduleMeetingDetails.date).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
          }
        : undefined,
      paymentRequestDetails: source?.paymentRequestDetails
        ? {
            ...source?.paymentRequestDetails,
            totalAmount: Number(source?.paymentRequestDetails.totalAmount),
          }
        : undefined,
    };

    setFinalData(formatted);

    // Check join button status
    if (source?.scheduleMeetingDetails) {
      setIsJoinButtonEnabled(checkJoinButtonStatus(source?.scheduleMeetingDetails));
    }

    // Set up interval to update join button status every minute
    const interval = setInterval(() => {
      if (source?.scheduleMeetingDetails) {
        setIsJoinButtonEnabled(checkJoinButtonStatus(source?.scheduleMeetingDetails));
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [data]);

  // Handler for request cancel
  const handleRequestCancel = () => {
    if (onStatusChanged) onStatusChanged("REJECT");
    else onClose();
  };

  // Handler for request reschedule
  const handleRequestReschedule = () => {
    if (onStatusChanged) onStatusChanged("RESCHEDULE");
    else onClose();
  };

  // Handler for join meeting
  const handleJoinMeeting = () => {
    if (finalData?.scheduleMeetingDetails?.meetingLink) {
      window.open(finalData.scheduleMeetingDetails.meetingLink, "_blank");
    }
  };

  if (!finalData) return null;

  const { mentorDetails, scheduleMeetingDetails, paymentRequestDetails } = finalData;

  return (
    <div className="w-[455px] h-[461px] space-y-8 relative bg-white overflow-hidden text-left ">
      {/* Header */}
      <div className="text-black text-lg font-semibold font-poppins">Mentor details</div>

      {/* Mentor info */}
      <div className="mt-4 flex flex-col gap-2">
        <ModalBodyTable
          className="!min-w-[120px]"
          label="Mentor name"
          value={mentorDetails?.name || "N/A"}
        />
        <ModalBodyTable
          className={"!min-w-[120px]"}
          label="Mentor details"
          value={finalData?.mentorAssignedRemarks || "No mentor details available."}
          multiline
        />
      </div>

      {/* Contact details */}
      <ModalBodyTable
        className={"!min-w-[120px]"}
        label="Contact details"
        value={mentorDetails?.userEmail || "N/A"}
      />

      {/* Meeting time */}
      <div className="flex items-center gap-8 mt-6">
        <span className="text-slate-400 text-xs font-medium font-inter">Meeting time</span>

        {/* Date / Time / Duration */}
        {scheduleMeetingDetails && (
          <div className="mt-2  flex gap-4">
            <div className="flex flex-col items-center gap-3">
              <span className="text-slate-400 text-xs font-medium font-inter">Date</span>
              <div className="bg-cyan-100 rounded-lg px-3 py-0.5 text-black text-xs font-medium font-inter">
                {scheduleMeetingDetails.date}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="text-slate-400 text-xs font-medium font-inter">Time</span>
              <div className="bg-cyan-100 rounded-lg px-3 py-0.5 text-black text-xs font-medium font-inter">
                {scheduleMeetingDetails.time}
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="text-slate-400 text-xs font-medium font-inter">Duration</span>
              <div className="bg-cyan-100 rounded-lg px-3 py-0.5 text-black text-xs font-medium font-inter">
                {scheduleMeetingDetails.duration}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Charge */}
      {paymentRequestDetails && (
        <div className="flex justify-between">
          <div className="mt-6 flex items-center gap-9">
            <span className="text-slate-400 text-xs font-medium font-inter">Guidance fees</span>
            <span className="text-blue-600 text-base font-semibold font-poppins">
              ₹{paymentRequestDetails.guidanceFee.toLocaleString()}
            </span>
          </div>

          <div className="mt-6 flex items-center gap-9">
            <span className="text-slate-400 text-xs font-medium font-inter">Platform Fee</span>
            <span className="text-blue-600 text-base font-semibold font-poppins">
              ₹{paymentRequestDetails.platformFee.toLocaleString()}
            </span>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex justify-between item-center gap-4 max-w-[50%]">
          <span className="text-slate-400 text-xs font-medium font-inter">Payment Status</span>
          <span className={`text-xs font-semibold ${isPaid ? "text-green-600" : "text-red-500"}`}>
            {isPaid ? "Completed" : "Pending"}
          </span>
        </div>

        {isPaid && finalData?.paymentConfirmationDoneDetails?.uniqueTransactionReference && (
          <div className="flex justify-between item-center gap-4">
            <span className="text-slate-400 text-xs font-medium font-inter">UTR Number</span>
            <span className="text-slate-800 text-xs font-medium">
              {finalData.paymentConfirmationDoneDetails.uniqueTransactionReference}
            </span>
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="absolute bottom-2 flex gap-4 items-center">
        {/* Join button (only when scheduled and within time window) */}
        {finalData.status === "MEETING_CONFIRMED" && (
          <button
            onClick={handleJoinMeeting}
            disabled={!isJoinButtonEnabled}
            className={`w-44 h-11 rounded-lg flex items-center justify-center gap-2 ${
              isJoinButtonEnabled
                ? "bg-blue-600 hover:bg-blue-700 cursor-pointer"
                : "bg-gray-400 cursor-not-allowed"
            }`}>
            <PaperAirplaneIcon
              className={`h-5 w-5 -rotate-45 ${
                isJoinButtonEnabled ? "text-blue-600 fill-slate-100" : "text-gray-600 fill-gray-300"
              }`}
            />
            <span
              data-tooltip-id="my-tooltip"
              data-tooltip-content={
                isJoinButtonEnabled
                  ? "Join the meeting"
                  : "You can join the meeting 15 minutes before and up to 30 minutes after the scheduled time."
              }
              className="text-white text-xs font-semibold font-poppins">
              {isJoinButtonEnabled ? "Join meeting" : "Meeting link not active"}
            </span>
          </button>
        )}

        {!["PROJECT_COMPLETED", "REJECTED", "CANCELLED"].includes(finalData.status) && (
          <button
            onClick={handleRequestCancel}
            className="text-blue-600 text-xs font-semibold font-poppins underline hover:text-blue-800">
            Cancel Request
          </button>
        )}

        {[
          "MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE",
          "MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE",
        ].includes(finalData.status) && (
          <button
            onClick={handleRequestReschedule}
            className="text-blue-600 text-xs font-semibold font-poppins underline hover:text-blue-800">
            Reschedule meeting
          </button>
        )}
      </div>
    </div>
  );
};

export default GuidanceModal;
