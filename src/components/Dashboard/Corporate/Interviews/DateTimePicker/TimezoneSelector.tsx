import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';

interface TimezoneSelectorProps {
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
}

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ 
  selectedTimezone, 
  onTimezoneChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const timezones = [
    'Pacific Time (5:11pm)',
    'Mountain Time (6:11pm)',
    'Central Time (7:11pm)',
    'Eastern Time (8:11pm)',
    'Central European Time (8:11pm)',
    'Eastern European Time (9:11pm)',
    'India Standard Time (11:41pm)',
    'China Standard Time (2:11am)',
    'Japan Standard Time (3:11am)',
    'Australian Eastern Time (4:11am)',
    'New Zealand Standard Time (6:11am)'
  ];

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleTimezoneSelect = (timezone: string) => {
    onTimezoneChange(timezone);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="w-full flex items-center justify-between pr-4 py-2 text-sm text-left focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center">
          <Globe size={16} className="text-gray-500 mr-2" />
          <span>{selectedTimezone}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
        />
      </button>
      
      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          <ul className="py-1">
            {timezones.map((timezone, index) => (
              <li
                key={index}
                className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors duration-150 ${selectedTimezone === timezone ? 'bg-blue-50 text-blue-700' : ''}`}
                onClick={() => handleTimezoneSelect(timezone)}
                role="option"
                aria-selected={selectedTimezone === timezone}
              >
                {timezone}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TimezoneSelector;