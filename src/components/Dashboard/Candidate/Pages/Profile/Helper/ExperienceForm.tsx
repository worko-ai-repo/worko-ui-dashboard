import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

interface ExperienceFormProps {
  title:string;
  isOpen: boolean;
  onClose: () => void;
  designation:string;
  setDesignation:(val: string) => void;
  companyName: string;
  setCompanyName: (val: string) => void;
  department: string;
  setDepartment: (val: string) => void;
  yoe: string;
  setYOE: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  onSubmit: () => void;
}

const ExperienceForm: React.FC<ExperienceFormProps> = ({
  title,
  isOpen,
  onClose,
  designation,
  setDesignation,
  companyName,
  setCompanyName,
  department,
  setDepartment,
  yoe,
  setYOE,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
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
        className={`bg-white rounded-l-lg p-6 w-full max-w-lg relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
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

    {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6"> */}
        <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1">Designation</label>
            <input
            type="text"
            placeholder="Designation"
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
            />
        {/* </div> */}

        <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1">Company Name</label>
            <input
            type="text"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
            />
        </div>

        <div className="flex flex-col">
            <label className="block text-xs font-semibold mb-1">Department</label>
            <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
            />
        </div>

        {/* YOE, Start Date, End Date, Add button */}
        <div className="flex items-end gap-3">
            <div className="flex flex-col flex-grow">
            <label className="block text-xs font-semibold mb-1">YOE</label>
            <input
                type="number"
                min={0}
                placeholder="Years of Experience"
                value={yoe}
                onChange={(e) => setYOE(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
            />
            </div>

            <div className="flex flex-col flex-grow">
            <label className="block text-xs font-semibold mb-1">Start Date</label>
            <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
            />
            </div>

            <div className="flex flex-col flex-grow">
            <label className="block text-xs font-semibold mb-1">End Date</label>
            <input
                type="date"
                max={new Date().toISOString().split('T')[0]}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
            />
            </div>
        </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onSubmit}
            disabled={!companyName.trim() || !designation.trim() || !department.trim() || !yoe.trim() || !startDate.trim()|| !endDate.trim()}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-blue-300"
          >
            <Plus size={16} />
            {`Add Experience`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExperienceForm;
