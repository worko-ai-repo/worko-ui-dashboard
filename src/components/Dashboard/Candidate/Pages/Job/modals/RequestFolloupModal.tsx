import React, { useEffect, useState } from "react";

interface RequestFolloupModalProps {
  message: string;
  onClose: () => void;
  isError?: boolean;
}

const RequestFolloupModal: React.FC<RequestFolloupModalProps> = ({ message, onClose, isError = false }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timeout = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-300">
      <div
        className={`bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-md transform transition-all duration-300
          ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
      >
        <h2 className={`text-lg font-semibold ${isError ? "text-red-600" : "text-green-600"}`}>
          {isError ? "Error" : "Success"}
        </h2>
        <p className="mt-4 text-gray-700">{message}</p>
        <button
          className="mt-6 w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 200);
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
};


export default RequestFolloupModal;
