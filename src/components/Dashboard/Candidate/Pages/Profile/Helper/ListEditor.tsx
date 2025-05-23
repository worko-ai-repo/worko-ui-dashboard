import React, { useState } from 'react';
import { Briefcase, Plus, X } from 'lucide-react';

interface ListEditorProps {
  title: string;
  items: string[];
  onSave: (items: string[]) => Promise<boolean>;
  onCancel: () => void;
}

const ListEditor: React.FC<ListEditorProps> = ({
  title,
  items,
  onSave,
  onCancel
}) => {
  const [editedItems, setEditedItems] = useState<string[]>(items || []);
  const [newItem, setNewItem] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    if (!newItem.trim()) return;
    
    if (editingIndex !== null) {
      const updatedItems = [...editedItems];
      updatedItems[editingIndex] = newItem.trim();
      setEditedItems(updatedItems);
      setEditingIndex(null);
    } else {
      setEditedItems([...editedItems, newItem.trim()]);
    }
    
    setNewItem('');
  };

  const handleRemoveItem = (index: number) => {
    setEditedItems(editedItems.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setNewItem('');
    }
  };

  const handleEditItem = (index: number) => {
    setNewItem(editedItems[index]);
    setEditingIndex(index);
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
      console.error("List submission error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full rounded-3xl bg-white shadow p-8">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">{title}</h3>
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

      {editedItems.map((item, index) => (
        <React.Fragment key={index}>
          <div className="flex items-start gap-4 mb-4">
            <Briefcase strokeWidth={1.5} />
            <div className="flex-1">
              <div className="font-medium">{item}</div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handleEditItem(index)}
                className="text-gray-500 hover:text-blue-500"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      <div className="flex items-end gap-2 mt-6">
        <div className="flex-1">
          <label htmlFor="newItem" className="block text-xs font-medium text-gray-700 mb-1">
            {editingIndex !== null ? 'Edit item' : 'Add a new item'}
          </label>
          <input
            type="text"
            id="newItem"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
            placeholder={`Type ${title.toLowerCase()} text`}
          />
        </div>
        
        <button
          onClick={handleAddItem}
          disabled={!newItem.trim()}
          className="flex items-center justify-center h-9 w-9 rounded-md bg-blue-600 text-white disabled:bg-blue-300"
        >
          {editingIndex !== null ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 5 5L20 7"/>
            </svg>
          ) : (
            <Plus size={16} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ListEditor;