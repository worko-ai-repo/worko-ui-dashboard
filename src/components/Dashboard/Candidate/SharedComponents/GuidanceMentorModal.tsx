import { FunctionComponent, useCallback } from 'react';

interface GuidanceMentorModalProps {
  variant?: 'join' | 'book';
  mentorName?: string;
  mentorDetails?: string;
  date?: string;
  time?: string;
  duration?: string;
  charge?: string;
  figmaUrl?: string;
  onAcceptAndPay?: () => void;
  className?: string;
}

const GuidanceMentorModal: FunctionComponent<GuidanceMentorModalProps> = ({
  variant = 'join',
  mentorName = 'Sam Das',
  mentorDetails = 'Normal feedback can be positive, constructive, or negative, and it can be formal or informal. Effective feedback is respectful, tactful, and non-threatening.',
  date = '24-05-2025',
  time = '7:00 pm',
  className,
  duration = '2 hrs 30 mins',
  charge = '₹4,999',
  figmaUrl = 'https://www.figma.com/proto/ENzqo1AmC80w4cmN6alJgz/Worko-Dashboards?node-id=156-6188&t=F4iKtzlqU886AMiU-0&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=2%3A10377&show-proto-sidebar=1',
  onAcceptAndPay
}) => {
  
  const onActionButtonClick = useCallback(() => {
    // console.log(variant,figmaUrl)
    if (variant === 'join') {
      window.open(figmaUrl);
    } else if (variant === 'book' && onAcceptAndPay) {
      onAcceptAndPay();
    }
  }, [figmaUrl, variant, onAcceptAndPay]);
  
  const isJoinVariant = variant === 'join';
  
  return (
    <div className={`w-full fixed top-0 right-0 max-w-[500px] bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-6 pb-4">
        <h2 className="text-sm font-semibold text-black font-['Poppins'] truncate">
          Mentor details
        </h2>
        <div className="flex items-center gap-1.5 text-sm text-[#0a0a0a] font-['Poppins']">
          <div className="w-5 h-5 bg-[#316bff] rounded-sm flex items-center justify-center">
            <span className="text-white text-xs">in</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="underline font-medium cursor-pointer hover:text-[#316bff] transition-colors">
              Linkedin
            </span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Mentor Info */}
      <div className="px-6 pb-4 space-y-4 font-['Inter']">
        <div className="flex items-start gap-3 text-xs">
          <span className="text-[#94a3b8] font-medium whitespace-nowrap">Mentor name</span>
          <span className="text-[#0f172a] font-medium font-['Poppins']">{mentorName}</span>
        </div>
        
        <div className="flex gap-3 text-xs">
          <span className="text-[#94a3b8] font-medium whitespace-nowrap">Mentor details</span>
          <p className="text-[#0f172a] font-['Poppins'] leading-tight text-xs">
            {mentorDetails}
          </p>
        </div>
      </div>
      
      {/* Meeting Details */}
      <div className="px-6 pb-4">
        <div className="text-[#94a3b8] font-medium text-left text-xs mb-3 font-['Inter']">
          Meeting time
        </div>
        
        {isJoinVariant ? (
          /* Join Variant - Horizontal Layout */
          <div className="flex gap-6">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#94a3b8] font-medium text-xs font-['Inter']">Date</span>
              <div className="bg-[#cdffff] rounded-lg px-3 py-1 text-black text-xs font-medium">
                {date}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[#94a3b8] font-medium text-xs font-['Inter']">Time</span>
              <div className="bg-[#cdffff] rounded-lg px-3 py-1 text-black text-xs font-medium">
                {time}
              </div>
            </div>
          </div>
        ) : (
          /* Book Variant - Vertical Layout with Duration */
          <div className="flex gap-2">
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[#94a3b8] font-medium text-xs font-['Inter']">Date</span>
              <div className="w-full bg-[#cdffff] rounded-lg px-2 py-1 text-black text-xs font-medium text-center">
                {date}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[#94a3b8] font-medium text-xs font-['Inter']">Time</span>
              <div className="w-full bg-[#cdffff] rounded-lg px-2 py-1 text-black text-xs font-medium text-center">
                {time}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[#94a3b8] font-medium text-xs font-['Inter']">Duration</span>
              <div className="w-full bg-[#cdffff] rounded-lg px-2 py-1 text-black text-xs font-medium text-center">
                {duration}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Charge Section (only for book variant) */}
      {!isJoinVariant && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-[#94a3b8] font-medium text-xs font-['Inter']">Charge</span>
            <span className="text-[#316bff] font-semibold text-base font-['Poppins']">{charge}</span>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="px-6 pb-6 flex flex-col gap-3">
        <button 
          onClick={onActionButtonClick}
          className="w-full bg-[#316bff] text-white rounded-lg h-11 flex items-center justify-center gap-2 hover:bg-[#2556e6] transition-colors cursor-pointer"
        >
          {isJoinVariant ? (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
              <span className="font-semibold text-xs font-['Poppins']">Join meeting</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="font-semibold text-xs font-['Poppins']">Accept and pay</span>
            </>
          )}
        </button>
        
        <button className="text-[#316bff] font-semibold text-xs text-center font-['Poppins'] hover:text-[#2556e6] transition-colors">
          {isJoinVariant ? 'Request reschedule' : 'Request cancel'}
        </button>
      </div>
    </div>
  );
};

export default GuidanceMentorModal;