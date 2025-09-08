import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui"; // Or your custom toast util

export interface Experience {
  companyName: string;
  designation: string;
  department: string;
  YOE: number;
}

interface ExperienceEditorProps {
  items: Experience[];
  onSave: (items: Experience[]) => Promise<boolean>;
  onCancel: () => void;
}

const ExperienceEditor: React.FC<ExperienceEditorProps> = ({
  items,
  onSave,
  onCancel
}) => {
  const [editedItems, setEditedItems] = useState<Experience[]>(items || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [yoe, setYOE] = useState<number | string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearForm = () => {
    setEditingIndex(null);
    setCompanyName("");
    setDesignation("");
    setDepartment("");
    setYOE("");
  };

  const handleEditItem = (index: number) => {
    const item = editedItems[index];
    setEditingIndex(index);
    setCompanyName(item.companyName);
    setDesignation(item.designation);
    setDepartment(item.department);
    setYOE(item.YOE);
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
    if (editingIndex === index) clearForm();
  };

  const handleAddOrUpdate = () => {
    if (!companyName.trim() || !designation.trim()) {
      toast.error("Company Name and Designation are required.", getToastOptions({}));
      return;
    }

    if (yoe !== "" && (isNaN(Number(yoe)) || Number(yoe) < 0)) {
      toast.error("Years of experience must be a non-negative number.", getToastOptions({}));
      return;
    }

    const newItem: Experience = {
      companyName: companyName.trim(),
      designation: designation.trim(),
      department: department.trim(),
      YOE: Number(yoe) || 0
    };

    if (editingIndex !== null) {
      const updated = [...editedItems];
      updated[editingIndex] = newItem;
      setEditedItems(updated);
    } else {
      setEditedItems([...editedItems, newItem]);
    }

    clearForm();
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
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white shadow p-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
        <h3 className="text-lg font-semibold text-black">Work Experience</h3>
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
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* List */}
      {editedItems.length === 0 ? (
        <p className="text-gray-500 text-sm mb-4">No work experience added yet.</p>
      ) : (
        editedItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-200 gap-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-1 sm:gap-2 truncate">
              <div className="font-medium truncate">{item.designation} - {item.companyName}</div>
              <span className="hidden sm:inline-block text-gray-400">|</span>
              <div className="text-sm text-gray-700 truncate">{item.department}</div>
              <span className="hidden sm:inline-block text-gray-400">|</span>
              <div className="text-sm text-gray-500 whitespace-nowrap">{item.YOE} years</div>
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => handleEditItem(index)}
                className="text-gray-500 hover:text-blue-500"
                aria-label="Edit experience"
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
          <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
        </svg>
              </button>
              <button
                onClick={() => handleRemoveItem(index)}
                className="text-gray-500 hover:text-red-500"
                aria-label="Remove experience"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))
      )}

      {/* Form */}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
    <input
        type="text"
        placeholder="Designation"
        value={designation}
        onChange={(e) => setDesignation(e.target.value)}
        className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
    />
    <input
        type="text"
        placeholder="Company Name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
    />
    <input
        type="text"
        placeholder="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        className="border border-gray-300 rounded-md p-2 text-sm shadow-sm"
    />

    {/* YOE and Add button on same row */}
    <div className="flex items-center gap-3">
        <input
        type="number"
        min={0}
        placeholder="Years of Experience"
        value={yoe}
        onChange={(e) => setYOE(e.target.value)}
        className="flex-grow border border-gray-300 rounded-md p-2 text-sm shadow-sm"
        />
        <button
        onClick={handleAddOrUpdate}
        disabled={!designation.trim() || !companyName.trim()}
        className="flex items-center justify-center rounded-md bg-blue-600 p-2 text-white disabled:bg-blue-300"
        aria-label="Add experience"
        >
        <Plus size={16} />
        </button>
    </div>
    </div>


    </div>
  );
};

export default ExperienceEditor;
