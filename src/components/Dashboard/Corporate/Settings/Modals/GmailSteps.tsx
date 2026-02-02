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
    text: `Click "Inbox" on the left side. You should receive a verification email containing a verification link. Click the link.`,
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
    (Note: it can be either "Has the words" or "Includes the word".)
    
    3. Select both the "Has attachment" and "Don’t include chats" checkboxes -> Click "Create Filter"`,
    height: "h-[60vh]",
  },
  {
    image: gmail_13,
    text: `On the next page, select "Forward it to", click the dropdown next to it, and choose the forwarding address -> Click on "Create Filter and that's it you are done
    (Note: If it asks you to continue, click Continue and complete the verification)`,
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
  <>
    {isOpen && (
      <div className="w-full mt-6">
        <div
          className={`
            transition-all duration-300 
            ${isAnimatingIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
          `}
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">

            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-left">Steps to configure Gmail</h2>
                <h3 className="text-md text-gray-600 text-left">Step {currentIndex + 1}</h3>
              </div>

              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* CAROUSEL */}
            <div className="w-full flex flex-col items-center">

              {/* Image Container */}
              <div className="relative w-full max-w-3xl bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-inner">

                <img
                  src={carouselData[currentIndex].image}
                  alt="gmail-step"
                  className="w-full max-h-[60vh] object-contain rounded-lg"
                />

              </div>

              {/* Step Text */}
              <div className="mt-4 max-w-3xl text-gray-700 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-inner whitespace-pre-line">
                {carouselData[currentIndex].text}
              </div>

              {/* Buttons */}
              <div className="mt-6 flex gap-4">

                {/* Previous */}
                <button
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  disabled={currentIndex === 0}
                  className={`
                    px-5 py-2 rounded-lg border shadow-sm transition text-sm
                    ${currentIndex === 0
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-white border-gray-300 hover:bg-gray-100"}
                  `}
                >
                  Previous
                </button>

                {/* Next */}
                <button
                  onClick={() => setCurrentIndex((prev) => prev + 1)}
                  disabled={currentIndex === carouselData.length - 1}
                  className={`
                    px-5 py-2 rounded-lg border shadow-sm transition text-sm
                    ${currentIndex === carouselData.length - 1
                      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 border-blue-600"}
                  `}
                >
                  Next
                </button>

              </div>

            </div>

          </div>
        </div>
      </div>
    )}
  </>
);

};

export default GmailSteps;
