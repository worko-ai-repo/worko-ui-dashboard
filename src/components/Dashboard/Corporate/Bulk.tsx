import React, { useEffect, useRef, useState } from 'react';

type BulkOptionProps = {
  options: {
    label: string;
    onClick: () => void;
  }[];
};

const BulkOption: React.FC<BulkOptionProps> = ({ options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleBulk = () => setIsOpen(prev => !prev);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Trigger Button */}
      <div
        onClick={toggleBulk}
        className={`flex hover:cursor-pointer justify-center w-full bg-white transition-none px-8 py-2 items-center font-semibold focus:outline-none ${isOpen ? 'rounded-b-none rounded-2xl text-blue-600' : 'rounded-2xl'}`}
      >
        <span>Bulk</span>
        <span className="ml-1">▾</span>
      </div>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute w-full bg-white rounded-2xl rounded-t-none p-4 shadow-lg z-50">
          <div className="flex flex-col gap-3">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick();
                  setIsOpen(false); // close after click
                }}
                className="text-center text-xs text-gray-700 hover:text-blue-600 font-medium transition"
              >
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
