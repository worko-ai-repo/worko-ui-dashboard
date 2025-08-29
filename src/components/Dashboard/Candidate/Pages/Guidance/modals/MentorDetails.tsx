import { FunctionComponent, useState } from 'react';
import { GuidanceRequest } from "../Guidance";
import httpServiceObj from '@Services/ApiHandler.service';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';

interface MentorDetailsProps {
  className?: string;
  figmaUrl?: string;
  request: GuidanceRequest | null;
  mentorDetails: any | null;
  closeModal:()=>void
}

const MentorDetails: FunctionComponent<MentorDetailsProps> = ({
  className,
  figmaUrl = '#',
  request,
  mentorDetails,
  closeModal,
}) => {
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const social = mentorDetails?.socialProfile || {};
  const about = mentorDetails?.mentorDetails?.about || '';

  const handleJoinClick = () => {
    window.open(figmaUrl, '_blank');
  };

  const handleRequestReschedule = () => {
    setShowRescheduleForm(true);
  };

  const handleSubmitReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Both date and time are required.');
      return;
    }

    if (!request?.id || !request?.statusTracker?.[0]?.actionByUserId) {
      console.error('Missing request ID or actionByUserId');
      return;
    }

    try {
      // const url = `https://api.dev.worko.work/user/guidance-request/${request.id}/CANDIDATE_ACTION`;

      // const payload = {
      //   newStatus: "MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE",
      //   actionByUserId: request.statusTracker[0].actionByUserId,
      //   actionByUserType: "CAND",
      //   reScheduleRequestDate: new Date(rescheduleDate).toISOString(),
      //   reScheduleRequestTime: rescheduleTime,
      // };

      const url = `https://api.dev.worko.work/user/guidance-request/01K3QFTBJARDW1YKT2K2NN91YN/CANDIDATE_ACTION`;

      const payload = {
        newStatus: "MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE",
        actionByUserId: "e1134dca-6071-70ff-2941-54fcce656f38",
        actionByUserType: "CAND",
        reScheduleRequestDate: new Date(rescheduleDate).toISOString(),
        reScheduleRequestTime: rescheduleTime,
      };
      const { response, error } = await httpServiceObj.patch(url, payload, true, {}, true);

      if (error) {
        console.error('Error submitting reschedule request:', error);
        toast.error("Failed to submit reschedule request", getToastOptions({}));
        return null;
      }

      toast.success("Reschedule request sent successfully", getToastOptions({}));
      setShowRescheduleForm(false);
      setRescheduleError('');
      closeModal()
      return response;
    } catch (err) {
      console.error('Exception in reschedule request:', err);
      toast.error("Something went wrong", getToastOptions({}));
      return null;
    }
  };

  return (
    <div className={`w-full fixed top-0 right-0 max-w-[500px] bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="flex justify-between items-center p-6 pb-4">
        <h2 className="text-sm font-semibold text-black font-['Poppins'] truncate">Mentor details</h2>
        <div className="flex items-center gap-1.5 text-sm text-[#0a0a0a] font-['Poppins']">
          <div className="w-5 h-5 bg-[#316bff] rounded-sm flex items-center justify-center">
            <span className="text-white text-xs">in</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="underline font-medium cursor-pointer hover:text-[#316bff]">Linkedin</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="px-6 pb-4 space-y-4 font-['Inter']">
        <div className="flex items-start gap-3 text-xs">
          <span className="text-[#94a3b8] font-medium whitespace-nowrap">Mentor name</span>
          <span className="text-[#0f172a] font-medium font-['Poppins']">{request?.mentorDetails?.name || 'N/A'}</span>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-[#94a3b8] font-medium whitespace-nowrap">Mentor email</span>
          <p className="text-[#0f172a] font-['Poppins'] leading-tight text-xs">{request?.mentorDetails?.userEmail || 'N/A'}</p>
        </div>
      </div>

      <div className="px-6 pb-4">
        <div className="text-[#94a3b8] font-medium text-left text-xs mb-3">Meeting time</div>
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#94a3b8] font-medium text-xs">Date</span>
            <div className="bg-[#cdffff] rounded-lg px-3 py-1 text-black text-xs font-medium">
              {request?.scheduleMeetingDetails?.date || 'N/A'}
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#94a3b8] font-medium text-xs">Time</span>
            <div className="bg-[#cdffff] rounded-lg px-3 py-1 text-black text-xs font-medium">
              {request?.scheduleMeetingDetails?.time || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-3">
        {request?.status === 'PAYMENT_CONFIRMATION_DONE' && (
          <>
            <div className="flex flex-row gap-3">
              <button
                onClick={handleJoinClick}
                className="flex-1 bg-[#316bff] text-white rounded-lg h-11 flex items-center justify-center gap-2 hover:bg-[#2556e6] transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
                <span className="font-semibold text-xs font-['Poppins']">Join meeting</span>
              </button>

              <button
                onClick={handleRequestReschedule}
                className="flex-1 border border-[#316bff] text-[#316bff] font-semibold text-xs rounded-lg h-11 hover:text-[#2556e6] hover:border-[#2556e6] transition-colors"
              >
                Request reschedule
              </button>
            </div>

            {showRescheduleForm && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#316bff]"
                  />
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#316bff]"
                  />
                </div>
                {rescheduleError && (
                  <div className="text-red-500 text-xs font-medium">{rescheduleError}</div>
                )}
                <button
                  onClick={handleSubmitReschedule}
                  className="self-start bg-[#316bff] text-white px-4 py-2 rounded-md text-xs font-semibold hover:bg-[#2556e6] transition-colors"
                >
                  Submit
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MentorDetails;
