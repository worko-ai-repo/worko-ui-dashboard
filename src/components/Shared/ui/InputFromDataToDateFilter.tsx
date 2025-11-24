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

  const handleFromDateChange = (date: string) => {
    setFromDate(date);
    if (toDate && date > toDate) {
      setToDate("");
      onDateChange?.({ fromDate: date, toDate: "" });
    } else {
      onDateChange?.({ fromDate: date, toDate });
    }
  };

  const handleToDateChange = (date: string) => {
    if (date >= fromDate) {
      setToDate(date);
      onDateChange?.({ fromDate, toDate: date });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString();
  };

  const clearDates = () => {
    setFromDate("");
    setToDate("");
    onDateChange?.({ fromDate: "", toDate: "" });
  };

  return (
    <div className="relative z-[99] ">
      <div className="flex items-center gap-2 border rounded-lg px-3 py-1 bg-white">
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">From:</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            className="text-sm p-1 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-gray-600">To:</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
            className="text-sm p-1 border rounded"
            min={fromDate}
          />
        </div>
        {(fromDate || toDate) && (
          <button
          data-tooltip-id="my-tooltip"
          data-tooltip-content={"Clear date filter"}
            onClick={clearDates}
            className="text-white w-2 h-2 flex items-center justify-center text-[7px] font-bold bg-blue-500 p-2 rounded-full hover:text-gray-600 mt-6 ml-2">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default InputFromDataToDateFilter;
