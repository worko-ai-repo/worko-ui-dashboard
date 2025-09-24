import React, { useState, useEffect } from 'react';

const  CVParsingPopup: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(30);
  
  const messages = [
    "Analyzing your experience and skills...",
    "Extracting key information from your CV...",
    "Processing educational background...",
    "Identifying professional achievements...",
    "Finalizing your profile analysis..."
  ];

  // Cycle through messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [messages.length]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-[9999]">
      {/* Main popup container */}
      <div className="relative bg-white/95 backdrop-blur-sm p-8 rounded-2xl w-96 shadow-2xl border border-white/20">
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl -z-10" />
        
        <div className="flex flex-col items-center gap-8">
          {/* Enhanced loader spinner */}
          <div className="relative">
            {/* Outer ring */}
            <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-pulse" />
            
            {/* Spinning ring */}
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" />
            
            {/* Inner pulsing dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            </div>
            
            {/* Orbital dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2rounded-full animate-bounce"
                  style={{
                    transform: `rotate(${i * 120}deg) translateY(-14px)`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Dynamic message */}
          <div className="text-center min-h-[3rem] px-4 flex items-center justify-center">
            <p className="text-gray-700 font-medium text-lg leading-relaxed">
              {messages[messageIndex]}
            </p>
          </div>

          {/* Countdown timer */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent select-none animate-pulse">
                {secondsLeft}
              </div>
              <div className="text-sm text-gray-500 font-medium mt-1 tracking-wide">
                SECONDS
              </div>
            </div>
          </div>

          {/* Status message */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              {/* Processing dots */}
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-600 font-semibold text-base">
              Parsing your CV... Please wait.
            </p>
          </div>
        </div>

        {/* Subtle glow effect */}
        {/* <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl blur-xl -z-20 animate-pulse" /> */}
      </div>
    </div>
  );
};

export default  CVParsingPopup;

// import { useEffect, useState } from "react";
// import styles from "./referralloader.module.scss";

// const messages = [
//   "Reviewing your resume content...",
//   "Extracting work experience...",
//   "Identifying key skills...",
//   "Gathering social media links...",
//   "Parsing educational background...",
//   "Finalizing your CV data extraction...",
// ];

// const CVParsingPopup: React.FC = () => {
//   const [secondsLeft, setSecondsLeft] = useState(30);
//   const [messageIndex, setMessageIndex] = useState(0);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       setSecondsLeft((prev) => {
//         if (prev <= 1) {
//           clearInterval(timer);
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);

//     // Change message every 5 seconds (30 / 6 = 5 seconds per message)
//     const messageTimer = setInterval(() => {
//       setMessageIndex((prev) => (prev + 1) % messages.length);
//     }, 5000);

//     return () => {
//       clearInterval(timer);
//       clearInterval(messageTimer);
//     };
//   }, []);

// return (
//   <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-[9999]">
//     <div className="bg-white p-6 rounded-3xl w-96 shadow-lg flex flex-col items-center gap-6">
//       {/* Smaller loader */}
//       <div className={`${styles.loader} !w-24 !h-24`}>
//         <div className={styles.loaderOne}>
//           {[...Array(13)].map((_, index) => (
//             <div key={index} className={styles.box_one_sub}></div>
//           ))}
//         </div>
//         <div className={styles.loaderTwo}>
//           {[...Array(13)].map((_, index) => (
//             <div key={index} className={`${styles.box_one_sub} ${styles.two}`}></div>
//           ))}
//         </div>
//       </div>

//       {/* Message that changes every 5 sec */}
//       <div className="text-center text-gray-700 font-semibold min-h-[2rem] px-4">
//         {messages[messageIndex]}
//       </div>

//       {/* Countdown timer */}
//       <div className="text-5xl font-extrabold text-blue-600 select-none">
//         {secondsLeft}s
//       </div>

//       <div className="text-center text-gray-700 font-semibold">
//         Parsing your CV... Please wait.
//       </div>
//     </div>
//   </div>
// );

// };

// export default CVParsingPopup;
