import { FC, useEffect, useState } from 'react';

interface ViewFullDetailProps {
  onClose: () => void;
  isOpen: boolean;
  fullDetails:string;
  displayText?:string;
}

const ViewFullDetail: FC<ViewFullDetailProps> = ({
  onClose,
  isOpen,
  fullDetails,
  displayText,
}) => {

  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

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
      className={`fixed inset-0 z-[70] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
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

        <h2 className="text-xl font-semibold mb-4 text-left">{displayText ?? "Requirement Detail"}</h2>
        <p className='text-center bg-gray-300 p-2 rounded-xl text-sm'>{fullDetails}</p>
      </div>
    </div>
  );
};

export default ViewFullDetail;
