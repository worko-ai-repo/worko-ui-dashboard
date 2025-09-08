import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface PreferenceEditorProps {
  title: string;
  preference: string[];
  onSave: (preference: string[]) => Promise<boolean>;
  onCancel: () => void;
}

const PreferenceEditor: React.FC<PreferenceEditorProps> = ({
  title,
  preference,
  onSave,
  onCancel,
}) => {
  const [editedPreference, setEditedPreference] = useState<string[]>(preference || []);
  const [newPreference, setNewPreference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = () => {
    if (!newPreference.trim()) return;

    // Prevent duplicates (optional)
    if (editedPreference.includes(newPreference.trim())) {
      setError("This role already exists.");
      return;
    }

    setEditedPreference([...editedPreference, newPreference.trim()]);
    setNewPreference('');
    setError(null);
  };

  const handleRemoveSkill = (index: number) => {
    setEditedPreference(editedPreference.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onSave(editedPreference);
      if (!success) {
        setError("Failed to save changes. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Skills submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white shadow p-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center text-lg font-semibold">
          <span className="text-red-500">*</span>
          <span className="text-gray-500">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs font-semibold text-blue-600"
          >
            Cancel
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

      <div className="flex flex-wrap gap-4 mb-4">
        {editedPreference.map((preference: string, index: number) => (
          <div
            key={index}
            className="rounded-xl bg-gray-100 px-4 py-1 text-xs flex items-center"
          >
            <span>{preference}</span>
            <button 
              onClick={() => handleRemoveSkill(index)}
              className="ml-2 text-gray-500 hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 mt-4">
        <div className="flex-1">
          <label htmlFor="newPreference" className="block text-xs font-medium text-gray-700 mb-1">
            Add a new role
          </label>
          <input
            type="text"
            id="newPreference"
            value={newPreference}
            onChange={(e) => setNewPreference(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
            placeholder="Type role name"
          />
        </div>  
        <button
          onClick={handleAddSkill}
          disabled={!newPreference.trim()}
          className="flex items-center justify-center h-9 w-9 rounded-md bg-blue-600 text-white disabled:bg-blue-300"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default PreferenceEditor;
