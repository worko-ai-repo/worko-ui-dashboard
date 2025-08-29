import React from "react";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { CalendarCheckIcon, Check } from "lucide-react";
import {
  handleJobApplicationStatusUpdate,
  JobApplicationUpdatePayloadDto,
} from "@Components/Dashboard/Corporate/Applicants/Applicants";
import secureStorage from "@Utils/SecureStorage.utils";

import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { clap } from "@AssetsFolder/assets";

interface JoinedModalProps {
  jobApplication: JobApplicationDetailsDto;
}

export const JoinedModal: React.FC<JoinedModalProps> = ({ jobApplication }) => {
  const [succesModalOpen, setSuccesModalOpen] = React.useState(false);
  const [joiningDate, setJoiningDate] = React.useState<string>("");

  const handleSubmit = async () => {
    const payload: JobApplicationUpdatePayloadDto = {
      status: "JOINED",
      joiningDate: joiningDate,
      applicantName: jobApplication.applicantDetails.name,
      emailId: jobApplication.applicantDetails.email,
      userId: jobApplication.applicantDetails.id,
      userType: window.location.href.includes("corporate")
        ? secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE) ??
          UserRole.CORPORATE_ADMIN
        : "ADMIN",
    };
    const res = await handleJobApplicationStatusUpdate(payload, jobApplication.id);
    if (res) {
      setSuccesModalOpen(true);
    }
  };

  if (succesModalOpen) {
    return (
      <div className="text-left mx-5 my-10 ">
        <img src={clap} className="w-32 h-32 bg-green-500 text-white rounded-full mx-auto mb-4" />
        <p className="text-xs mb-4 text-center">Congratulations on hiring a great talent</p>
      </div>
    );
  }

  return (
    <div className="w-[455px] relative bg-white rounded-xl overflow-hidden p-6">
      {/* Title */}
      <h4 className="text-black text-sm text-left font-semibold leading-tight mb-6">
        When the candidate joined
      </h4>

      {/* Label */}
      <label className="flex items-center space-x-1 text-sm font-normal text-black/95 mb-2">
        <span className="text-red-600/95">*</span>
        <span>Joining date</span>
      </label>

      {/* Input field */}
      <div className="relative">
        <div
          className="absolute right-8 top-6 -translate-y-1/2 w-6 h-7 z-50 rounded flex items-center justify-center bg-blue-500 cursor-pointer"
          onClick={() => {
            const input = document.getElementById("joiningDate") as HTMLInputElement;
            input?.showPicker?.(); // only works in Chromium
          }}>
          <CalendarCheckIcon className="w-4 h-4 text-white" />
        </div>
        <input
          id="joiningDate"
          type="date"
          min="1900-01-01"
          max="2100-12-31"
          value={joiningDate}
          onChange={(e) => setJoiningDate(e.target.value)}
          className="w-full h-11 bg-gray-100 rounded-xl px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!joiningDate}
        className={`mt-8 w-32 h-11 rounded-[10px] flex items-center justify-center gap-2 text-white text-base font-semibold tracking-tight transition ${
          joiningDate ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
        }`}>
        <Check className="w-4 h-4" />
        Submit
      </button>
    </div>
  );
};
