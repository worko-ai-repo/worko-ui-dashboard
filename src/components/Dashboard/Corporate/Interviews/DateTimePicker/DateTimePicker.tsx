import React, { useState } from 'react';
import EventDetails from './EventDetails';
import Calendar from './Calendar';
import TimeSlotPicker from './TimeSlotPicker';
import TimezoneSelector from './TimezoneSelector';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Types
export type SelectedDate = {
  day: number;
  month: number;
  year: number;
};

const DateTimePicker: React.FC = () => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<SelectedDate>({
    day: 23,
    month: 7, // August (0-indexed)
    year: today.getFullYear(),
  });
  const [selectedTime, setSelectedTime] = useState<string>('12:00');
  const [selectedTimezone, setSelectedTimezone] = useState<string>('Central European Time (8:11pm)');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate({
      day,
      month: currentMonth,
      year: currentYear
    });
  };

  const formatSelectedDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    const date = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
    const dayOfWeek = days[date.getDay()];
    const month = months[selectedDate.month];
    
    return `${dayOfWeek}, ${month} ${selectedDate.day}`;
  };

  return (
    <div className="flex flex-col md:flex-row w-full overflow-hidden">
      {/* Details Section */}
      <div className="md:w-2/5 bg-white border-r border-gray-100 p-6">
        <EventDetails />
      </div>
      
      {/* Calendar Section */}
      <div className="md:w-2/4 p-6 border-r border-gray-100 flex flex-col">
        <h2 className="text-xl font-semibold mb-6">Select a Date & Time</h2>
        
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-md font-medium">
            {monthNames[currentMonth]} {currentYear}
          </span>
          
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Calendar */}
        <Calendar 
          currentMonth={currentMonth}
          currentYear={currentYear}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
        />
        
        {/* Time zone */}
        <div className="mt-6 mb-8">
          <p className="text-sm font-medium mb-2 text-start">Time zone</p>
          <TimezoneSelector
            selectedTimezone={selectedTimezone}
            onTimezoneChange={setSelectedTimezone}
          />
        </div>

        {/* Troubleshooting button */}
        <div className="mt-auto flex justify-start">
          <button className="flex items-center text-sm text-gray-600 border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors duration-200">
            <span className="mr-2">🔧</span>
            Troubleshooting
          </button>
        </div>
      </div>
      
      {/* Time Slots Section */}
      <div className="md:w-1/3 p-6 flex flex-col pt-[80px]">
        <p className="text-sm text-gray-500 mb-4 text-start pl-3">{formatSelectedDate()}</p>
        <div className="flex-1 overflow-y-auto">
          <TimeSlotPicker
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
          />
        </div>
      </div>
    </div>
  );
};

export default DateTimePicker;