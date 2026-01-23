import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "lib-worko-ui";
import { ChevronDown, Plus, SendIcon, X } from "lucide-react";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { gmail_logo, outlook_logo } from "@AssetsFolder/assets";
import OutlookSteps from "./OutlookSteps";


interface EmailAddedModalProps {
  dashboardType: string;
  onClose: () => void;
  isOpen: boolean;
  forwardingMailId:string;
}

const EmailAddedModal: React.FC<EmailAddedModalProps> = ({ isOpen, onClose, forwardingMailId }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState<boolean>(false);
  const [isSeeSteps, setIsSeeSteps] = useState<boolean>(false);
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      const timer = setTimeout(() => setIsAnimatingIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}
    >
      <div
        className={`bg-white rounded-l-lg w-full max-w-xl relative transform transition-transform duration-300 ease-in-out self-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 overflow-y-auto min-h-[30vh]">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold mb-4 text-left">Forwarding Mail id</h2>
          <h3 className="text-lg mb-4 text-left">{forwardingMailId}</h3>

          <div className="flex items-start gap-1 text-sm">
          <p 
          className="text-blue-500 text-start"
            >
            See steps
          </p>
          </div>

          <div className="flex items-start gap-1 text-sm">
          <button 
          className="text-blue-500 text-start border-2 border-blue-600 rounded-full p-2 hover:bg-gray-100 transition"
          data-tooltip-id="my-tooltip"
          data-tooltip-content="Check steps for outlook"
          data-tooltip-place="top"
          onClick={()=>{
            setIsSeeSteps(true)
            }}>
            <img 
              src={outlook_logo} 
              alt="See the steps for outlook" 
              className="w-6 h-auto object-contain"
            />
          </button>
          <button 
          className="text-blue-500 text-start border-2 border-blue-600 rounded-full p-2 hover:bg-gray-100 transition"
          data-tooltip-id="my-tooltip"
          data-tooltip-content="Check steps for outlook"
          data-tooltip-place="top"
          onClick={()=>{
            setIsSeeSteps(true)
            }}>
            <img 
              src={gmail_logo} 
              alt="See the steps for outlook" 
              className="w-6 h-auto object-contain"
            />
          </button>
          </div>
        </div>
      </div>
      <OutlookSteps
      dashboardType="CORPORATE"
      onClose={()=>setIsSeeSteps(false)}
      isOpen={isSeeSteps}
      />
    </div>
  );
};

export default EmailAddedModal;
