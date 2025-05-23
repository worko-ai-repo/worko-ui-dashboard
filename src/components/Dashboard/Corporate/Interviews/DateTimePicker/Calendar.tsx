import React from 'react';
import { SelectedDate } from './DateTimePicker';

interface CalendarProps {
  currentMonth: number;
  currentYear: number;
  selectedDate: SelectedDate;
  onDateSelect: (day: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  currentMonth,
  currentYear,
  selectedDate,
  onDateSelect
}) => {
  const weekdays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  
  // Calculate days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Calculate first day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Adjust for Monday as first day of week
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  
  // Create calendar grid
  const days = [];
  let dayCount = 1;
  
  // Create weeks
  for (let i = 0; i < 6; i++) {
    const week = [];
    
    // Create days in a week
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < startDay) {
        // Empty cells before the first day
        week.push(null);
      } else if (dayCount > daysInMonth) {
        // Empty cells after the last day
        week.push(null);
      } else {
        // Valid day in the month
        week.push(dayCount);
        dayCount++;
      }
    }
    
    days.push(week);
    
    // If we've reached the end of the month, break
    if (dayCount > daysInMonth) {
      break;
    }
  }

  const isSelected = (day: number) => {
    return (
      selectedDate.day === day &&
      selectedDate.month === currentMonth &&
      selectedDate.year === currentYear
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  return (
    <div className="calendar">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekdays.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="calendar-grid">
        {days.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-2 mb-2">
            {week.map((day, dayIndex) => (
              <div key={`day-${weekIndex}-${dayIndex}`} className="flex justify-center">
                {day !== null ? (
                  <button
                    className={`
                      w-9 h-9 flex items-center justify-center rounded-full text-sm
                      transition-all duration-200 ease-in-out
                      ${isSelected(day) 
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : isToday(day)
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                          : 'hover:bg-gray-100'
                      }
                    `}
                    onClick={() => onDateSelect(day)}
                  >
                    {day}
                  </button>
                ) : (
                  <div className="w-9 h-9"></div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;