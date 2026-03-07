import React, { useEffect, useRef, useState } from "react";

type BulkOptionProps = {
  options: {
    label: string;
    onClick: () => void;
  }[];
  disabled: boolean;
};

const BulkOption: React.FC<BulkOptionProps> = ({ options, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleBulk = () => setIsOpen((prev) => !prev);

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
    <div className={`relative w-full ${disabled ? "disabled cursor-not-allowed" : "cursor-pointer"}`} ref={wrapperRef} data-tooltip-id="my-tooltip" data-tooltip-content={disabled?"Select Jobs to Perform this action.": "Allow you to update jobs status in bulk mode."}>
      {/* Trigger Button */}
      <div onClick={!disabled ? toggleBulk : undefined} className={`text-sm flex justify-center w-full bg-white transition-none px-8 py-2 items-center font-semibold focus:outline-none ${disabled ? "disabled cursor-not-allowed" : ""} ${isOpen ? "rounded-b-none rounded-2xl text-blue-600" : "rounded-2xl"}`}>
        <span>Bulk</span>
        <span className="ml-1">▾</span>
      </div>

      {/* Popover Panel */}
      {isOpen && !disabled && (
        <div className={`absolute w-full bg-white rounded-2xl rounded-t-none p-4 shadow-lg z-50  ${disabled ? "disabled cursor-not-allowed" : ""}`}>
          <div className="flex flex-col gap-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick();
                  setIsOpen(false); // close after click
                }}
                className="text-center text-xs text-gray-700 hover:text-blue-600 font-medium transition">
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOption;
