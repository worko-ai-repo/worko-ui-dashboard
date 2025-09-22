import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import EducationForm from "./EducationForm";

export interface Education {
  collage: string;
  degree: string;
  passingYear: number;
  PK:string;
  SK:string;
}

interface EducationEditorProps {
  title:string;
  items: Education[];
  onSave: (items: Education[]) => Promise<boolean>;
  onCancel: () => void;
}

const EducationEditor: React.FC<EducationEditorProps> = ({
  title,
  items,
  onSave,
  onCancel
}) => {
  const [editedItems, setEditedItems] = useState<Education[]>(items || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [collage, setCollage] = useState("");
  const [degree, setDegree] = useState("");
  const [passingYear, setPassingYear] = useState<number | null>(null);
  const [PK,setPK] = useState("")
  const [SK,setSK] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formModal,setFormModal] = useState<boolean>(false)

  const clearForm = () => {
    setEditingIndex(null);
    setCollage("");
    setDegree("");
    setPK("");
    setSK("");
    setPassingYear(null);
  };

  const handleEditItem = (index: number) => {
    const item = editedItems[index];
    setEditingIndex(index);
    setCollage(item.collage);
    setDegree(item.degree);
    setPassingYear(item.passingYear);
    setPK(item.PK);
    setSK(item.SK);
    setFormModal(true)
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
    if (editingIndex === index) clearForm();
  };

  const handleAddOrUpdate = () => {
    if (!collage?.trim() || !degree?.trim() || !passingYear) {
      toast.error("Company Name and Designation are required.", getToastOptions({}));
      return;
    }
    const currentYear = new Date().getFullYear();
    const minPassingYear = currentYear - 50;  
    const maxPassingYear = currentYear;       

    if (passingYear > maxPassingYear) {
        toast.error("Passing year cannot be in the future", getToastOptions({}));
        return;
    }

    if (passingYear < minPassingYear) {
        toast.error(`Passing year cannot be earlier than ${minPassingYear}`, getToastOptions({}));
        return;
    }

    if(passingYear  > currentYear ){
        toast.error("Passing year cannot be in future", getToastOptions({}));
        return
    }
    if(passingYear < 1980 ){
        toast.error("Passing year cannot be less than 1980", getToastOptions({}));
        return
    }
    const newItem: Education = {
      collage: collage?.trim(),
      degree: degree?.trim(),
      passingYear: passingYear,
      PK:PK,
      SK:SK,
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
    console.log(editedItems)
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
        <h3 className="text-lg font-semibold text-black">Education</h3>
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
              setCollage('');
              setDegree('');
              setPK('')
              setSK('')
              setPassingYear(null);
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
        <p className="text-gray-500 text-sm mb-4">No past or current education added yet.</p>
      ) : (
        editedItems.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 border-b border-gray-200 gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center flex-1 gap-1 sm:gap-2 truncate">
              <div className="text-sm truncate">
                {item.collage} - {item.degree}
              </div>
              <span className="hidden sm:inline-block text-gray-400">|</span>
              <div className="text-sm text-gray-700 truncate">{item.passingYear ?? "N/A"}</div>
              {/* <div className="text-sm text-gray-500 whitespace-nowrap">
                {passingYear}
              </div> */}
              {/* <span className="hidden sm:inline-block text-gray-400">|</span>
              <div className="text-sm text-gray-500 whitespace-nowrap">{item.YOE} years</div> */}
            </div>
            <div className="flex space-x-2 ml-4">
              <button
                onClick={() => handleEditItem(index)}
                className="text-gray-500 hover:text-blue-500"
                aria-label="Edit education">
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
                aria-label="Remove education">
                <X size={16} />
              </button>
            </div>
          </div>
        ))
      )}
        {formModal && (
        <EducationForm
          title={title}
          isOpen={formModal}
          onClose={() => {
            setFormModal(false);
            setEditingIndex(null);
          }}
          collage={collage}
          setCollage={setCollage}
          degree={degree}
          setDegree={setDegree}
          passingYear={passingYear}
          setPassingYear={setPassingYear}
          onSubmit={handleAddOrUpdate}
        />
      )}
    </div>
  );
};

export default EducationEditor;
