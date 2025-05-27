import React, { useEffect, useRef, useState } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  showCloseButton?: boolean;
  className?: string;
}

const Modal = ({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  className = "",
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(isOpen);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  // Open/close handler
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsAnimatingOut(false);
    } else if (visible) {
      setIsAnimatingOut(true);
      // Wait for animation to finish before fully hiding
      const timer = setTimeout(() => {
        setVisible(false);
        setIsAnimatingOut(false);
      }, 300); // match slide-out duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div
      ref={modalRef}
      className={`fixed top-0 right-0 z-[9999] bg-white rounded-xl shadow-lg ${
        isAnimatingOut ? "animate-slide-out" : "animate-slide-in"
      } ${className}`}
      style={{ overflowY: "auto" }}
    >
      {showCloseButton && (
        <div className="sticky top-0 right-0 w-full bg-white z-10 pt-2 pr-2 flex justify-end">
          <button
            className="text-xl text-gray-500 hover:text-gray-800"
            onClick={onClose}
            aria-label="Close modal"
            title="Close modal"
          >
            ×
          </button>
        </div>
      )}
      <div className="p-6 pt-0 h-full">
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
      {children}
      </div>
    </div>
  );
};

export default Modal;
