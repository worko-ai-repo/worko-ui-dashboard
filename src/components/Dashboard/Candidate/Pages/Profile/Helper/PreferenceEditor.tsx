import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { locationAssets,industryTypeOptions } from '@AssetsFolder/jobs.assets';

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
  const [filteredSuggestions, setFilteredSuggestions] = useState<{ label: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const handleAddPreference = () => {
    if (!newPreference.trim()) return;

    if (editedPreference.includes(newPreference.trim())) {
      setError("This entry already exists.");
      return;
    }

    setEditedPreference([...editedPreference, newPreference.trim()]);
    setNewPreference('');
    setFilteredSuggestions([]);
    setShowSuggestions(false);
    setError(null);
  };

  const handleRemovePreference = (index: number) => {
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
      console.error("Submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

const isLocation = title === "Location preference";
const isIndustry = title === "Industry preference";

useEffect(() => {
  if (isLocation) {
    setFilteredSuggestions(locationAssets);
    setShowSuggestions(true);
  } else if (isIndustry) {
    setFilteredSuggestions(industryTypeOptions);
    setShowSuggestions(true);
  }
}, [isLocation, isIndustry]);

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
        {editedPreference.map((item, index) => (
          <div
            key={index}
            className="rounded-xl bg-gray-100 px-4 py-1 text-xs flex items-center"
          >
            <span>{item}</span>
            <button
              onClick={() => handleRemovePreference(index)}
              className="ml-2 text-gray-500 hover:text-red-500"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2 mt-4 relative">
        <div className="flex-1">
          <label htmlFor="newPreference" className="block text-xs font-medium text-gray-700 mb-1">
            {title === "Roles I am looking for"
              ? "Add a new role"
              : title === "Industry preference"
              ? "Add a new industry"
              : title === "Department preference"
              ? "Add a new department"
              : "Add a new location"}
          </label>
          <input
            type="text"
            id="newPreference"
            value={newPreference}
              onChange={(e) => {
                const input = e.target.value;
                setNewPreference(input);

                if (input.length > 0) {
                  let matches: { label: string }[] = [];

                  if (isLocation) {
                    matches = locationAssets.filter((loc) =>
                      loc.label.toLowerCase().includes(input.toLowerCase())
                    );
                  } else if (isIndustry) {
                    matches = industryTypeOptions.filter((ind) =>
                      ind.label.toLowerCase().includes(input.toLowerCase())
                    );
                  }

                  setFilteredSuggestions(matches);
                  setShowSuggestions(true);
                } else {
                  setFilteredSuggestions([]);
                  setShowSuggestions(false);
                }
              }}
            onFocus={() => {
              if ((isLocation || isIndustry) && newPreference.length > 0) setShowSuggestions(true);
            }}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
            placeholder={`Type ${isLocation ? 'location' : isIndustry ? 'industry' : 'preference'} name`}          />

          {(isLocation || isIndustry) && showSuggestions && filteredSuggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-md mt-1 max-h-48 overflow-y-auto text-sm">
              {filteredSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => {
                    if (!editedPreference.includes(suggestion.label)) {
                      setEditedPreference([...editedPreference, suggestion.label]);
                    }
                    setNewPreference('');
                    setFilteredSuggestions([]);
                    setShowSuggestions(false);
                    setError(null);
                  }}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                >
                  {suggestion.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={handleAddPreference}
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
