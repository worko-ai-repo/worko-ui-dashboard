import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";

interface Props {
  jobApplication: JobApplicationDetailsDto;
  initialScheduledAt?: Date | null;
  onClose: () => void;
  onSubmit: (scheduledAt: Date) => void | Promise<void>;
}

const RescheduleInterviewSidebar: React.FC<Props> = ({
  initialScheduledAt,
  onClose,
  onSubmit,
}) => {
  const getTimeValue = (d: Date | null) => {
    if (!d) return "";
    const hh = `${d.getHours()}`.padStart(2, "0");
    const mm = `${d.getMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const [date, setDate] = useState<Date | null>(initialScheduledAt ?? null);
  const [time, setTime] = useState<string>(getTimeValue(initialScheduledAt ?? null));
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const buildScheduledAt = () => {
    if (!date || !time) return null;
    const [hh, mm] = time.split(":").map(Number);
    const next = new Date(date);
    next.setHours(hh || 0, mm || 0, 0, 0);
    return next;
  };

  const handleSubmit = async () => {
    const scheduledAt = buildScheduledAt();
    if (!scheduledAt) return;
    const now = new Date();
    // Check if selected time is in the past
    if (scheduledAt < now) {
        toast.error("Selected date and time cannot be in the past.",getToastOptions({}));
        return;
    }
    // Check if same as initialScheduledAt
    if (
        initialScheduledAt &&
        scheduledAt.getTime() === new Date(initialScheduledAt).getTime()
    ) {
        return;
    }
    setIsSubmitting(true)
    try {
      await Promise.resolve(onSubmit(scheduledAt));
      onClose();
    } catch (error){
      console.error(error,"Error while Rescheduling interview")
    } finally {
      setIsSubmitting(false)
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-3 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          Reschedule Interview
        </h2>
      </div>

      <div className="flex-1 px-3 py-4 space-y-4">
        <div className="flex gap-3">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium text-gray-900">Date</label>
            <DatePicker
              selected={date}
              onChange={(d) => setDate(d ?? null)}
              minDate={new Date()}
              dateFormat="dd MMM yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              popperPlacement="right"
            />
          </div>

          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium text-gray-900">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="px-3 py-4 border-t flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-700 border rounded-lg"
        >
          Cancel
        </button>
        <button
          disabled={isSubmitting}
          onClick={handleSubmit}
          className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition
            ${isSubmitting
              ? "bg-indigo-300 cursor-not-allowed opacity-70"
              : "bg-indigo-600 hover:bg-indigo-700"}`}
          >
          {isSubmitting ? "Submitting" :"Submit"}
        </button>
      </div>
    </div>
  );
};

export default RescheduleInterviewSidebar;