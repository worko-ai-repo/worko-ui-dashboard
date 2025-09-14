import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

interface AchievementFormProps {
  title:string;
  isOpen: boolean;
  onClose: () => void;
  achievTitle: string;
  setAchievTitle: (val: string) => void;
  acquiredFrom: string;
  setAcquiredFrom: (val: string) => void;
  achievDate: string;
  setAchievDate: (val: string) => void;
  onSubmit: () => void;
}

const AchievementForm: React.FC<AchievementFormProps> = ({
  title,
  isOpen,
  onClose,
  achievTitle,
  setAchievTitle,
  acquiredFrom,
  setAcquiredFrom,
  achievDate,
  setAchievDate,
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
        <h1 className='text-2xl font-semibold text-gray-800'>{achievTitle? `Edit ${title}`:`Add ${title}`}</h1>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={achievTitle}
              onChange={(e) => setAchievTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              placeholder="e.g., Best Intern"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Acquired From</label>
            <input
              type="text"
              value={acquiredFrom}
              onChange={(e) => setAcquiredFrom(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              placeholder="e.g., Google"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Achievement Year</label>
            <input
              type="number"
              value={achievDate}
              onChange={(e) => setAchievDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              placeholder="e.g., 2023"
              max={new Date().getFullYear()}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onSubmit}
            disabled={!achievTitle.trim() || !acquiredFrom.trim() || !achievDate.trim()}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:bg-blue-300"
          >
            <Plus size={16} />
            {`Add Achievement`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AchievementForm;
