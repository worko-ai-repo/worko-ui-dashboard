import { FileText } from "lucide-react";
import React from "react";

interface JobOption {
  label: string;
  value: string;
}

interface DropdownProps {
  mode: "jd" | "prompt";
  setMode: (mode: "jd" | "prompt") => void;
  onSubmit:() => void;
  jobsList:JobOption[];
}

const Dropdown: React.FC<DropdownProps> = ({ mode, setMode, onSubmit,jobsList}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState("");
  const [jobDropdownOpen, setJobDropdownOpen] = React.useState(false);

  const handleSelect = (selected: "jd" | "prompt") => {
    setMode(selected);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
    {mode === "jd" && (
    <div className="relative inline-block text-left">
        <button
            onClick={() => {
                setJobDropdownOpen((prev) => !prev);
                setOpen(false);
            }}
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-xs bg-gray-50 hover:bg-gray-100 transition"
        >
        <span>{selectedJob ? jobsList.find(j => j.value === selectedJob)?.label : "Select job"}</span>
        </button>

        {jobDropdownOpen && (
        <div className="absolute left-0 mt-2 w-40 origin-top-right rounded-md bg-white shadow-lg border border-border z-50 max-h-60 overflow-y-auto">
            <ul className="py-1 text-xs text-gray-700">
            {jobsList.map((job) => (
                <li
                key={job.value}
                onClick={() => {
                    setSelectedJob(job.value);
                    setJobDropdownOpen(false);
                    onSubmit()
                }}
                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                    selectedJob === job.value ? "bg-gray-100 font-semibold" : ""
                }`}
                >
                {job.label}
                </li>
            ))}
            </ul>
        </div>
        )}
        </div>
    )}

    <div className="relative inline-block text-left">
      <button
          onClick={() => {
            setOpen((prev) => !prev);
            setJobDropdownOpen(false);
        }}
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-xs bg-gray-50 hover:bg-gray-100 transition"
      >
        <FileText className="w-4 h-4" />
        <span>{mode === "jd" ? "Search by job post" : "Search by Prompt"}</span>
      </button>    
      {open && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg border border-border z-50">
          <ul className="py-1 text-xs text-gray-700">
            <li
              onClick={() => handleSelect("jd")}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              Search by job post
            </li>
            <li
              onClick={() => handleSelect("prompt")}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              Search by Prompt
            </li>
          </ul>
        </div>
      )}
    </div>
    </div>
  );
};

export default Dropdown;
