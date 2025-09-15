import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "react-toastify";
import ResponsibilityForm from "./ResponsibilityForm";
import { getToastOptions } from "@Utils/Toast.utils";

export interface Responsibility {
  companyName: string;
  date: {
    startDate: string;
    endDate?: string;
  };
  description: string;
}

interface ResponsibilityEditorProps {
  title: string,
  items: Responsibility[];
  onSave: (items: Responsibility[]) => Promise<boolean>;
  onCancel: () => void;
}

const ResponsibilityEditor: React.FC<ResponsibilityEditorProps> = ({
  title,
  items,
  onSave,
  onCancel,
}) => {
  const [editedItems, setEditedItems] = useState<Responsibility[]>(items || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formModal, setFormModal] = useState<boolean>(false);

  const handleEditItem = (index: number) => {
    const item = editedItems[index];
    setEditingIndex(index);
    setCompanyName(item.companyName);
    setStartDate(item.date.startDate);
    setEndDate(item.date.endDate || "");
    setDescription(item.description);
    setFormModal(true)
  };

    function formatDate(isoDate?: string) {
    if (!isoDate) return "present";
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${month}-${year}`;
  }
  
  const handleRemoveItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
    if (editingIndex === index) clearForm();
  };
console.log(items)
  const clearForm = () => {
    setEditingIndex(null);
    setCompanyName("");
    setStartDate("");
    setEndDate("");
    setDescription("");
  };

  const handleAddOrUpdate = () => {
    if (!companyName.trim() || !startDate.trim() || !description.trim()) {
      toast.error("Company Name, Start Date and Description are required.", getToastOptions({}));
      return;
    }

    if (new Date(startDate) > new Date()) {
      toast.error("Start Date cannot be in the future.", getToastOptions({}));
      return;
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      toast.error("End Date cannot be before Start Date.", getToastOptions({}));
      return;
    }

    const newItem: Responsibility = {
      companyName: companyName.trim(),
      date: { startDate: startDate.trim(), endDate: endDate.trim() || undefined },
      description: description.trim(),
    };

    if (editingIndex !== null) {
      const updated = [...editedItems];
      updated[editingIndex] = newItem;
      setEditedItems(updated);
      clearForm();
      setFormModal(false)
    } else {
      setEditedItems([...editedItems, newItem]);
      clearForm();
      setFormModal(false)
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
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

return (
  <div className="w-full rounded-3xl bg-white shadow p-6 sm:p-8">
    {/* Header */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
      <h3 className="text-lg font-semibold text-black">Responsibilities</h3>
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
              setCompanyName('');
              setStartDate('');
              setEndDate('');
              setDescription('');
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
      {editedItems.length === 0 && (
        <p className="text-gray-500 text-sm mb-4">No responsibilities added yet.</p>
      )}

      {editedItems.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-2 border-b border-gray-200 gap-2">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="font-medium truncate">{item.companyName}</div>
            <span>-</span>
            <div className="text-sm text-gray-700 truncate">{item.description}</div>
          </div>
          <div className="text-xs text-gray-600 whitespace-nowrap min-w-[140px] text-right">
            {formatDate(item.date.startDate)} - {formatDate(item.date.endDate)}
          </div>
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => handleEditItem(index)}
              className="text-gray-500 hover:text-blue-500"
              aria-label="Edit responsibility">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
              </svg>
            </button>
            <button
              onClick={() => handleRemoveItem(index)}
              className="text-gray-500 hover:text-red-500"
              aria-label="Remove responsibility">
              <X size={16} />
            </button>
          </div>
        </div>
      ))}

    {/* Form */}
    {/* <div className="flex flex-wrap items-center gap-3 mt-6 max-w-full">
      <input
        type="text"
        placeholder="Company Name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        className="flex-grow min-w-[150px] border border-gray-300 rounded-md p-2 text-sm shadow-sm"
      />
      <input
        type="date"
        placeholder="Start Date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="w-32 sm:w-36 border border-gray-300 rounded-md p-2 text-sm shadow-sm"
      />
      <input
        type="date"
        placeholder="End Date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="w-32 sm:w-36 border border-gray-300 rounded-md p-2 text-sm shadow-sm"
      />
      <div className="w-full flex gap-3 items-end">
        <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={250}
        className="flex-grow min-w-[150px] border border-gray-300 rounded-md p-2 text-sm shadow-sm resize-none h-20"
        />
      <button
        onClick={handleAddOrUpdate}
        disabled={
          !companyName.trim() ||
          !startDate.trim() ||
          !description.trim()
        }
        className="flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-white disabled:bg-blue-300"
        aria-label={editingIndex !== null ? "Update responsibility" : "Add responsibility"}
      >
        {editingIndex !== null ? (
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
            <path d="m5 12 5 5L20 7" />
          </svg>
        ) : (
          <Plus size={16} />
        )}
      </button>
      </div>
    </div> */}
          {formModal && (
        <ResponsibilityForm
          title={title}
          isOpen={formModal}
          onClose={() => {
            setFormModal(false);
            setEditingIndex(null);
          }}
          companyName={companyName}
          setCompanyName={setCompanyName}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          description={description}
          setDescription={setDescription}
          onSubmit={handleAddOrUpdate}
        />
      )}
  </div>
);

};

export default ResponsibilityEditor;