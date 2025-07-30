import React from 'react';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export interface ScheduledSlot {
  availability: 1 | 2 | 3;
  date: string; // yyyy-mm-dd
  duration: string;
  timeSlot: string;
  startTime: number;
  endTime: number;
}

interface ScheduleInterviewSectionProps {
  availabilityIndex: number;
  setAvailabilityIndex: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
  scheduledSlots: ScheduledSlot[];
  onScheduledSlotChange: (index: number, slot: ScheduledSlot) => void;
}

const durations = ['30 mins', '45 mins', '1 hour', '1.30 hour'];

const ScheduleInterviewSection: React.FC<ScheduleInterviewSectionProps> = ({
  availabilityIndex,
  setAvailabilityIndex,
  scheduledSlots,
  onScheduledSlotChange,
}) => {
  const currentSlot = scheduledSlots[availabilityIndex - 1];

  const handleDurationChange = (duration: string) => {
    const durationHours =
      duration === '30 mins' ? 0.5 :
        duration === '45 mins' ? 0.75 :
          duration === '1 hour' ? 1 : 1.5;
    const newEndTime = currentSlot.startTime + durationHours;
    const newTimeSlot = `From ${formatTime(currentSlot.startTime)} to ${formatTime(newEndTime)}`;
    onScheduledSlotChange(availabilityIndex - 1, {
      ...currentSlot,
      duration,
      endTime: newEndTime,
      timeSlot: newTimeSlot,
    });
  };

  const handleDateChange = (date: Date) => {
    const formattedDate = date.toISOString().split('T')[0];
    onScheduledSlotChange(availabilityIndex - 1, {
      ...currentSlot,
      date: formattedDate,
    });
  };

  const handleTimeSliderChange = (start: number) => {
    const durationHours =
      currentSlot.duration === '30 mins' ? 0.5 :
        currentSlot.duration === '45 mins' ? 0.75 :
          currentSlot.duration === '1 hour' ? 1 : 1.5;
    const end = start + durationHours;
    const newTimeSlot = `From ${formatTime(start)} to ${formatTime(end)}`;
    onScheduledSlotChange(availabilityIndex - 1, {
      ...currentSlot,
      startTime: start,
      endTime: end,
      timeSlot: newTimeSlot,
    });
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = (time % 1) * 60;
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-6">
      {/* Slot Selector */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-900">Select slot</label>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <button
              key={i}
             onClick={() => setAvailabilityIndex(i as 1 | 2 | 3)}
              className={`w-10 h-9 rounded border text-lg font-semibold transition-colors ${availabilityIndex === i
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-100'}`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Date Picker */}
      <div className="space-y-4">
  <label className="block text-sm font-medium text-gray-900">Pick a date</label>
  <div className="relative">
    <DatePicker
      selected={new Date(currentSlot.date)}
      onChange={(date: Date | null) => {
        if (date) handleDateChange(date);
      }}
      dateFormat="yyyy-MM-dd"
      placeholderText="Select a date"
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
      calendarClassName="!z-50"
    />
    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
      <Calendar size={16} />
    </div>
  </div>
</div>


      {/* Duration Selector */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-900">Select duration</label>
        <div className="flex flex-wrap gap-2">
          {durations.map((duration) => (
            <button
              key={duration}
              onClick={() => handleDurationChange(duration)}
              className={`px-6 py-2 rounded-lg border text-sm font-semibold transition-colors ${currentSlot.duration === duration
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50'}`}
            >
              {duration}
            </button>
          ))}
        </div>
      </div>

      {/* Time Slider */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>12:00 AM</span>
          <span>11:59 PM</span>
        </div>
        <div className="relative">
          <div className="w-full h-1 bg-gray-200 rounded-full">
            <div
              className="h-1 bg-indigo-600 rounded-full"
              style={{
                marginLeft: `${(currentSlot.startTime / 24) * 100}%`,
                width: `${((currentSlot.endTime - currentSlot.startTime) / 24) * 100}%`
              }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="24"
            step="0.5"
            value={currentSlot.startTime}
            onChange={(e) => handleTimeSliderChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-lg"
            style={{ left: `calc(${(currentSlot.startTime / 24) * 100}% - 6px)` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-lg"
            style={{ left: `calc(${(currentSlot.endTime / 24) * 100}% - 6px)` }}
          />
        </div>
      </div>

      {/* Summary */}
      {currentSlot.timeSlot && (
        <div className="flex justify-center">
          <div className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg text-sm font-medium">
            {currentSlot.date} — {currentSlot.timeSlot}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleInterviewSection;
