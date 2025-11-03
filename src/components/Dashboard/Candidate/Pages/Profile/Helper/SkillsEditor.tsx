import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface SkillsEditorProps {
  title: string;
  skills: any[];
  onSave: (skills: any[]) => Promise<boolean>;
  onCancel: () => void;
  withYears?: boolean;
}

const SkillsEditor: React.FC<SkillsEditorProps> = ({
  title,
  skills,
  onSave,
  onCancel,
  withYears = false
}) => {
  // Normalize existing skills to ensure proper structure
  const [editedSkills, setEditedSkills] = useState<any[]>(
    (skills || []).map(skill => 
      typeof skill === 'string' 
        ? { 
            skillName: skill, 
            // timestamps: { createdAt: new Date().toISOString() },
            canRemove: true
          } 
        : skill
    )
  );
  const [newSkill, setNewSkill] = useState<string>('');
  const [newSkillYears, setNewSkillYears] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    
    // Always create proper object structure for skills
    const skillToAdd = withYears 
      ? { 
          skillName: newSkill.trim(), 
          years: newSkillYears ? parseInt(newSkillYears, 10) : 0,
          // timestamps: { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        }
      : { 
          skillName: newSkill.trim(),
          // timestamps: { createdAt: new Date().toISOString() },
        };
    
    setEditedSkills([...editedSkills, skillToAdd]);
    setNewSkill('');
    setNewSkillYears('');
  };

  const handleRemoveSkill = (index: number) => {
    setEditedSkills(editedSkills.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Ensure all skills have the correct structure before saving
      const formattedSkills = editedSkills.map(skill => {
        // Handle legacy string skills (should not happen with the new code but for safety)
        if (typeof skill === 'string') {
          return {
            skillName: skill,
            // timestamps: { createdAt: new Date().toISOString() }
          };
        }
        
        // Ensure timestamps exist
        if (!skill.timestamps) {
          return {
            ...skill,
            // timestamps: { createdAt: new Date().toISOString() }
          };
        }
        
        return skill;
      });
      
      const success = await onSave(formattedSkills);
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
        {editedSkills.map((skill: any, index: number) => (
          <div
            key={index}
            className="rounded-xl bg-gray-100 px-4 py-1 text-xs flex items-center"
          >
            <span>
              {typeof skill === "string"
                ? skill // Fallback for any legacy string skills
                : `${skill.skillName}${
                    skill.years
                      ? ` | ${skill.years} ${
                          skill.years === 1 ? "year" : "years"
                        }`
                      : ""
                  }`}
            </span>
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
          <label htmlFor="newSkill" className="block text-xs font-medium text-gray-700 mb-1">
            Add a new skill
          </label>
          <input
            type="text"
            id="newSkill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
            placeholder="Type skill name"
          />
        </div>
        
        {withYears && (
          <div className="w-24">
            <label htmlFor="skillYears" className="block text-xs font-medium text-gray-700 mb-1">
              Years
            </label>
            <input
              type="number"
              id="skillYears"
              value={newSkillYears}
              onChange={(e) => setNewSkillYears(e.target.value)}
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm"
              placeholder="Years"
            />
          </div>
        )}
        
        <button
          onClick={handleAddSkill}
          disabled={!newSkill.trim()}
          className="flex items-center justify-center h-9 w-9 rounded-md bg-blue-600 text-white disabled:bg-blue-300"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default SkillsEditor;