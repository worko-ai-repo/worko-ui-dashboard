import httpServiceObj from '@Services/ApiHandler.service';
import React, { useEffect } from 'react';
import profileService from '../Candidate/Service/ProfileService';
import { useNavigate } from "react-router-dom";


type SignupMode = "EMP" | "CAND";

interface ToggleOption {
  label: string;
  value: SignupMode;
}

interface ToggleProps {
  options: ToggleOption[];
  activeFrame: string;
  setActiveFrame: (frame: any) => void;
}

const CustomButtonWithButton: React.FC<ToggleProps> = ({ options, activeFrame, setActiveFrame }) => {

    const navigate = useNavigate();
    const APP_PROXY_DASH = import.meta.env.APP_PROXY_DASH
    const selectedFrame = React.useRef<HTMLInputElement>(null);
    const currentUser = profileService.getCurrentUser();

const handleActiveFrame = async (frame: SignupMode) => {
    setActiveFrame(frame);

    if (!currentUser) {
        throw new Error("User not found");
    }
    // console.log(frame)
    const payload = { lastAccessedDash: frame };
  
  const currentPath = window.location.pathname;
  const pathParts = currentPath.split('/');
  const currentPage = pathParts[3];

  const validCandidatePages = ['jobs', 'profile','referral','guidance','refer-and-earn','subscription','support'];  
  const validEmployeePages = [ 'profile','referral','guidance','refer-and-earn','support'];

  let newPath = '';

  if (frame === 'EMP') {
    const fallback = 'profile';
    newPath = `/employee/${validEmployeePages.includes(currentPage) ? currentPage : fallback}`;
  } else {
    const fallback = 'jobs';
    newPath = `/candidate/${validCandidatePages.includes(currentPage) ? currentPage : fallback}`;
  }

  try {
    const { response, error } = await httpServiceObj.put(
      `/user/${currentUser.email}/updateLastAccessedDash`,
      payload,
      true
    );
    // console.log(response)
    if (error) {
      console.error("API error while updating dashboard preference:", error);
    }
    navigate(newPath);

  } catch (err) {
    console.error("Failed to update mode on backend:", err);
  }
};

  return (
    <div className="group relative flex w-full rounded-xl border-4 border-white bg-[#F6F6F6] shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,_rgba(0,0,0,0.3)_0px_3px_7px_-3px] p-1">
      {/* Sliding background */}
      <div
        className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-blue-500 transition-all duration-300 ease-in-out ${
          activeFrame === options[1].value ? 'translate-x-[100%]' : 'translate-x-0'
        }`}
      />

      {options.map((option, index) => (
        <div key={index} className="relative flex-1">
          <input
            ref={selectedFrame}
            type="radio"
            id={option.value}
            name="toggle"
            value={option.value}
            checked={activeFrame === option.value}
            onChange={() => handleActiveFrame(option.value as SignupMode)}
            className="peer absolute opacity-0 w-full h-auto cursor-pointer font-bold"
          />
          <label
            htmlFor={option.value}
            className="relative block w-full text-left p-1 sm:p-1 text-sm font-medium cursor-pointer transition-colors duration-200"
          >
            <span
              className={
                activeFrame === option.value
                  ? 'text-[10px] sm:text-xs text-white font-bold'
                  : 'text-[10px] sm:text-xs font-bold text-[#7C8FBF] hover:text-gray-400'
              }
            >
              {option.label}
            </span>
          </label>
        </div>
      ))}
    </div>
  );
};

export default CustomButtonWithButton;
