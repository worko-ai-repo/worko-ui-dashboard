import { FunctionComponent, useState } from 'react';
import { GuidanceRequest } from "../Guidance";
import httpServiceObj from '@Services/ApiHandler.service';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';

interface AcceptAndPayProps {
  request: GuidanceRequest | null;
  onAcceptAndPay?: () => void;
  className?: string;
  acceptAndPayDetails: any | null;
  closeModal:()=>void;
  onRefresh:()=>void;
  userID:string;
}

const AcceptAndPay: FunctionComponent<AcceptAndPayProps> = ({
  request,
  onAcceptAndPay,
  className,
  acceptAndPayDetails,
  closeModal,
  onRefresh,
  userID
}) => {
  const [showCancelReason, setShowCancelReason] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [submitError, setSubmitError] = useState('');
  const social = acceptAndPayDetails?.socialProfile || {};
  const about = acceptAndPayDetails?.mentorDetails?.about || '';

  const handleAcceptAndPay = async () => {
    if (!request?.id || !userID) {
      console.error('Missing request ID or actionByUserId');
      return;
    }

    try {
      const payload = {
        newStatus: "PAYMENT_CONFIRMATION_PENDING",
        actionByUserId: userID,
        actionByUserType: "CAND",     
      };

      const { response, error } = await httpServiceObj.patch(`/user/guidance-request/${request.id}/CANDIDATE_ACTION`, payload, true, {});

      if (error) {
        console.error('Error accepting request:', error);
        toast.error("Failed to accept the request", getToastOptions({}));
        return;
      }

      toast.success("Payment completed", getToastOptions({}));
      closeModal()
      onRefresh()
      return response;
    } catch (err) {
      console.error('Exception in acceptAndPay:', err);
      toast.error("Something went wrong", getToastOptions({}));
      return null;
    }
  };

  const handleRequestCancel = () => {
    setShowCancelReason(true);
  };

  const handleSubmitCancel = async () => {
    if (!cancelReason.trim()) {
      setSubmitError('Please provide a reason for cancellation.');
      return;
    }
      if (!cancelReason || cancelReason.trim().length === 0) {
    toast.error("Reason is required for cancellation", getToastOptions({}));
    return;
  }

  if (!request?.id || !userID) {
    console.error('Missing request ID or actionByUserId');
    return;
  }

  try {
    const payload = {
      newStatus: "CANCELLED",
      actionByUserId: userID,
      actionByUserType: "CAND",
      cancelReason: cancelReason
    };

    const { response, error } = await httpServiceObj.patch(`/user/guidance-request/${request.id}/CANDIDATE_ACTION`, payload, true, {});

    if (error) {
      console.error('Error patching candidate action:', error);
      return null;
    }

    setShowCancelReason(false);
    setSubmitError('');
    // console.log("Submitted cancel reason:", cancelReason);
    toast.success("Guidance Cancelled", getToastOptions({}));
    closeModal()
    onRefresh()
    return response;
  } catch (err) {
    console.error('Exception in patchCandidateAction:', err);
    return null;
  }
  };

  //   if (!acceptAndPayDetails) {
  //   return (
  //     <div className={`p-6 bg-white rounded-lg shadow-lg ${className}`}>
  //       <p>Loading payment details...</p>
  //     </div>
  //   );
  // }

return (
  <div className={`w-full fixed top-0 right-0 max-w-[500px] bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
    <div className="flex justify-between items-center p-6 pb-4">
      <h2 className="text-sm font-semibold text-black font-['Poppins'] truncate">Mentor details</h2>
    </div>

    <div className="px-6 pb-4 space-y-4 font-['Inter']">
      <div className="flex items-start gap-3 text-xs">
        <span className="text-[#94a3b8] font-medium whitespace-nowrap">Mentor name</span>
        <span className="text-[#0f172a] font-medium font-['Poppins']">
          {request?.mentorDetails?.name || 'NA'}
        </span>
      </div>

      <div className="flex items-start gap-3 text-xs">
        <span className="text-[#94a3b8] font-medium whitespace-nowrap">Mentor email</span>
        <span className="text-[#0f172a] font-medium font-['Poppins']">
          {request?.mentorDetails?.userEmail || 'NA'}
        </span>
      </div>

      <div className="flex items-start gap-3 text-xs">
        <span className="text-[#94a3b8] font-medium whitespace-nowrap">About Mentor</span>
        <p className="text-[#0f172a] font-['Poppins'] leading-tight text-xs text-left">
          {acceptAndPayDetails?.mentorDetails?.about || 'NA'}
        </p>
      </div>

        <div className="space-y-1 text-xs">
          {social && (
            <div className="flex items-start gap-2">
              <span className="text-[#94a3b8] font-medium capitalize whitespace-nowrap">
                Mentor Socials
              </span>
              <div className="flex flex-wrap gap-2 text-[#0f172a]">
                {Object.entries(social).flatMap(([platform, links]) => {
                  if (!Array.isArray(links) || links.length === 0) return [];

                  return links.map((link, idx) => (
                    <a
                      key={`${platform}-${idx}`}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-blue-600"
                    >
                      {platform}
                    </a>
                  ));
                })}
              </div>
            </div>
          )}
        </div>


    </div>

    <div className="px-6 pb-4">
      <div className="text-[#94a3b8] font-medium text-left text-xs mb-3">Meeting time</div>
      <div className="flex gap-2">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[#94a3b8] font-medium text-xs">Date</span>
          <div className="w-full bg-[#cdffff] rounded-lg px-2 py-1 text-black text-xs font-medium text-center">
            {request?.scheduleMeetingDetails?.date
              ? new Date(request.scheduleMeetingDetails.date).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'short',
                  day: '2-digit',
                })
              : 'NA'}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[#94a3b8] font-medium text-xs">Time</span>
          <div className="w-full bg-[#cdffff] rounded-lg px-2 py-1 text-black text-xs font-medium text-center">
            {request?.scheduleMeetingDetails?.time || 'NA'}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[#94a3b8] font-medium text-xs">Duration</span>
          <div className="w-full bg-[#cdffff] rounded-lg px-2 py-1 text-black text-xs font-medium text-center">
            {request?.scheduleMeetingDetails?.duration || 'NA'}
          </div>
        </div>
      </div>
    </div>

    <div className="px-6 pb-4">
      <div className="flex items-center gap-4">
        <span className="text-[#94a3b8] font-medium text-xs">Charge</span>
        <span className="text-[#316bff] font-semibold text-base font-['Poppins']">
          ₹{request?.paymentRequestDetails?.totalAmount?.toLocaleString() || 'NA'}
        </span>
      </div>
    </div>

    <div className="px-6 pb-6 flex flex-col gap-3">
      <div className="flex flex-row gap-3">
        <button
          onClick={handleAcceptAndPay}
          className="flex-1 bg-[#316bff] text-white rounded-lg h-11 flex items-center justify-center gap-2 hover:bg-[#2556e6] transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <span className="font-semibold text-xs font-['Poppins']">Accept and pay</span>
        </button>

        <button
          onClick={handleRequestCancel}
          className="flex-1 border border-[#316bff] text-[#316bff] font-semibold text-xs rounded-lg h-11 hover:text-[#2556e6] hover:border-[#2556e6] transition-colors"
        >
          Request cancel
        </button>
      </div>

      {showCancelReason && (
        <div className="flex flex-col gap-2 mt-2">
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#316bff]"
            rows={4}
            placeholder="Please enter your reason for cancellation..."
          />
          {submitError && <div className="text-red-500 text-xs font-medium">{submitError}</div>}
          <button
            onClick={handleSubmitCancel}
            className="self-start bg-[#316bff] text-white px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#2556e6] transition-colors"
          >
            Submit
          </button>
        </div>
      )}
    </div>
  </div>
);

};

export default AcceptAndPay;
