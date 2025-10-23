import { ChevronDown } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

type DropDownOption = {
  label: string;
  onClick: () => void;
};

export type GenericDropdownAgencyProps = {
  options: DropDownOption[];
  disabled?: boolean;
  selectTitle?: string;
  tooltipMessage?: string;
};

const GenericDropdownAgency: React.FC<GenericDropdownAgencyProps> = ({
  options,
  disabled = false,
  selectTitle = "Select",
  tooltipMessage = "Perform bulk actions on selected rows.",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen((prev) => !prev);
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
      ref={wrapperRef}
      className={`relative min-w-56  ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      data-tooltip-id="dropdown-tooltip"
      data-tooltip-content={tooltipMessage}
    >
      {/* Trigger Button */}
      <div
        onClick={toggleDropdown}
        className={`flex justify-left text-left  min-w-56 h-10 bg-white px-2 py-2 items-center font-semibold  transition-all ${
          isOpen ? "rounded-b-none rounded-lg text-blue-600" : "rounded-lg"
        } ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span className="font-thin text-gray-400 text-xs">{selectedLabel || selectTitle}</span>
        {/* <span className="ml-1">▾</span> */}
        <button
            type="button" 
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gray-700 bg-blue-600 rounded text-white h-auto w-auto p-1"
            >
            <ChevronDown className="h-5 w-auto" />
        </button>
      </div>

      {/* Dropdown Panel */}
      {isOpen && !disabled && (
        <div className="absolute min-w-56  bg-white rounded-2xl rounded-t-none  shadow-lg z-50">
          <div className="flex flex-col  gap-1">
            {options.map((option, index) => {
              const isSelected = option.label === selectedLabel;
              return (
                <button
                  key={option.label + index}
                  onClick={() => {
                    option.onClick();
                    setSelectedLabel(option.label);
                    setIsOpen(false);
                  }}
                  className={`text-left  border-b px-4 py-1  text-xs font-medium transition ${
                    isSelected
                      ? "text-blue-600 font-semibold"
                      : "text-gray-600 hover:text-blue-600"
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

export default GenericDropdownAgency;
