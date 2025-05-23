import React from 'react';

interface TimeSlotPickerProps {
  selectedTime: string;
  onTimeSelect: (time: string) => void;
}

const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({ 
  selectedTime, 
  onTimeSelect 
}) => {
  // Generate time slots from 12:00 to 17:00 with 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 12; hour <= 17; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="grid gap-3 max-h-[65dvh] p-3">
      {timeSlots.map((time) => (
        <button
          key={time}
          className={`
            w-full py-3 px-4 text-center rounded-lg border text-sm font-bold
            transition-all duration-200 ease-in-out
            ${selectedTime === time
              ? 'border-gray-300 bg-blue-600 text-white'
              : 'border-blue-600 text-blue-600 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
          onClick={() => onTimeSelect(time)}
        >
          {time}
        </button>
      ))}
    </div>
  );
};

export default TimeSlotPicker;