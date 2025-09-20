import { FC, useEffect, useState } from "react";

interface VideoInterviewModalProps {
  onClose: () => void;
  isOpen: boolean;
}

const VideoInterviewModal: FC<VideoInterviewModalProps> = ({
  onClose,
  isOpen,
}) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
  let animateInTimer: number;
  let animateOutTimer: number;
  let autoCloseTimer: number;

  if (isOpen) {
    setVisible(true);
    animateInTimer = window.setTimeout(() => {
      setIsAnimatingIn(true);
    }, 10);

    autoCloseTimer = window.setTimeout(() => {
      setIsAnimatingIn(false);
      animateOutTimer = window.setTimeout(() => {
        setVisible(false);
        onClose(); 
      }, 300);
    }, 3000);
  } else {
    setIsAnimatingIn(false);

    animateOutTimer = window.setTimeout(() => {
      setVisible(false);
    }, 300);
  }

  return () => {
    clearTimeout(animateInTimer);
    clearTimeout(animateOutTimer);
    clearTimeout(autoCloseTimer);
  };
}, [isOpen, onClose]);


  // useEffect(() => {
  //   setTimeout(() => {
  //     setIsAnimatingIn(false);
  //     const timer = setTimeout(() => setVisible(false), 300);
  //     return () => clearTimeout(timer);
  //   }, 3000);

  //   if (isOpen) {
  //     setVisible(true);
  //     const timer = setTimeout(() => setIsAnimatingIn(true), 10);
  //     return () => clearTimeout(timer);
  //   } else {
  //     setIsAnimatingIn(false);
  //     const timer = setTimeout(() => setVisible(false), 300);
  //     return () => clearTimeout(timer);
  //   }
  // }, [isOpen]);


  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}>
      <div
        className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          ×
        </button>

        <p className="text-lg font-semibold mb-2">Video Interviews Coming Soon!</p>
          <p className="text-sm text-gray-600">
          We're working hard to bring you a seamless video interview experience. Stay tuned — it's on the way!
        </p>

      </div>
    </div>
  );
};

export default VideoInterviewModal;
