import { ChevronDoubleDownIcon } from "@heroicons/react/24/outline";
import { ChevronDown } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

interface JobOption {
  label: string;
  value: string;
}

interface JobDropdownProps {
  jobsList: JobOption[];
  input: string;
  setInput: (value: string) => void;
  handleSubmit: () => void;
}

const JobDropdown: React.FC<JobDropdownProps> = ({ jobsList, input, setInput }) => {
  const [filtered, setFiltered] = useState<JobOption[]>(jobsList);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (input === "") {
      setFiltered(jobsList);
    }
  }, [input, jobsList]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    const match = jobsList.filter((job) =>
      job.label.toLowerCase().includes(value.toLowerCase())
    );
    setFiltered(match);
    setIsOpen(true);
  };

  const handleSelect = (job: JobOption) => {
    setInput(job.label); 
    setIsOpen(false);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  };

  document.addEventListener("click", handleClickOutside);
  return () => {
    document.removeEventListener("click", handleClickOutside);
  };
}, []);


  return (
    <div className="relative w-full">
<div className="relative w-full" ref={dropdownRef}>
        <input
          type="text"
          value={input}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Type or select job..."
          className="w-full pr-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gray-700 bg-blue-600 rounded text-white h-auto w-auto p-1"
        >
          <ChevronDown className="h-5 w-auto" />
        </button>
      </div>
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto text-sm">
          {filtered.map((job) => (
            <li
              key={job.value}
              onClick={() => handleSelect(job)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-start"
            >
              {job.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobDropdown;
