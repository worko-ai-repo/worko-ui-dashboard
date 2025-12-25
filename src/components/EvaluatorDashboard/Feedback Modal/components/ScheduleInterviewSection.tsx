import React from "react";
import { Calendar } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";
import { useEffect } from "react";
import DatePicker from "react-datepicker";
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

const durations = ["30 mins", "45 mins", "1 hour", "1.30 hour"];

const ScheduleInterviewSection: React.FC<ScheduleInterviewSectionProps> = ({ availabilityIndex, setAvailabilityIndex, scheduledSlots, onScheduledSlotChange }) => {
  const currentSlot = scheduledSlots[availabilityIndex - 1];
  const [draggingHandle, setDraggingHandle] = React.useState<"start" | "end" | null>(null);

  const handleDurationChange = (duration: string) => {
    const durationHours = duration === "30 mins" ? 0.5 : duration === "45 mins" ? 0.75 : duration === "1 hour" ? 1 : 1.5;
    const newEndTime = currentSlot.startTime + durationHours;
    const newTimeSlot = `From ${formatTime(currentSlot.startTime)} to ${formatTime(newEndTime)}`;
    onScheduledSlotChange(availabilityIndex - 1, {
      ...currentSlot,
      duration,
      endTime: newEndTime,
      timeSlot: duration,
    });
  };

  const handleDateChange = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    onScheduledSlotChange(availabilityIndex - 1, {
      ...currentSlot,
      date: formattedDate,
    });
  };

  // const handleTimeSliderChange = (start: number) => {
  //   const durationHours = currentSlot.duration === "30 mins" ? 0.5 : currentSlot.duration === "45 mins" ? 0.75 : currentSlot.duration === "1 hour" ? 1 : 1.5;
  //   const end = start + durationHours;
  //   const newTimeSlot = `From ${formatTime(start)} to ${formatTime(end)}`;
  //   onScheduledSlotChange(availabilityIndex - 1, {
  //     ...currentSlot,
  //     startTime: start,
  //     endTime: end,
  //     // timeSlot: newTimeSlot,
  //   });
  // };

  const formatTime = (time: number) => {
    const hours = Math.floor(time);
    const minutes = (time % 1) * 60;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  useEffect(() => {
    if (currentSlot.duration && currentSlot.startTime != null && !currentSlot.timeSlot) {
      const durationHours = currentSlot.duration === "30 mins" ? 0.5 : currentSlot.duration === "45 mins" ? 0.75 : currentSlot.duration === "1 hour" ? 1 : 1.5;

      const end = currentSlot.startTime + durationHours;
      const newTimeSlot = `From ${formatTime(currentSlot.startTime)} to ${formatTime(end)}`;

      onScheduledSlotChange(availabilityIndex - 1, {
        ...currentSlot,
        endTime: end,
        timeSlot: newTimeSlot,
      });
    }
  }, [availabilityIndex, currentSlot, onScheduledSlotChange]);

  return (
    <div className="space-y-6">
      {/* Date Picker */}

      {/* Duration Selector */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-900">Select time slot</label>
        <div className="flex flex-wrap gap-2">
          {durations.map((duration) => (
            <button key={duration} onClick={() => handleDurationChange(duration)} className={`px-6 py-2 rounded-lg border text-sm font-semibold transition-colors ${currentSlot.duration === duration ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-50"}`}>
              {duration}
            </button>
          ))}
        </div>
      </div>

      <br />
      {/* Slot Selector */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex flex-col leading-tight">
            <span className="block text-sm font-medium text-gray-900">Share your availability</span>
            <span className="text-start align-middle block text-sm font-medium text-gray-900">for interview</span>
          </div>
          &nbsp; &nbsp; &nbsp;
          {[1, 2, 3].map((i) => {
            const slot = scheduledSlots[i - 1];
            const isAssigned = slot.timeSlot !== ""
            let variantClasses = "";

            if (availabilityIndex === i) {
              variantClasses = "bg-indigo-600 text-white border-indigo-600";
            } else if (isAssigned) {
              variantClasses = "bg-green-600 text-white border-green-600";
            } else {
              variantClasses = "bg-white text-indigo-600 border-indigo-300 hover:bg-indigo-100";
            }

            return (
              <button
                key={i}
                onClick={() => setAvailabilityIndex(i as 1 | 2 | 3)}
                className={`w-auto px-3 h-9 rounded border text-lg font-semibold transition-colors ${variantClasses}`}
              >
                Slot {i}
              </button>
            );
          })}

        </div>
      </div>

      <hr />

      <div className="space-y-4">
        {/* <label className="block text-sm font-medium text-gray-900">Pick a date</label> */}
        <div className="relative">
          <div className="relative inline-block">
          <DatePicker
            selected={new Date(currentSlot.date)}
            onChange={(date: Date | null) => {
              if (date) handleDateChange(date);
            }}
            minDate={new Date()}
            customInput={
              <button className="p-2 border rounded bg-white shadow hover:bg-gray-100" type="button">
                <Calendar size={24} />
              </button>
            }
            dateFormat="yyyy-MM-dd"
            placeholderText="Select a date"
            className="w-full py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            calendarClassName="!z-50"
            popperPlacement="bottom-start"
          />
          </div>

          {/* <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
            <Calendar size={30} />
          </div> */}
        </div>
      </div>

      {/* Time Slider */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>12:00 AM</span>
          <span>12:00 PM</span>
        </div>
        <div className="relative">
          <div className="w-full h-1 bg-gray-200 rounded-full">
            <div
              className="h-1 bg-indigo-600 rounded-full"
              style={{
                marginLeft: `${(currentSlot.startTime / 24) * 100}%`,
                width: `${((currentSlot.endTime - currentSlot.startTime) / 24) * 100}%`,
              }}
            />
          </div>
          <input
            type="range"
            min="0"
            max="24"
            step="0.5"
            onMouseDown={(e) => {
              const clickX = e.nativeEvent.offsetX;
              const trackWidth = e.currentTarget.offsetWidth;
              const clickPercent = clickX / trackWidth;
              const clickTime = clickPercent * 24;
              const distanceToStart = Math.abs(clickTime - currentSlot.startTime);
              const distanceToEnd = Math.abs(clickTime - currentSlot.endTime);

              setDraggingHandle(distanceToStart < distanceToEnd ? "start" : "end");
            }}
            onMouseUp={() => setDraggingHandle(null)}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              const newSlot = { ...currentSlot };

              if (draggingHandle === "start") {
                if (value < newSlot.endTime) {
                  newSlot.startTime = value;
                }
              } else if (draggingHandle === "end") {
                if (value > newSlot.startTime) {
                  newSlot.endTime = value;
                }
              }

              const durationHours = newSlot.endTime - newSlot.startTime;
              let durationStr = "";
              if (durationHours === 0.5) durationStr = "30 mins";
              else if (durationHours === 0.75) durationStr = "45 mins";
              else if (durationHours === 1) durationStr = "1 hour";
              else if (durationHours === 1.5) durationStr = "1.30 hour";
              else durationStr = `${durationHours} hrs`;

              // newSlot.duration = durationStr;
              newSlot.timeSlot = `From ${formatTime(newSlot.startTime)} to ${formatTime(newSlot.endTime)}`;

              onScheduledSlotChange(availabilityIndex - 1, newSlot);
            }}
            className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
          />

          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-lg" style={{ left: `calc(${(currentSlot.startTime / 24) * 100}% - 6px)` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white shadow-lg" style={{ left: `calc(${(currentSlot.endTime / 24) * 100}% - 6px)` }} />
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
