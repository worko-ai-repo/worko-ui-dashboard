import React from 'react';
import { ChevronDown } from 'lucide-react';

interface RejectionSectionProps {
  selectedReason: string;
  onReasonChange: (reason: string) => void;
  comment: string;
  onCommentChange: (comment: string, htmlComment: string) => void;
  isDropdownOpen: boolean;
  onDropdownToggle: (open: boolean) => void;
}

const RejectionSection: React.FC<RejectionSectionProps> = ({
  selectedReason,
  onReasonChange,
  comment,
  onCommentChange,
  isDropdownOpen,
  onDropdownToggle
}) => {
  const rejectionReasons = [
    'Profile does not match the required skills or experience',
    'Relevant industry/domain experience not founde',
    'Academic qualifications do not meet role requirements',
    'Overqualified for this position',
    'Career gap(s) do not meet policy criteria',
    'Stability / Frequent job change',
    'Role already filled/position closed',
    'Already in process with another candidate',
    'Salary expectations not aligned with role',
    'Other'
  ];

  const handleReasonSelect = (reason: string) => {
    onReasonChange(reason);
    onDropdownToggle(false);
  };

  return (
    <div className="space-y-6">
      {/* Reason Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Select rejection reason <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <button
            onClick={() => onDropdownToggle(!isDropdownOpen)}
            className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
          >
            <span className={selectedReason ? 'text-gray-900' : 'text-gray-500'}>
              {selectedReason || 'Choose your reason for rejection'}
            </span>
            <ChevronDown
              size={18}
              className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''
                }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              {rejectionReasons.map((reason) => (
                <button
                  key={reason}
                  onClick={() => handleReasonSelect(reason)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="text-sm text-gray-900">{reason}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detailed Feedback */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Comments <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => {
            const raw = e.target.value;
            const html = `<p>${raw.replace(/\n/g, '<br/>')}</p>`;
            onCommentChange(raw, html);
          }}
          placeholder="Please provide your comments. It will help us do better matching."
          className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:bg-white resize-none text-sm transition-colors"
        />
      </div>
    </div>
  );
};

export default RejectionSection;