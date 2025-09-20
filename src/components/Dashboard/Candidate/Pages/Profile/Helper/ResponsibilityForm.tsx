import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

interface ResponsibilityFormProps {
    title:string;
    isOpen: boolean;
    onClose: () => void;
    companyName:string;
    setCompanyName:(val:string) => void;
    startDate:string
    setStartDate:(val:string) => void;
    endDate:string
    setEndDate:(val:string) => void;
    description:string
    setDescription:(val:string) => void;
    checked:boolean;
    setChecked:(val:boolean)=>void;
    onSubmit: () => void;
}
const ResponsibilityForm: React.FC<ResponsibilityFormProps> = ({
  title,
  isOpen,
  onClose,
  companyName,
  setCompanyName,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  description,
  setDescription,
  checked,
  setChecked,
  onSubmit
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
      className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}
    >
      <div
        className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <h1 className='text-2xl font-semibold text-gray-800'>{companyName? `Edit ${title}`:`Add ${title}`}</h1>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              placeholder="Company Name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm h-24"
                placeholder="Description"
            />
          </div>

        <div className='flex gap-3 justify-center'>
          <div className='flex-1'>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
            <input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
            />
          </div>
          <div className={`flex-1 flex-col flex-grow ${checked ? 'opacity-0' : ''}`}>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
                disabled={checked}
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        </div>

          <div
            onClick={() => setChecked(!checked)}
            className={`mt-2 flex items-center cursor-pointer select-none w-max`}
          >
          <div
            className={`flex items-center justify-center w-5 h-5 mr-2 rounded-sm border ${
              checked ? "border-blue-600 bg-blue-600" : "border-gray-400 bg-white"
            }`}
          >
            {checked && (
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
          </div>
          <span className="text-gray-700">
            I am currently handling this responsibility
          </span>
        </div>
        
        <div className="mt-6 flex justify-start">
          <button
            onClick={onSubmit}
            disabled={!companyName.trim() || !description.trim() || !startDate.trim() || (!checked && !endDate?.trim())}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-blue-300"
          >
            <Plus size={16} />
            {`Add Responsibility`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponsibilityForm;
