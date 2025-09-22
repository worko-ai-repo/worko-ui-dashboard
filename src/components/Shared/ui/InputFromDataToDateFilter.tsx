import { Filter } from "lucide-react";
import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from "react";

interface Props {
  onDateChange?: Dispatch<
    SetStateAction<{
      fromDate: string;
      toDate: string;
    }>
  >;
}

const InputFromDataToDateFilter: React.FC<Props> = ({ onDateChange }) => {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectingFrom, setSelectingFrom] = useState(true);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (date: string) => {
    if (selectingFrom || !fromDate) {
      setFromDate(date);
      setSelectingFrom(false);
      if (toDate && date > toDate) {
        setToDate("");
        onDateChange?.({ fromDate: date, toDate: "" });
      } else {
        onDateChange?.({ fromDate: date, toDate });
      }
    } else {
      if (date >= fromDate) {
        setToDate(date);
        onDateChange?.({ fromDate, toDate: date });
        setIsCalendarOpen(false);
        setSelectingFrom(true);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString();
  };

  const clearDates = () => {
    setFromDate("");
    setToDate("");
    setSelectingFrom(true);
    onDateChange?.({ fromDate: "", toDate: "" });
  };

  return (
    <div className="relative z-[20] w-[180px] " ref={calendarRef}>
      <div
        className=" flex items-center gap-2 border rounded-lg  px-3 py-1 cursor-pointer bg-white"
        onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
        <span className="text-sm px-3 py-1 text-blue-500 ">
          {fromDate && toDate ? (
            `${formatDate(fromDate)} - ${formatDate(toDate)}`
          ) : fromDate ? (
            `From: ${formatDate(fromDate)}`
          ) : (
            <>
              <Filter className="inline-block w-4 h-4" /> Filter by date
            </>
          )}
        </span>
        {(fromDate || toDate) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearDates();
            }}
            className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        )}
      </div>

      {isCalendarOpen && (
        <div className="absolute  w-full top-full left-0 mt-1 bg-white border rounded-md shadow-lg z-10">
          <div className="p-2 border-b text-sm text-gray-600">
            {selectingFrom ? "Select start date" : "Select end date"}
          </div>
          <input
            type="date"
            onChange={(e) => handleDateSelect(e.target.value)}
            className="w-full text-xs p-2 border-0 outline-none"
            min={!selectingFrom ? fromDate : undefined}
          />
        </div>
      )}
    </div>
  );
};

export default InputFromDataToDateFilter;
