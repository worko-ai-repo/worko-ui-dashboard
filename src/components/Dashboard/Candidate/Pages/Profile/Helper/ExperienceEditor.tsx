import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import ExperienceForm from "./ExperienceForm";
import { getToastOptions } from "@Utils/Toast.utils";

export interface Experience {
  companyName: string;
  designation: string;
  department: string;
  YOE: number;
  startDate: string;
  endDate: string;
}

interface ExperienceEditorProps {
  title:string;
  items: Experience[];
  onSave: (items: Experience[]) => Promise<boolean>;
  onCancel: () => void;
}

const ExperienceEditor: React.FC<ExperienceEditorProps> = ({
  title,
  items,
  onSave,
  onCancel
}) => {
  const [editedItems, setEditedItems] = useState<Experience[]>(items || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [yoe, setYOE] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formModal,setFormModal] = useState<boolean>(false)
  const today = new Date().toISOString().split("T")[0];

  const clearForm = () => {
    setEditingIndex(null);
    setCompanyName("");
    setDesignation("");
    setDepartment("");
    setYOE("");
    setStartDate("");
    setEndDate("");
  };

  function formatDate(isoDate?: string) {
    if (!isoDate) return "N/A";
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${month}-${year}`;
  }

  const handleEditItem = (index: number) => {
    const item = editedItems[index];
    setEditingIndex(index);
    setCompanyName(item.companyName);
    setDesignation(item.designation);
    setDepartment(item.department);
    setYOE(String(item.YOE));
    setStartDate(item.startDate);
    setEndDate(item.endDate);
    setFormModal(true)
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
    if (editingIndex === index) clearForm();
  };

  const handleAddOrUpdate = () => {
    if (!companyName.trim() || !designation.trim() || !department.trim()) {
      toast.error("Company Name and Designation are required.", getToastOptions({}));
      return;
    }

    if (!startDate.trim() || !endDate.trim()) {
      toast.error("Start and End are required", getToastOptions({}));
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
      YOE: Number(yoe) || 0,
      startDate: startDate.trim(),
      endDate: endDate.trim(),
    };

    if (editingIndex !== null) {
      const updated = [...editedItems];
      updated[editingIndex] = newItem;
      setEditedItems(updated);
    } else {
      setEditedItems([...editedItems, newItem]);
    }

    clearForm();
    setFormModal(false)
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
            className="text-xs font-semibold text-blue-600">
            Cancel
          </button>
          <button
            onClick={() => {
              setEditingIndex(null);
              setCompanyName('');
              setDesignation('');
              setDepartment('');
              setYOE('');
              setStartDate('');
              setEndDate('');
              setFormModal(true);
            }}
            disabled={isSubmitting}
            className="text-xs font-semibold text-blue-600"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setEditingIndex(null);
              setCompanyName('');
              setDesignation('');
              setDepartment('');
              setYOE('');
              setStartDate('');
              setEndDate('');
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
            className="flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-500">
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
            className="flex items-center justify-between py-2 border-b border-gray-200 gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-1 sm:gap-2 truncate">
              <div className="font-medium truncate">
                {item.designation} - {item.companyName}
              </div>
              <span className="hidden sm:inline-block text-gray-400">|</span>
              <div className="text-sm text-gray-700 truncate">{item.department}</div>
              <span className="hidden sm:inline-block text-gray-400">|</span>
              <div className="text-sm text-gray-500 whitespace-nowrap">
                {formatDate(item.startDate)}-{formatDate(item.endDate)}
              </div>
              <span className="hidden sm:inline-block text-gray-400">|</span>
              <div className="text-sm text-gray-500 whitespace-nowrap">{item.YOE} years</div>
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => handleEditItem(index)}
                className="text-gray-500 hover:text-blue-500"
                aria-label="Edit experience">
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
                aria-label="Remove experience">
                <X size={16} />
              </button>
            </div>
          </div>
        ))
      )}
        {formModal && (
        <ExperienceForm
          title={title}
          isOpen={formModal}
          onClose={() => {
            setFormModal(false);
            setEditingIndex(null);
          }}
          designation={designation}
          setDesignation={setDesignation}
          companyName={companyName}
          setCompanyName={setCompanyName}
          department={department}
          setDepartment={setDepartment}
          yoe={yoe}
          setYOE={setYOE}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onSubmit={handleAddOrUpdate}
        />
      )}
    </div>
  );
};

export default ExperienceEditor;
