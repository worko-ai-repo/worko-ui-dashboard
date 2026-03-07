import React, { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

interface ExperienceFormProps {
  title:string;
  isOpen: boolean;
  onClose: () => void;
  collage:string;
  setCollage:(val: string) => void;
  degree: string;
  setDegree: (val: string) => void;
  passingYear: number | null;
  setPassingYear: (val: number | null) => void;
  onSubmit: () => void;
}

const EducationForm: React.FC<ExperienceFormProps> = ({
  title,
  isOpen,
  onClose,
  collage,
  setCollage,
  degree,
  setDegree,
  passingYear,
  setPassingYear,
  onSubmit
}) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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
      onMouseDown={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          // reset();
          onClose();
        }
      }}
      className={`fixed inset-0 z-[80] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-l-lg p-6 w-full max-w-lg relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <h1 className='text-2xl font-semibold text-gray-800'>{collage? `Edit ${title}`:`Add ${title}`}</h1>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>

    {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"> */}
        <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1">College Name</label>
            <input
            type="text"
            placeholder="College Name"
            value={collage}
            onChange={(e) => setCollage(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
            />
        {/* </div> */}

        <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1">Degree Name</label>
            <input
            type="text"
            placeholder="Degree Name"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
            />
        </div>

        <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1">Passing Year</label>
            <input
            type="number"
            min="1900"
            max="2100"
            placeholder="Passing Year"
            value={passingYear ?? ""}
            onChange={(e) => {
                const value = e.target.value;
                setPassingYear(value === "" ? null : parseInt(value, 10));
            }}
            className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
            />
        </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onSubmit}
            disabled={!collage?.trim() || !degree?.trim() || passingYear === null}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-blue-300"
          >
            <Plus size={16} />
            {`Add Education`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EducationForm;
