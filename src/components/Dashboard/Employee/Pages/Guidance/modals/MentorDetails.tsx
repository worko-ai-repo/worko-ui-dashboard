import { FunctionComponent, useEffect, useState } from 'react';
import { GuidanceRequest } from "../Guidance";
import httpServiceObj from '@Services/ApiHandler.service';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';
import { Send } from 'lucide-react';

interface MentorDetailsProps {
  className?: string;
  figmaUrl?: string;
  request: GuidanceRequest | null;
  mentorDetails: any | null;
  closeModal:()=>void;
  onRefresh:()=>void;
  mentorID:string;
}

const MentorDetails: FunctionComponent<MentorDetailsProps> = ({
  className,
  figmaUrl = '#',
  request,
  mentorDetails,
  closeModal,
  onRefresh,
  mentorID
}) => {
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');
  const [linkedin,setLinkedin] = useState("")
  const social = mentorDetails?.socialProfile || {};
  const about = mentorDetails?.about || '';

useEffect(() => {
  Object.entries(social).forEach(([platform, links]) => {
    if (platform.toLowerCase() === "linkedin" && Array.isArray(links) && links.length > 0) {
      const rawLink = links[0];
      const validLink = /^https?:\/\//i.test(rawLink) ? rawLink : `https://${rawLink}`;
      setLinkedin(validLink);
    }
  });
}, [social]);



  const handleJoinClick = () => {
    window.open(figmaUrl, '_blank');
  };

  const handleRequestReschedule = () => {
    setShowRescheduleForm(true);
  };

  const isMeetingSoon = (() => {
    const meetingDateStr = request?.scheduleMeetingDetails?.date;
    if (!meetingDateStr) return false;

    const now = new Date();
    const meetingDate = new Date(meetingDateStr);

    const diffMs = meetingDate.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);
    // console.log(diffMins)
    return diffMins <= 15 && diffMins >= -5; 
  })();

  const isRescheduleSoon = (() => {
    const meetingDateStr = request?.scheduleMeetingDetails?.date;
    if (!meetingDateStr) return false;

    const now = new Date();
    const meetingDate = new Date(meetingDateStr);

    const diffMs = meetingDate.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);

    // console.log(diffMins);

    return diffMins > 30;
  })();



  const handleSubmitReschedule = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleError('Both date and time are required.');
      return;
    }

    const rescheduleDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);

    if (rescheduleDateTime <= new Date()) {
      setRescheduleError('Reschedule date and time cannot be in the past.');
      return;
    }

    if (!request?.id || !mentorID) {
      console.error('Missing request ID or actionByUserId');
      return;
    }

    try {
      console.log(request)
      const payload = {
        newStatus: "MEETING_RESCHEDULE_REQUESTED_BY_MENTOR",
        actionByUserId: mentorID,
        actionByUserType: "EMP",
        reScheduleRequestDate: new Date(rescheduleDate).toISOString(),
        reScheduleRequestTime: rescheduleTime,
      };
      console.log(payload)
      const { response, error } = await httpServiceObj.patch(`/user/guidance-request/${request.id}/MENTOR_ACTION`, payload, true, {});

      if (error) {
        console.error('Error submitting reschedule request:', error);
        toast.error("Failed to submit reschedule request", getToastOptions({}));
        return null;
      }

      toast.success("Reschedule request sent successfully", getToastOptions({}));
      setShowRescheduleForm(false);
      setRescheduleError('');
      closeModal()
      onRefresh()
      return response;
    } catch (err) {
      console.error('Exception in reschedule request:', err);
      toast.error("Something went wrong", getToastOptions({}));
      return null;
    }
  };

    if (request?.status === 'CANCELLED') {
    return (
      <div className={`w-full fixed top-0 right-0 max-w-[500px] bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
        <div className="flex justify-between items-center p-6 pb-4">
          <h2 className="text-sm font-semibold text-black font-['Poppins'] truncate">Cancel Reason</h2>
        </div>
        <div className="px-6 pb-4 space-y-4 font-['Inter']">
          <div className="flex items-start gap-3 text-xs">
            <span className="text-[#0f172a] font-medium font-['Poppins']">{request.cancelledByDetails?.reason}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full fixed top-0 right-0 max-w-[500px] bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="flex justify-between items-center p-6 pb-4">
        <h2 className="text-sm font-semibold text-black font-['Poppins'] truncate">Candidate details</h2>
        {linkedin !== "" &&
        <div className="flex items-center gap-1.5 text-sm text-[#0a0a0a] font-['Poppins']">
          <div className="w-5 h-5 bg-[#316bff] rounded-sm flex items-center justify-center">
            <span className="text-white text-xs">in</span>
          </div>
          <div className="flex items-center gap-1">
            <a href={linkedin} rel="noopener noreferrer" target='_blank'>
                <span className="underline font-medium cursor-pointer hover:text-[#316bff]">Linkedin</span>
            </a>         
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
            </svg>
          </div>
        </div>
        }
      </div>

      <div className="px-6 pb-4 space-y-4 font-['Inter']">
        {/* Mentor Name */}
        <div className="flex items-start gap-3 text-xs">
          <span className="text-[#94a3b8] font-medium whitespace-nowrap">Candidate name</span>
          <span className="text-[#0f172a] font-medium font-['Poppins']">{request?.mentorDetails?.name || 'N/A'}</span>
        </div>

        {/* Mentor Email */}
        <div className="flex gap-3 text-xs">
            <span className="text-[#94a3b8] font-medium whitespace-nowrap">Candidate email</span>
            <p className="text-[#0f172a] font-['Poppins'] leading-tight text-xs">{request?.mentorDetails?.userEmail || 'N/A'}</p>
        </div>

        {/* About */}
        <div className="flex items-start gap-3 text-xs">
          <span className="text-[#94a3b8] font-medium whitespace-nowrap">About Candidate</span>
          <p className="text-[#0f172a] font-['Poppins'] leading-tight text-xs">
            {mentorDetails?.about || 'NA'}
          </p>
        </div>

        {/* Move here */}
        <div className="space-y-1 text-xs">
          {social && (
            <div className="flex items-start gap-2">
              <span className="text-[#94a3b8] font-medium capitalize whitespace-nowrap">
                Candidate Socials
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
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-1">
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
          <div className="flex flex-col items-center gap-1">
            <span className="text-[#94a3b8] font-medium text-xs">Time</span>
            <div className="bg-[#cdffff] rounded-lg px-3 py-1 text-black text-xs font-medium">
              {request?.scheduleMeetingDetails?.time || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 flex flex-col gap-3">
        {(request?.status === 'MEETING_CONFIRMED' || 
        request?.status === 'MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE' ||
        request?.status === "MEETING_RESCHEDULE_CONFIRMED")  && (
          <>
            <div className="flex flex-row gap-3">
              <div className='relative group flex-1 min-w-0'>
              <button
                onClick={handleJoinClick}
                disabled={!isMeetingSoon}
                className={`w-full flex-1 rounded-lg h-11 flex items-center justify-center gap-2 transition-colors 
                  ${isMeetingSoon 
                    ? 'bg-[#316bff] text-white hover:bg-[#2556e6] cursor-pointer' 
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
                <span className="font-semibold text-xs font-['Poppins']">Join meeting</span>
              </button>
              {/* Tooltip for hover*/}
                {!isMeetingSoon && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                    You can join 15 mins before the meeting
                  </div>
                )}
              </div>
              <div className='relative group flex-1 min-w-0'>
          <button
            onClick={handleRequestReschedule}
            disabled={!isRescheduleSoon}
            className={`w-full flex-1 rounded-lg h-11 font-semibold text-xs flex items-center justify-center transition-colors
          ${isRescheduleSoon 
            ? 'border border-[#316bff] text-[#316bff] hover:text-[#2556e6] hover:border-[#2556e6] cursor-pointer' 
            : 'border border-gray-300 text-gray-400 cursor-not-allowed'}`}
          >
            Request reschedule
          </button>
          {/* Tooltip for hover*/}
          {!isRescheduleSoon && (
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                You can reschedule 30 mins before the meeting
              </div>
            )}
              </div>
            </div>

            {showRescheduleForm && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={rescheduleDate}
                    min={new Date().toISOString().split('T')[0]}
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
                  className="self-start bg-[#316bff] text-white px-4 py-3 rounded-md text-xs font-semibold hover:bg-[#2556e6] transition-colors flex items-center gap-2"
                >
                <Send size={16} />
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
