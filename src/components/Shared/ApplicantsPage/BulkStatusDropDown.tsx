import React, { useEffect, useRef, useState } from "react";

// Types of statuses for a job application
export type JobApplicationStatusType = "ALL" | "APPLIED" | "CV_DOWNLOADED" | "UNDER_EVALUATION" | "PROCESSING_INTERVIEW" | "INTERVIEW_DONE" | "ON_HOLD" | "REJECTED" | "HIRED" | "JOINED";

// Props accepted by the dropdown component
type BulkStatusDropDownProps = {
  options: {
    label: string; // What is shown in the dropdown
    onClick: () => void; // What happens when the option is clicked
  }[];
  disabled: boolean; // Entire dropdown disabled or not
  apiStatus?: JobApplicationStatusType; // Current status of the application from the backend
  selectTitle?: string; // Button title (default: "Bulk")
  tooltipMessage?: string; // Tooltip message (default: general bulk message)
};

// Defines the hierarchy of progression from start to end
const statusOrder: JobApplicationStatusType[] = ["APPLIED", "CV_DOWNLOADED", "UNDER_EVALUATION", "PROCESSING_INTERVIEW", "INTERVIEW_DONE", "ON_HOLD", "HIRED", "JOINED"];

// Maps the dropdown labels to the backend status enums
const labelToTargetStatus: Record<string, JobApplicationStatusType> = {
  Accept:"APPLIED",
  "Send to evaluator": "UNDER_EVALUATION",
  Reject: "REJECTED",
  "Initiate Interview": "PROCESSING_INTERVIEW",
  Hired: "HIRED",
  "On Hold": "ON_HOLD",
  Joined: "JOINED",
};

const BulkStatusDropDown: React.FC<BulkStatusDropDownProps> = ({ options, disabled, apiStatus, selectTitle = "Bulk", tooltipMessage = "Allow you to update job application status in bulk mode." }) => {
  const [isOpen, setIsOpen] = useState(false); // For controlling dropdown visibility
  const wrapperRef = useRef<HTMLDivElement>(null); // Reference to the wrapper div

  // Toggles dropdown visibility when user clicks the button
  const toggleBulk = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  // Returns the index of a status in the statusOrder array (e.g., "APPLIED" → 0, "HIRED" → 6)
  const getStatusLevel = (status: JobApplicationStatusType): number => statusOrder.indexOf(status);

  // Determines whether a specific dropdown option should be disabled based on current apiStatus
  const getIsOptionDisabled = (label: string): boolean => {
    if (!apiStatus || apiStatus === "ALL") {console.log("Aborting process no status found!"); return false}; // If no current status, allow all actions

    const currentLevel = getStatusLevel(apiStatus); // Get current progress level

    const targetStatus = labelToTargetStatus[label]; // Find what status the label maps to

    if (!targetStatus) {return false}; // If label not in mapping, allow it

    const targetLevel = getStatusLevel(targetStatus); // Find target level

    if (label === "Reject") {
      // Special case: Reject is only disabled if status is already "JOINED"
      return apiStatus === "JOINED";
    }

    // Disable the option if it belongs to a lower status (backward move not allowed)
    return targetLevel <= currentLevel;
  };

  // Handles clicking outside the dropdown to automatically close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative w-full ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`} ref={wrapperRef} data-tooltip-id="my-tooltip" data-tooltip-content={tooltipMessage}>
      {/* Trigger Button */}
      <div onClick={toggleBulk} className={`flex justify-center w-full bg-white px-8 py-2 items-center font-semibold focus:outline-none transition-all ${isOpen ? "rounded-b-none rounded-2xl text-blue-600" : "rounded-2xl"} ${disabled ? "cursor-not-allowed" : ""}`}>
        <span>{selectTitle}</span>
        <span className="ml-1">▾</span>
      </div>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute w-full bg-white rounded-2xl rounded-t-none p-4 shadow-lg z-50">
          <div className="flex flex-col gap-3">
            {options.map((option, index) => {
              const optionDisabled = getIsOptionDisabled(option.label);
              return (
                <button
                  key={index}
                  disabled={optionDisabled}
                  onClick={() => {
                    if (!optionDisabled) {
                      option.onClick();
                      setIsOpen(false);
                    }
                  }}
                  className={`text-center text-xs font-medium transition ${optionDisabled ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:text-blue-600"}`}>
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkStatusDropDown;
