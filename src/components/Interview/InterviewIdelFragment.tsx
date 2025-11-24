import { dotSpiral, InterviewBlobOne, InterviewBlobTwo } from "@AssetsFolder/assets";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";

const InterviewIdelFragment = () => {
  const advantages = [
    "Interview Once. Apply Anywhere.",
    "Get Better Matches and Faster Decisions.",
  ];

  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [visibleReviews, setVisibleReviews] = useState<
    Array<{
      id: number;
      position: number;
      name: string;
      role: string;
      review: string;
      avatar: string;
    }>
  >([]);
  useEffect(() => {
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseTime = 2000;

    const timeout = setTimeout(() => {
      const currentAdvantage = advantages[currentIndex];

      if (!isDeleting && charIndex < currentAdvantage.length) {
        setCurrentText(currentAdvantage.substring(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (isDeleting && charIndex > 0) {
        setCurrentText(currentAdvantage.substring(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (!isDeleting && charIndex === currentAdvantage.length) {
        setTimeout(() => setIsDeleting(true), pauseTime);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setCurrentIndex((currentIndex + 1) % advantages.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentIndex]);

  const reviews = [
    {
      name: "Arjun Patel",
      role: "Software Engineer at TCS",
      review: "AI feedback helped me crack technical rounds easily!",
      avatar: "AP",
    },
    {
      name: "Priya Sharma",
      role: "Product Manager at Flipkart",
      review: "Got placed in 2 weeks after practicing here.",
      avatar: "PS",
    },
    {
      name: "Rahul Kumar",
      role: "Data Analyst at Infosys",
      review: "Real-time suggestions boosted my confidence.",
      avatar: "RK",
    },
    {
      name: "Sneha Singh",
      role: "UI/UX Designer at Zomato",
      review: "Interview skills improved dramatically!",
      avatar: "SS",
    },
    {
      name: "Vikash Gupta",
      role: "Marketing Executive at Paytm",
      review: "Best platform for interview preparation.",
      avatar: "VG",
    },
  ];
  // Floating reviews animation
  useEffect(() => {
    const addReview = () => {
      const randomReview = reviews[Math.floor(Math.random() * reviews.length)];
      const randomPosition = Math.random() * 50; // 0-10% from left
      const id = Date.now() + Math.random();

      setVisibleReviews((prev) => [...prev, { ...randomReview, id, position: randomPosition }]);

      setTimeout(() => {
        setVisibleReviews((prev) => prev.filter((r) => r.id !== id));
      }, 5000);
    };

    const interval = setInterval(addReview, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="relative min-h-full  flex flex-col items-start justify-start px-4 py-2">
      {/* Text Content */}
      <div className="relative z-10 text-center w-full ">
        <h1 className="text-5xl font-semibold text-[#001f3f] text-left ml-10 mb-8">
          Your All-In-One AI Job Platform.{" "}
        </h1>

        <div className="min-h-[80px] w-full flex items-center justify-start">
          <img
            src={dotSpiral}
            alt="Background Pattern"
            className=" inset-0 w-80 h-w-80 object-cover rounded-3xl opacity-60 rotate-"
          />
          <div className="">
            <p className="text-3xl  text-left font-semibold text-[#001f3f]">
              {currentText}
              <span className="animate-pulse">|</span>
            </p>
            <div className="text-xs text-left text-[#001f3f] font-semibold mt-3">
            VERA (Virtual Evaluation & Recruitment Assistant) will guide you through a smooth, stress-free interview experience. 
            Just enable permissions and you're good to go.
            </div>
          </div>
        </div>
      </div>
      {/* Floating Reviews */}
      {/* <div className=" px-10 absolute bottom-0 text-left text-nowrap left-0 w-full right-0 h-32 pointer-events-none z-20">
        <AnimatePresence>
          {visibleReviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ y: 0, opacity: 0, scale: 0.8 }}
              animate={{ y: -150, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 5, ease: "easeOut" }}
              style={{ left: `${review.position}%` }}
              className="absolute bottom-0 bg-white rounded-xl shadow-2xl p-4 max-w-xs border border-gray-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {review.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#001f3f] text-sm">{review.name}</div>
                  <div className="text-xs text-gray-500 mb-1">{review.role}</div>
                  <p className="text-xs text-gray-700 line-clamp-2">{review.review}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div> */}
    </div>
  );
};

export default InterviewIdelFragment;
