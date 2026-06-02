/**
 * AvailabilitySchedulerModal.tsx
 *
 * Drop-in week-view free/busy scheduler.
 *
 * Changes from v1:
 *  1. Data fetched ONCE for 6-month range on mount — no re-fetch on week navigation.
 *  2. Contiguous busy blocks per user are merged → single name chip spans the block.
 *  3. Single-person busy slots now show red background correctly.
 *  4. Past weeks are skipped — weekStart always begins from today's week; prevWeek is clamped.
 *  5. Attendee display names come from the API response (UserBusy.name), not the form.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Clock,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface AttendeeForBusy {
  userId?: string;
  email: string;
  name: string;
}

interface BusySlot {
  start: string; // ISO
  end: string; // ISO
}

interface UserBusy {
  id: string;
  name: string; // canonical name from API — used for display (fix #5)
  email: string;
  busySlots: BusySlot[];
}

interface FreeBusyResponse {
  success: boolean;
  totalBusySlots: number;
  users: UserBusy[];
}

export interface AvailabilitySchedulerModalProps {
  attendees: AttendeeForBusy[];
  durationMinutes?: number;
  initialDate?: Date | null;
  initialTime?: string;
  onSelect: (date: Date, time: string) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SLOT_MINUTES = 30;
const HOURS_START = 8;
const HOURS_END = 21;
const SLOTS_PER_DAY = ((HOURS_END - HOURS_START) * 60) / SLOT_MINUTES;

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const ATTENDEE_COLORS = [
  { bg: "#EDE9FE", text: "#5B21B6", border: "#C4B5FD" },
  { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" },
  { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" },
  { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" },
  { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" },
  { bg: "#FCE7F3", text: "#9D174D", border: "#F9A8D4" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function startOfWeek(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - c.getDay());
  return c;
}

function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function slotKey(date: Date, slotIndex: number) {
  return `${date.toDateString()}-${slotIndex}`;
}

function slotToDate(dayDate: Date, slotIndex: number): Date {
  const d = new Date(dayDate);
  const totalMinutes = HOURS_START * 60 + slotIndex * SLOT_MINUTES;
  d.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  return d;
}

function slotEndDate(slotStart: Date, durationMinutes: number): Date {
  return new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
}

function formatHour(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return m === 0 ? `${hh} ${ampm}` : `${hh}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function timeStringFromDate(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #2 helper — merge contiguous busy slots per user into blocks
// Returns: array of { userName, start: Date, end: Date }
// ─────────────────────────────────────────────────────────────────────────────

interface MergedBlock {
  userName: string;
  start: Date;
  end: Date;
}

function mergeUserBlocks(users: UserBusy[]): MergedBlock[] {
  const result: MergedBlock[] = [];
  for (const user of users) {
    if (!user.busySlots.length) continue;
    // Sort slots chronologically
    const sorted = [...user.busySlots]
      .map((s) => ({ start: new Date(s.start), end: new Date(s.end) }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    let current = { ...sorted[0] };
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      // Contiguous or overlapping → extend
      if (next.start.getTime() <= current.end.getTime()) {
        current.end = next.end.getTime() > current.end.getTime() ? next.end : current.end;
      } else {
        result.push({ userName: user.name, start: current.start, end: current.end });
        current = { ...next };
      }
    }
    result.push({ userName: user.name, start: current.start, end: current.end });
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fix #1 — fetch ONCE for 6-month window; slice by week in the UI
// ─────────────────────────────────────────────────────────────────────────────

function useFreeBusySixMonths(attendees: AttendeeForBusy[]) {
  const [data, setData] = useState<UserBusy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payloadKey = JSON.stringify(
    attendees.map((a) => ({ userEmail: a.email, userName: a.name }))
  );

  useEffect(() => {
    if (!attendees.length) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    const payload = attendees.map((a) => ({
      userEmail: a.email,
      userName: a.name,
    }));

    httpServiceObj
      .post<FreeBusyResponse>(`/user/freebusy/query`, payload, true, {})
      .then(({ response, error: err }) => {
        if (cancelled) return;
        if (err || !response?.success) {
          setError("Could not load availability. Slots may still be selected.");
          setData([]);
        } else {
          setData(response.users ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Network error fetching availability.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Only re-fetch when attendees change — NOT on week navigation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey]);

  return { data, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const AvailabilitySchedulerModal: React.FC<AvailabilitySchedulerModalProps> = ({
  attendees,
  durationMinutes = 60,
  initialDate,
  initialTime,
  onSelect,
  onClose,
}) => {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Fix #4 — clamp initial week to today's week; never start in the past
  const todayWeekStart = useMemo(() => startOfWeek(today), [today]);

  const [weekStart, setWeekStart] = useState<Date>(() => {
    const ws = startOfWeek(initialDate ?? today);
    return ws < todayWeekStart ? todayWeekStart : ws;
  });

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Fix #1 — fetch once, no weekEnd dependency
  const { data: busyUsers, loading, error } = useFreeBusySixMonths(attendees);

  // Fix #5 — build display name map keyed by email from API response
  // Falls back to form name if API didn't return that user (shouldn't happen)
  const apiNameByEmail = useMemo(() => {
    const m = new Map<string, string>();
    busyUsers.forEach((u) => m.set(u.email, u.name));
    return m;
  }, [busyUsers]);

  // Resolved attendee list with API names where available
  const resolvedAttendees = useMemo(
    () =>
      attendees.map((a) => ({
        ...a,
        displayName: apiNameByEmail.get(a.email) ?? a.name,
      })),
    [attendees, apiNameByEmail]
  );

  // Fix #2 — merge contiguous blocks per user
  const mergedBlocks = useMemo(() => mergeUserBlocks(busyUsers), [busyUsers]);

  // Color map keyed by email (stable across re-renders)
  const attendeeColorMap = useMemo(() => {
    const m = new Map<string, (typeof ATTENDEE_COLORS)[0]>();
    resolvedAttendees.forEach((a, i) => {
      m.set(a.email, ATTENDEE_COLORS[i % ATTENDEE_COLORS.length]);
    });
    return m;
  }, [resolvedAttendees]);

  // Helper: color by API name (for chip rendering)
  const colorByName = useCallback(
    (name: string) => {
      const entry = resolvedAttendees.find((a) => a.displayName === name);
      return entry ? attendeeColorMap.get(entry.email) ?? ATTENDEE_COLORS[0] : ATTENDEE_COLORS[0];
    },
    [resolvedAttendees, attendeeColorMap]
  );

  // ── Build slotKey → busy names (uses 30-min overlap, raw slots for heatmap)
  const busyMap = useMemo<Map<string, string[]>>(() => {
    const map = new Map<string, string[]>();
    busyUsers.forEach((user) => {
      user.busySlots.forEach((slot) => {
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        weekDays.forEach((day) => {
          for (let s = 0; s < SLOTS_PER_DAY; s++) {
            const cellStart = slotToDate(day, s);
            const cellEnd = slotEndDate(cellStart, SLOT_MINUTES);
            if (cellStart < slotEnd && cellEnd > slotStart) {
              const key = slotKey(day, s);
              const existing = map.get(key) ?? [];
              // Use API display name (fix #5)
              if (!existing.includes(user.name)) existing.push(user.name);
              map.set(key, existing);
            }
          }
        });
      });
    });
    return map;
  }, [busyUsers, weekDays]);

  // ── Build per-column merged block visual data
  // For each day column: array of { userName, startSlot, spanSlots, color }
  interface VisualBlock {
    userName: string;
    startSlot: number;
    spanSlots: number;
    color: (typeof ATTENDEE_COLORS)[0];
    stackIndex: number; // horizontal stack position within a cell
    totalInStack: number;
  }

  const visualBlocksByDay = useMemo(() => {
    const result = new Map<string, VisualBlock[]>();
    weekDays.forEach((day) => {
      const dayBlocks: VisualBlock[] = [];
      const userBlocksForDay: Array<{
        userName: string;
        startSlot: number;
        spanSlots: number;
        color: (typeof ATTENDEE_COLORS)[0];
      }> = [];

      mergedBlocks.forEach((block) => {
        const dayStart = new Date(day);
        dayStart.setHours(HOURS_START, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(HOURS_END, 0, 0, 0);

        // Does this block overlap this day?
        if (block.end <= dayStart || block.start >= dayEnd) return;

        const effectiveStart = block.start < dayStart ? dayStart : block.start;
        const effectiveEnd = block.end > dayEnd ? dayEnd : block.end;

        const startMinutes =
          effectiveStart.getHours() * 60 + effectiveStart.getMinutes() - HOURS_START * 60;
        const endMinutes =
          effectiveEnd.getHours() * 60 + effectiveEnd.getMinutes() - HOURS_START * 60;

        const startSlot = Math.floor(startMinutes / SLOT_MINUTES);
        const endSlot = Math.ceil(endMinutes / SLOT_MINUTES);
        const spanSlots = Math.max(1, endSlot - startSlot);

        if (startSlot < 0 || startSlot >= SLOTS_PER_DAY) return;

        userBlocksForDay.push({
          userName: block.userName,
          startSlot,
          spanSlots,
          color: colorByName(block.userName),
        });
      });

      // Assign horizontal stack positions for overlapping blocks
      userBlocksForDay.forEach((b, i) => {
        // Find how many blocks overlap with this one
        const overlapping = userBlocksForDay.filter(
          (other) =>
            other.startSlot < b.startSlot + b.spanSlots &&
            other.startSlot + other.spanSlots > b.startSlot
        );
        const stackIndex = overlapping.indexOf(b);
        dayBlocks.push({ ...b, stackIndex, totalInStack: overlapping.length });
      });

      result.set(day.toDateString(), dayBlocks);
    });
    return result;
  }, [mergedBlocks, weekDays, colorByName]);

  // ── Blocked slots (all attendees busy for full duration)
  const blockedSlots = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    const now = new Date();
    const attendeeCount = resolvedAttendees.length;
    weekDays.forEach((day) => {
      for (let s = 0; s < SLOTS_PER_DAY; s++) {
        const slotStart = slotToDate(day, s);
        if (slotStart <= now) {
          set.add(slotKey(day, s));
          continue;
        }
        const durationSlots = Math.ceil(durationMinutes / SLOT_MINUTES);
        for (let ds = 0; ds < durationSlots; ds++) {
          const checkKey = slotKey(day, s + ds);
          if (attendeeCount > 0 && (busyMap.get(checkKey)?.length ?? 0) >= attendeeCount) {
            set.add(slotKey(day, s));
            break;
          }
        }
      }
    });
    return set;
  }, [busyMap, weekDays, durationMinutes, resolvedAttendees.length]);

  // Fix #3 — partial busy: any attendee busy → tint red (not just all)
  // blockedSlots covers "all busy"; partialBusySlots covers "some busy"
  const partialBusySlots = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    busyMap.forEach((names, key) => {
      if (names.length > 0) set.add(key);
    });
    return set;
  }, [busyMap]);

  // Selected slot
  const [selectedKey, setSelectedKey] = useState<string | null>(() => {
    if (!initialDate || !initialTime) return null;
    const [hh, mm] = initialTime.split(":").map(Number);
    const d = new Date(initialDate);
    d.setHours(hh, mm, 0, 0);
    const slotIndex = ((hh - HOURS_START) * 60 + mm) / SLOT_MINUTES;
    if (slotIndex < 0 || slotIndex >= SLOTS_PER_DAY) return null;
    return slotKey(d, slotIndex);
  });

  const [tooltip, setTooltip] = useState<{
    key: string;
    names: string[];
    x: number;
    y: number;
  } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleSlotClick = useCallback(
    (day: Date, slotIndex: number) => {
      const key = slotKey(day, slotIndex);
      if (blockedSlots.has(key)) return;
      setSelectedKey(key);
    },
    [blockedSlots]
  );

  const handleConfirm = () => {
    if (!selectedKey) return;
    const lastDash = selectedKey.lastIndexOf("-");
    const dateStr = selectedKey.slice(0, lastDash);
    const slotIndex = Number(selectedKey.slice(lastDash + 1));
    const day = weekDays.find((d) => d.toDateString() === dateStr);
    if (!day) return;

    const durationSlots = Math.ceil(durationMinutes / SLOT_MINUTES);
    const busyDuringSelection = new Set<string>();
    for (let ds = 0; ds < durationSlots; ds++) {
      const checkKey = slotKey(day, slotIndex + ds);
      (busyMap.get(checkKey) ?? []).forEach((name) => busyDuringSelection.add(name));
    }

    if (
      resolvedAttendees.length > 0 &&
      busyDuringSelection.size > 0 &&
      busyDuringSelection.size < resolvedAttendees.length
    ) {
      toast.warning(
        `Some attendees are busy at this time (${busyDuringSelection.size}/${resolvedAttendees.length}).`,
        getToastOptions({})
      );
    }

    const selected = slotToDate(day, slotIndex);
    onSelect(selected, timeStringFromDate(selected));
  };

  // Fix #4 — clamp prevWeek so we never go before today's week
  const prevWeek = () =>
    setWeekStart((w) => {
      const candidate = addDays(w, -7);
      return candidate < todayWeekStart ? todayWeekStart : candidate;
    });
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));
  const goToday = () => setWeekStart(todayWeekStart);

  const isPrevDisabled = weekStart <= todayWeekStart;

  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (gridRef.current) {
      const slotH = 28;
      const offset = ((1 * 60) / SLOT_MINUTES) * slotH;
      gridRef.current.scrollTop = offset;
    }
  }, []);

  const weekLabel = useMemo(() => {
    const ws = weekDays[0];
    const we = weekDays[6];
    if (ws.getMonth() === we.getMonth()) {
      return `${MONTHS[ws.getMonth()]} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
    }
    return `${MONTHS[ws.getMonth()]} ${ws.getDate()} – ${
      MONTHS[we.getMonth()]
    } ${we.getDate()}, ${we.getFullYear()}`;
  }, [weekDays]);

  const selectedLabel = useMemo(() => {
    if (!selectedKey) return null;
    const lastDash = selectedKey.lastIndexOf("-");
    const dateStr = selectedKey.slice(0, lastDash);
    const slotIndex = Number(selectedKey.slice(lastDash + 1));
    const day = weekDays.find((d) => d.toDateString() === dateStr);
    if (!day) return null;
    const start = slotToDate(day, slotIndex);
    const end = slotEndDate(start, durationMinutes);
    return `${DAYS[start.getDay()]}, ${MONTHS[start.getMonth()]} ${start.getDate()} · ${formatHour(
      start.getHours() * 60 + start.getMinutes()
    )} – ${formatHour(end.getHours() * 60 + end.getMinutes())}`;
  }, [selectedKey, weekDays, durationMinutes]);

  return createPortal(
    <div
      className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if ((e.target as HTMLElement).dataset.backdrop) onClose();
      }}
      data-backdrop="1">
      <div
        className="relative bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: "min(96vw, 1200px)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}>
        {/* ── Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <CalendarCheck size={18} className="text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Pick a time</h2>
            <span className="text-xs text-gray-400 font-normal ml-1">{durationMinutes} min</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <X size={16} />
          </button>
        </div>

        {/* ── Attendee legend — fix #5: show API names */}
        {resolvedAttendees.length > 0 && (
          <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-50 bg-gray-50/60 flex-wrap shrink-0">
            <Users size={12} className="text-gray-400 shrink-0" />
            {resolvedAttendees.map((a) => {
              const color = attendeeColorMap.get(a.email) ?? ATTENDEE_COLORS[0];
              return (
                <span
                  key={a.email}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                  style={{ background: color.bg, color: color.text, borderColor: color.border }}>
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block"
                    style={{ background: color.text }}
                  />
                  {a.displayName} {/* API name */}
                </span>
              );
            })}
            {error && (
              <span className="flex items-center gap-1 text-[11px] text-amber-600 ml-auto">
                <AlertCircle size={11} /> {error}
              </span>
            )}
          </div>
        )}

        {/* ── Week nav — fix #4: prevWeek disabled at today's week */}
        <div className="flex items-center gap-2 px-5 py-2 shrink-0 border-b border-gray-100">
          <button
            onClick={prevWeek}
            disabled={isPrevDisabled}
            className={`p-1 rounded-lg transition ${
              isPrevDisabled
                ? "text-gray-200 cursor-not-allowed"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-800"
            }`}>
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[180px] text-center">
            {weekLabel}
          </span>
          <button
            onClick={nextWeek}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition">
            <ChevronRight size={15} />
          </button>
          <button
            onClick={goToday}
            className="ml-2 px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition">
            Today
          </button>
        </div>

        {/* ── Day headers */}
        <div className="grid shrink-0" style={{ gridTemplateColumns: "44px repeat(7, 1fr)" }}>
          <div />
          {weekDays.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toDateString()}
                className="py-1.5 text-center border-b border-l border-gray-100">
                <div
                  className={`text-[11px] font-medium ${
                    isToday ? "text-indigo-600" : "text-gray-400"
                  }`}>
                  {DAYS[day.getDay()]}
                </div>
                <div
                  className={`text-sm font-bold mx-auto w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? "bg-indigo-600 text-white" : "text-gray-800"
                  }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Scrollable time grid */}
        <div ref={gridRef} className="flex-1 overflow-y-auto relative" style={{ minHeight: 0 }}>
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-500">Loading availability…</span>
              </div>
            </div>
          )}

          <div className="grid" style={{ gridTemplateColumns: "44px repeat(7, 1fr)" }}>
            {/* Time labels */}
            <div>
              {Array.from({ length: SLOTS_PER_DAY }).map((_, s) => {
                const mins = HOURS_START * 60 + s * SLOT_MINUTES;
                const isHour = mins % 60 === 0;
                return (
                  <div
                    key={s}
                    style={{ height: 28 }}
                    className="flex items-start justify-end pr-2 relative">
                    {isHour && (
                      <span className="text-[10px] text-gray-400 -translate-y-2 select-none">
                        {formatHour(mins)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dayVisualBlocks = visualBlocksByDay.get(day.toDateString()) ?? [];

              return (
                <div key={day.toDateString()} className="border-l border-gray-100 relative">
                  {/* ── Click/hover cells (background layer) */}
                  {Array.from({ length: SLOTS_PER_DAY }).map((_, s) => {
                    const mins = HOURS_START * 60 + s * SLOT_MINUTES;
                    const isHourBorder = mins % 60 === 0;
                    const key = slotKey(day, s);
                    const busyNames = busyMap.get(key) ?? [];
                    const isBlocked = blockedSlots.has(key);
                    const isPartialBusy = partialBusySlots.has(key); // fix #3
                    const isSelected = selectedKey === key;

                    return (
                      <div
                        key={s}
                        style={{ height: 28 }}
                        className={`relative select-none transition-colors duration-100
                          ${isHourBorder ? "border-t border-gray-100" : "border-t border-gray-50"}
                          ${isBlocked ? "bg-red-50 cursor-not-allowed" : ""}
                          ${isPartialBusy && !isBlocked ? "bg-red-50/60 cursor-pointer" : ""}
                          ${
                            !isPartialBusy && !isBlocked && !isSelected
                              ? "hover:bg-indigo-50 cursor-pointer"
                              : ""
                          }
                          ${isSelected ? "bg-indigo-500 cursor-pointer z-10 rounded" : ""}
                        `}
                        onClick={() => !isBlocked && handleSlotClick(day, s)}
                        onMouseEnter={(e) => {
                          if (busyNames.length > 0) {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setTooltip({
                              key,
                              names: busyNames,
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                            });
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}>
                        {isSelected && (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-[9px] font-bold text-white tracking-wide">✓</span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ── Fix #2: Merged visual blocks overlaid on top */}
                  {dayVisualBlocks.map((block, i) => {
                    const topPx = block.startSlot * 28;
                    const heightPx = block.spanSlots * 28 - 2; // 2px gap
                    const widthPct = block.totalInStack > 1 ? 100 / block.totalInStack : 100;
                    const leftPct = (100 / block.totalInStack) * block.stackIndex;
                    const firstNameOnly = block.userName.split(" ")[0];

                    return (
                      <div
                        key={`${block.userName}-${block.startSlot}-${i}`}
                        className="absolute pointer-events-none overflow-hidden rounded-sm"
                        style={{
                          top: topPx,
                          height: heightPx,
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          background: block.color.bg,
                          borderLeft: `2px solid ${block.color.border}`,
                          zIndex: 2,
                          paddingLeft: 3,
                          paddingTop: 2,
                        }}>
                        <span
                          className="text-[8px] font-semibold leading-tight block truncate"
                          style={{ color: block.color.text }}>
                          {firstNameOnly}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Legend */}
        <div className="flex items-center gap-4 px-5 py-2 border-t border-gray-100 text-[11px] text-gray-500 shrink-0 bg-gray-50/40">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-100 inline-block" /> Busy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500 inline-block" /> Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-50 border border-indigo-100 inline-block" />{" "}
            Available
          </span>
          <span className="flex items-center gap-1.5 ml-auto">
            <Clock size={11} />
            {durationMinutes} min interview
          </span>
        </div>

        {/* ── Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 shrink-0">
          <div className="text-sm text-gray-600 min-h-[20px]">
            {selectedLabel ? (
              <span>
                <span className="font-medium text-indigo-700">{selectedLabel}</span>
                <span className="text-gray-400 ml-1 text-xs">({durationMinutes} min)</span>
              </span>
            ) : (
              <span className="text-gray-400 text-xs">Click a slot to select</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedKey}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
                selectedKey
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}>
              Confirm Time
            </button>
          </div>
        </div>

        {/* ── Tooltip */}
        {tooltip && (
          <div
            ref={tooltipRef}
            className="fixed z-[10000] pointer-events-none"
            style={{ left: tooltip.x, top: tooltip.y - 8, transform: "translate(-50%, -100%)" }}>
            <div className="bg-gray-900 text-white text-[11px] rounded-lg px-2.5 py-2 shadow-xl max-w-[180px]">
              <p className="font-semibold mb-1 text-gray-300">Busy:</p>
              {tooltip.names.map((n) => (
                <div key={n} className="flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                    style={{ background: colorByName(n).text }}
                  />
                  {n}
                </div>
              ))}
              <div
                className="absolute left-1/2 bottom-0 translate-x-[-50%] translate-y-full"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "5px solid transparent",
                  borderRight: "5px solid transparent",
                  borderTop: "5px solid #111827",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default AvailabilitySchedulerModal;
