import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "lib-worko-ui";
import { ChevronDown, Plus, SendIcon, X } from "lucide-react";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { outlook_1, outlook_2, outlook_3, outlook_4, outlook_5, outlook_6, outlook_7, outlook_8, outlook_9 } from "@AssetsFolder/assets";
interface OutlookStepsProps {
  dashboardType: string;
  onClose: () => void;
  isOpen: boolean;
  //   userDetails:any;
  //   setLoader:((value:boolean) => void);
  //   loader:boolean;
}

const OutlookSteps: React.FC<OutlookStepsProps> = ({ isOpen, onClose }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = useState(0);

const carouselData = [
  {
    image: outlook_1,
    text: `Go to "File" -> "Settings (gear icon)" -> "Mail"`,
    height: "h-[60vh]",
  },
  {
    image: outlook_2,
    text: `1. Select "Mail" -> Select "Forwarding" -> "Enable forwarding" (enable on slider)

    2. Paste the forwarding mail id in the box and click on save -> Close
    (eg : 01K47MSBKS79ACY0BM6Z8VS@referral.worko.work)`,
    height: "h-[60vh]",
  },
  {
    image: outlook_3,
    text: `Go to "File" -> Click "Settings (gear icon)" -> Click "Mail" -> Click "Rules" -> Click "Add new rule"`,
    height: "h-[60vh]",
  },
    {
    image: outlook_4,
    text: `1. Rule name: Type "Candidate resume"
    
    2. Under "Add a condition" -> Select "Has attachment"`,
    height: "h-[60vh]",
  },
  {
    image: outlook_5,
    text: `Click on "Add another condition" button -> Select "Subject or body includes"`,
    height: "h-[60vh]",
  },
  {
    image: outlook_6,
    text: `After selecting a input will appear on the right side of the selection paste "cv OR resume OR candidate resume OR resume attachment"`,
    height: "h-[60vh]",
  },
    {
    image: outlook_7,
    text: `Click on "Add another condition" button -> Select "Message body includes" -> after selecting a input will appear on the right side of the selection paste "cv OR resume OR candidate resume OR resume attachment"`,
    height: "h-[60vh]",
  },
  {
    image: outlook_8,
    text: `1. Under "Add an action" -> select "Forward to" and enter the forwarding mail id
    (eg : 01K47MSBKS79ACY0BM6Z8VS@referral.worko.work)`,
    height: "h-[60vh]",
  },
  {
    image: outlook_9,
    text: "Click on save and you should see the same as above image",
    height: "h-[60vh]",
  },
];

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
        className={`bg-white rounded-l-lg w-full max-w-4xl relative transform transition-transform duration-300 ease-in-out self-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 overflow-y-auto min-h-[100vh]">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>

          <h2 className="text-xl font-semibold mb-1 text-left">Steps to configure Outlook</h2>
          <h3 className="text-lg text-left">Step {currentIndex + 1}</h3>
          {/* Carousel Starts */}
          <div className="w-full mt-4">
            <div className="relative w-full overflow-hidden h-[85vh]">

              {/* Slide Image */}
              <div className="flex items-center justify-center">
                <img
                  src={carouselData[currentIndex].image}
                  alt="slide"
                  className={`w-full ${carouselData[currentIndex].height} object-contain rounded-md`}
                />
              </div>

              {/* Slide Text (vertical scroll) */}
              <div className="mt-3 max-h-[20vh] overflow-y-auto pr-2">
                <p className="text-left text-gray-700 whitespace-pre-line">
                  {carouselData[currentIndex].text}
                </p>
              </div>

              {/* Left Button - Disabled on first slide */}
              <button
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                disabled={currentIndex === 0}
                className={`absolute top-1/2 left-2 -translate-y-1/2 px-3 py-1 rounded-full border border-gray-800
                  ${currentIndex === 0 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : "bg-gray-300 hover:bg-gray-400"}`}
              >
                {"<"}
              </button>

              {/* Right Button - Disabled on last slide */}
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                disabled={currentIndex === carouselData.length - 1}
                className={`absolute top-1/2 right-2 -translate-y-1/2 px-3 py-1 rounded-full border border-gray-800
                  ${currentIndex === carouselData.length - 1 
                    ? "bg-gray-100 cursor-not-allowed" 
                    : "bg-gray-300 hover:bg-gray-400"}`}
              >
                {">"}
              </button>
            </div>
          </div>
          {/* Carousel Ends */}
        </div>
      </div>
    </div>
  );
};

export default OutlookSteps;
