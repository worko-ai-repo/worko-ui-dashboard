import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import React, { useEffect, useRef, useState } from "react";

type BulkStatusDropDownProps = {
  options: {
    label: string;
    onClick: () => void;
  }[];
  disabled: boolean;
  apiStatus?: JobApplicationStatusType;
  selectTitle?: string;
  tooltipMessage?: string;
};

// Explicit allowed actions per status
const statusActionMap: Partial<Record<JobApplicationStatusType, string[]>> = {
  APPLIED: ["Accept", "Reject", "Hold"],
  ACCEPTED: ["Send to evaluator", "Initiate Interview", "Initiate Hiring", "Reject", "Hold"],
  UNDER_EVALUATION: ["Send to evaluator", "Initiate Interview", "Initiate Hiring", "Reject", "Hold"], // just in case
  PROCESSING_INTERVIEW: ["Interview Done", "Initiate Hiring", "Reject", "Hold"],
  INTERVIEW_DONE: ["Initiate Hiring", "Reject", "Hold"],
  HIRING_IN_PROCESS: ["Initiate Hiring", "Reject", "Hold"],
  HIRED: ["Joined", "Reject", "Hold"],
  JOINED: [], // nothing
  REJECTED: [], // no further actions
  ALL: [], // for safety
};

const BulkStatusDropDown: React.FC<BulkStatusDropDownProps> = ({
  options,
  disabled,
  apiStatus,
  selectTitle = "Bulk",
  tooltipMessage = "Allow you to update job application status in bulk mode.",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleBulk = () => {
    if (!disabled) setIsOpen((prev) => !prev);
  };

  const getIsOptionDisabled = (label: string): boolean => {
    if (!apiStatus || apiStatus === "ALL") return false;

    // For JOINED, everything is disabled
    if (apiStatus === "JOINED") return true;

    // Allowed actions for this status
    const allowed = statusActionMap[apiStatus] || [];

    return !allowed.includes(label);
  };

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
    <div
      className={`relative min-w-40 ${
        disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
      }`}
      ref={wrapperRef}
      data-tooltip-id="my-tooltip"
      data-tooltip-content={tooltipMessage}
    >
      {/* Trigger Button */}
      <div
        onClick={toggleBulk}
        className={`flex justify-center min-w-40 bg-white px-8 py-2 items-center font-semibold focus:outline-none transition-all ${
          isOpen ? "rounded-b-none rounded-2xl text-blue-600" : "rounded-2xl"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span>{selectTitle}</span>
        <span className="ml-1">▾</span>
      </div>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute min-w-40 bg-white rounded-2xl rounded-t-none shadow-lg z-50">
          <div className="flex flex-col">
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
                  className={`border-b px-3 py-1 text-sm text-left font-medium transition ${
                    optionDisabled
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
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
