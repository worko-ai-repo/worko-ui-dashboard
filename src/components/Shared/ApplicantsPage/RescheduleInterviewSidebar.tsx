import React, { useEffect, useMemo, useState } from "react";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import { AvailabilitySchedulerModal, AttendeeForBusy } from "./AvailabilitySchedulerModal";

type EditableInterviewAttendee = AttendeeForBusy & {
  type: "EVALUATOR" | "EXTERNAL";
};

interface Props {
  jobApplication: JobApplicationDetailsDto;
  initialScheduledAt?: Date | null;
  organizer: AttendeeForBusy;
  candidate: AttendeeForBusy;
  attendees: EditableInterviewAttendee[];
  onClose: () => void;
  onSubmit: (scheduledAt: Date, attendees: EditableInterviewAttendee[]) => void | Promise<void>;
}

const RescheduleInterviewSidebar: React.FC<Props> = ({
  initialScheduledAt,
  organizer,
  candidate,
  attendees,
  onClose,
  onSubmit,
}) => {
  const [date, setDate] = useState<Date | null>(initialScheduledAt ?? null);
  const [time, setTime] = useState<string>(() => {
    if (!initialScheduledAt) return "";
    const hh = `${initialScheduledAt.getHours()}`.padStart(2, "0");
    const mm = `${initialScheduledAt.getMinutes()}`.padStart(2, "0");
    return `${hh}:${mm}`;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [extraInterviewerName, setExtraInterviewerName] = useState("");
  const [extraInterviewerEmail, setExtraInterviewerEmail] = useState("");
  const fixedEmails = useMemo(
    () => [organizer.email, candidate.email].map((email) => email.toLowerCase().trim()),
    [organizer.email, candidate.email]
  );

  const [editableAttendees, setEditableAttendees] = useState<EditableInterviewAttendee[]>(() =>
    attendees.filter((attendee) => !fixedEmails.includes(attendee.email.toLowerCase().trim()))
  );

  useEffect(() => {
    setEditableAttendees(
      attendees.filter((attendee) => !fixedEmails.includes(attendee.email.toLowerCase().trim()))
    );
  }, [attendees, fixedEmails]);

  const attendeeEmails = useMemo(() => {
    const emails = new Set<string>();
    [organizer, candidate, ...editableAttendees].forEach((item) => {
      const email = item.email.toLowerCase().trim();
      if (email) emails.add(email);
    });
    return emails;
  }, [organizer, candidate, editableAttendees]);

  const busyModalAttendees = useMemo(
    () => [organizer, candidate, ...editableAttendees].filter((item) => item.email && item.name),
    [organizer, candidate, editableAttendees]
  );

  const handleAddAttendee = () => {
    const name = extraInterviewerName.trim();
    const email = extraInterviewerEmail.trim();
    if (!name || !email) return;

    if (attendeeEmails.has(email.toLowerCase())) {
      toast.error("This attendee is already added.", getToastOptions({}));
      return;
    }

    setEditableAttendees((prev) => [
      ...prev,
      {
        type: "EXTERNAL",
        name,
        email,
      },
    ]);
    setExtraInterviewerName("");
    setExtraInterviewerEmail("");
  };

  const handleRemoveAttendee = (email: string) => {
    setEditableAttendees((prev) =>
      prev.filter((item) => item.email.toLowerCase().trim() !== email.toLowerCase().trim())
    );
  };

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
      toast.error("Selected date and time cannot be in the past.", getToastOptions({}));
      return;
    }
    // Check if same as initialScheduledAt
    if (initialScheduledAt && scheduledAt.getTime() === new Date(initialScheduledAt).getTime()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await Promise.resolve(onSubmit(scheduledAt, editableAttendees));
      onClose();
    } catch (error) {
      console.error(error, "Error while Rescheduling interview");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-3 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">Reschedule Interview</h2>
      </div>

      <div className="flex-1 px-3 py-4 space-y-4">
        <div className="rounded-xl border border-gray-200 p-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Fixed attendees</p>
            <p className="text-xs text-gray-500">Organizer and candidate cannot be removed.</p>
          </div>

          <div className="space-y-2">
            {[organizer, candidate].map((person, index) => (
              <div
                key={`${person.email}-${index}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{person.name}</p>
                  <p className="text-xs text-gray-500">{person.email}</p>
                </div>
                <span className="text-[11px] font-semibold text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                  Locked
                </span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900">Editable attendees</p>
            <p className="text-xs text-gray-500">You can add or remove the interviewers below.</p>
          </div>

          <div className="space-y-2">
            {editableAttendees.length > 0 ? (
              editableAttendees.map((person) => (
                <div
                  key={person.email}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{person.name}</p>
                    <p className="text-xs text-gray-500">{person.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttendee(person.email)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700">
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No editable attendees added.</p>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                type="text"
                value={extraInterviewerName}
                onChange={(e) => setExtraInterviewerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Attendee name"
              />
              <input
                type="email"
                value={extraInterviewerEmail}
                onChange={(e) => setExtraInterviewerEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Attendee email"
              />
              <button
                type="button"
                onClick={handleAddAttendee}
                disabled={!extraInterviewerName.trim() || !extraInterviewerEmail.trim()}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg whitespace-nowrap transition ${
                  !extraInterviewerName.trim() || !extraInterviewerEmail.trim()
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}>
                Add
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Selected time</p>
            <p className="text-sm text-gray-600">
              {date && time ? `${date.toLocaleDateString()} ${time}` : "No time selected yet"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAvailabilityModal(true)}
            className="px-4 py-2 text-sm font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition">
            Open availability calendar
          </button>
        </div>
      </div>

      <div className="px-3 py-4 border-t flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold text-gray-700 border rounded-lg">
          Cancel
        </button>
        <button
          disabled={isSubmitting}
          onClick={handleSubmit}
          className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition
            ${
              isSubmitting
                ? "bg-indigo-300 cursor-not-allowed opacity-70"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}>
          {isSubmitting ? "Submitting" : "Submit"}
        </button>
      </div>

      {showAvailabilityModal && (
        <AvailabilitySchedulerModal
          attendees={busyModalAttendees}
          durationMinutes={60}
          initialDate={date}
          initialTime={time}
          onSelect={(selectedDate, selectedTime) => {
            setDate(selectedDate);
            setTime(selectedTime);
            setShowAvailabilityModal(false);
          }}
          onClose={() => setShowAvailabilityModal(false)}
        />
      )}
    </div>
  );
};

export default RescheduleInterviewSidebar;
