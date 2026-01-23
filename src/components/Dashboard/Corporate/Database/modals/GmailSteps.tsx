import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "lib-worko-ui";
import { ChevronDown, Plus, SendIcon, X } from "lucide-react";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useForm } from "react-hook-form";
import { gmail_1, gmail_10, gmail_11, gmail_12, gmail_13, gmail_2, gmail_3, gmail_4, gmail_5, gmail_6, gmail_7, gmail_8, gmail_9 } from "@AssetsFolder/assets";
interface GmailStepsProps {
  dashboardType: string;
  onClose: () => void;
  isOpen: boolean;
  //   userDetails:any;
  //   setLoader:((value:boolean) => void);
  //   loader:boolean;
}

const GmailSteps: React.FC<GmailStepsProps> = ({ isOpen, onClose }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState<boolean>(false);

  const [currentIndex, setCurrentIndex] = useState(0);

const carouselData = [
  {
    image: gmail_1,
    text: `After login to your gmail account -> Click on "Settings (gear icon)" -> Click "See all settings"`,
    height: "h-[60vh]",
  },
  {
    image: gmail_2,
    text: `Click "Forwarding and POP/IMAP" -> Click "Add a forwarding address"`,
    height: "h-[60vh]",
  },
  {
    image: gmail_3,
    text: `A dialogue box will open with input -> Paste the forwarding mail id in the box -> Click "Next"
    (eg : 01K47MSBKS79ACY0BM6Z8VS@referral.worko.work)`,
    height: "h-[60vh]",
  },
  {
    image: gmail_4,
    text: `(If your current device is your primary Gmail device, then the above interface will be shown) 
    Click "Proceed"`,
    height: "h-[60vh]",
  },
  {
    image: gmail_5,
    text: `(If your primary Gmail device is a different device, then the above interface will be shown)
    Please enter the code received on your primary device -> Click "Next", and complete the verification steps.`,
    height: "h-[60vh]",
  },
  {
    image: gmail_6,
    text: `You will see a confirmation to add a forwarding address -> Click "OK"`,
    height: "h-[60vh]",
  },
  {
    image: gmail_7,
    text: `Click Inbox on the left side. You should receive a verification email containing a verification link. Click the link.`,
    height: "h-[60vh]",
  },
  {
    image: gmail_8,
    text: `It will open a new tab for confirmation -> Click "Confirm."`,
    height: "h-[60vh]",
  },
  {
    image: gmail_9,
    text: `You should see a confirmation of success. You can close the tab.`,
    height: "h-[60vh]",
  },
  {
    image: gmail_10,
    text: `Click "Settings" -> Click "See all settings" -> Click "Forwarding and POP/IMAP"
    If you dont see the same screen as shown in the image above, close the current Gmail tab and open it again.`,
    height: "h-[60vh]",
  },
  {
    image: gmail_10,
    text: `Select the radio button next to "Forward a copy of incoming mail to"`,
    height: "h-[60vh]",
  },
  {
    image: gmail_11,
    text: `Scroll to bottom and Click on "Save Changes"`,
    height: "h-[60vh]",
  },
  {
    image: gmail_12,
    text: `1. Click "Settings" -> Click "See all settings" -> Click on "Filters and Blocked Addresses" -> Click on Create a new filter
    
    2. Type "CV OR resume OR application OR candidate OR attached resume" in the "Has the words" field and leave the remaining fields empty.
    
    3. Select "Has attachment" and "Don’t include chats" -> Click "Create Filter"`,
    height: "h-[60vh]",
  },
  {
    image: gmail_13,
    text: `On the next page, select "Forward it to", click the dropdown next to it, and choose the forwarding address -> Click on "Create Filter and that's it you are done`,
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

          <h2 className="text-xl font-semibold mb-1 text-left">Steps to configure Gmail</h2>
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

export default GmailSteps;
