import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';
import AchievementForm from './AchievementForm';

interface AchievementsEditorProps {
  title:string;
  items: string[];
  onSave: (items: string[]) => Promise<boolean>;
  onCancel: () => void;
}

const AchievementsEditor: React.FC<AchievementsEditorProps> = ({
  title,
  items,
  onSave,
  onCancel
}) => {
  const [editedItems, setEditedItems] = useState<string[]>(items || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [achievTitle, setAchievTitle] = useState('');
  const [acquiredFrom, setAcquiredFrom] = useState('');
  const [achievDate, setAchievDate] = useState('');
  const [formModal, setFormModal] = useState<boolean>(false);

  const handleAddItem = () => {
    const trimmedTitle = achievTitle.trim();
    const trimmedFrom = acquiredFrom.trim();
    const trimmedDate = achievDate.trim();
    const year = parseInt(trimmedDate);
    const currentYear = new Date().getFullYear();

    if (!trimmedTitle || !trimmedFrom || !trimmedDate) {
      toast.error("All fields are required", getToastOptions({}));
      return;
    }

    if (isNaN(year) || year > currentYear || year < 1990) {
      toast.error(`Enter a valid year between 1990 and ${currentYear}`, getToastOptions({}));
      return;
    }

    if (trimmedTitle.length <= 3) {
      toast.error("Achievement title is too short", getToastOptions({}));
      return;
    }

    if (trimmedFrom.length <= 3) {
      toast.error("Acquired From is too short", getToastOptions({}));
      return;
    }

    const formattedItem = `${trimmedTitle} - ${trimmedFrom} (${year})`;

    if (editingIndex !== null) {
      const updatedItems = [...editedItems];
      updatedItems[editingIndex] = formattedItem;
      setEditedItems(updatedItems);
      setEditingIndex(null);
    } else {
      setEditedItems([...editedItems, formattedItem]);
    }

    setAchievTitle('');
    setAcquiredFrom('');
    setAchievDate('');
    setFormModal(false);
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setAchievTitle('');
      setAcquiredFrom('');
      setAchievDate('');
    }
  };

  const handleEditItem = (index: number) => {
    const item = editedItems[index];
    setEditingIndex(index);
    const match = item.match(/^(.*?) - (.*?) \((\d{4})\)$/);
    if (match) {
      setAchievTitle(match[1]);
      setAcquiredFrom(match[2]);
      setAchievDate(match[3]);
      setFormModal(true);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onSave(editedItems);
      if (!success) {
        setError("Failed to save changes. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Achievements submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white shadow p-8">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Achievements</h3>
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs font-semibold text-blue-600"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setEditingIndex(null);
              setAchievTitle('');
              setAcquiredFrom('');
              setAchievDate('');
              setFormModal(true);
            }}
            disabled={isSubmitting}
            className="text-xs font-semibold text-blue-600"
          >
            Add
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {editedItems.map((item, index) => (
        <React.Fragment key={index}>
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-1">
              <div className="text-sm">{item}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEditItem(index)}
                className="text-gray-500 hover:text-blue-500"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z"/>
                </svg>
              </button>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-gray-500 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {index < editedItems.length - 1 && (
            <div className="border-t border-gray-200 opacity-20 my-4"></div>
          )}
        </React.Fragment>
      ))}

      {formModal && (
        <AchievementForm
          title={title}
          isOpen={formModal}
          onClose={() => {
            setFormModal(false);
            setEditingIndex(null);
          }}
          achievTitle={achievTitle}
          setAchievTitle={setAchievTitle}
          acquiredFrom={acquiredFrom}
          setAcquiredFrom={setAcquiredFrom}
          achievDate={achievDate}
          setAchievDate={setAchievDate}
          onSubmit={handleAddItem}
        />
      )}
    </div>
  );
};

export default AchievementsEditor;
