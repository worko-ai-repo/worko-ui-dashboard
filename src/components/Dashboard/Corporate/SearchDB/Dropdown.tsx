import { FileText } from "lucide-react";
import React from "react";

// interface JobOption {
//   label: string;
//   value: string;
// }

interface DropdownProps {
  mode: "jobs" | "prompt";
  setMode: (mode: "jobs" | "prompt") => void;
  onSubmit: () => void;
  // jobsList: JobOption[];
  setInput: (value: string) => void;
}

const Dropdown: React.FC<DropdownProps> = ({
  mode,
  setMode,
  onSubmit,
  setInput,
}) => {
  const [selectedJob, setSelectedJob] = React.useState("");
  const [jobDropdownOpen, setJobDropdownOpen] = React.useState(false);

  const toggleMode = () => {
    if (mode === "jobs") {
      setMode("prompt");
      setSelectedJob("");
      setInput("");
    } else {
      setMode("jobs");
      setInput(""); // Clear input if switching back
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* jobs-specific job selection */}
      {/* {mode === "jobs" && (
        <div className="relative inline-block text-left">
          <button
            onClick={() => setJobDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-xs bg-gray-50 hover:bg-gray-100 transition"
          >
            <span>
              {selectedJob
                ? jobsList.find((j) => j.value === selectedJob)?.label
                : "Select job"}
            </span>
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
                      setInput(job.value);
                    }}
                    className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                      selectedJob === job.value
                        ? "bg-gray-100 font-semibold"
                        : ""
                    }`}
                  >
                    {job.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )} */}

      {/* Toggle button */}
      <button
        onClick={toggleMode}
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-full text-xs bg-gray-50 hover:bg-gray-100 transition"
      >
        <FileText className="w-4 h-4" />
        <span>
          {mode === "jobs" ? "Search by Prompt" : "Search by Job Post "}
        </span>
      </button>
    </div>
  );
};

export default Dropdown;
