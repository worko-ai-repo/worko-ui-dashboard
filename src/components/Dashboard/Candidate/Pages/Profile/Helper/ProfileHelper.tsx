import { Group } from "@Assets";
import { Briefcase, Edit, Pencil } from "lucide-react";
import React, { MouseEventHandler } from "react";

interface RenderCardProps {
  title: string;
  children: React.ReactNode;
  editIcon?: boolean;
  onEdit?: () => void;
}

export const renderCard = ({
  title,
  children,
  editIcon = true,
  onEdit
}: RenderCardProps) => (
  <div className="w-full rounded-3xl bg-white shadow p-8">
    <div className="flex items-start justify-between mb-4">
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      {editIcon && (
        <button 
          onClick={onEdit} 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <Pencil className="w-5 h-5 text-gray-500" />
        </button>
      )}
    </div>
    {children}
  </div>
);

interface RenderTagProps {
  text: string;
  hasPlus?: boolean;
  onClick?: MouseEventHandler<HTMLImageElement> | undefined;
}

// Tag renderer for skills, preferences etc.
export const renderTag = ({
  text,
  hasPlus = false,
  onClick = undefined,
}: RenderTagProps) => (
  <div
    key={text}
    className="rounded-xl bg-gray-100 px-4 py-1 text-xs flex items-center justify-between"
  >
    <span>{text}</span>
    {hasPlus && (
      <img
        className="w-4 h-4 ml-4"
        alt="Plus"
        src="/api/placeholder/16/16"
        onClick={onClick}
      />
    )}
  </div>
);

interface RenderSkillsSectionProps {
  title: string;
  skills: any[];
  hasActions?: boolean;
  key?: React.Key;
  onEdit?: () => void;
}

// Skills section renderer with edit button
export const renderSkillsSection = ({
  title,
  skills = [],
  hasActions = false,
  key,
  onEdit
}: RenderSkillsSectionProps) => (
  <div className="w-full rounded-3xl bg-white shadow p-8">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center text-lg font-semibold">
        <span className="text-red-500">*</span>
        <span className="text-gray-500">{title}</span>
      </div>
      {!hasActions && onEdit && (
        <button 
          onClick={onEdit} 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <Pencil className="w-5 h-5 text-gray-500" />
        </button>
      )}
      {hasActions && (
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-blue-600">Cancel</span>
          <img className="w-4 h-4" alt="Save" src="/api/placeholder/16/16" />
        </div>
      )}
    </div>

    <div className="flex flex-wrap gap-4">
      {skills.map((skill: any, index: number) => (
        <div
          key={index}
          className="rounded-xl bg-gray-100 px-4 py-1 text-xs flex items-center"
        >
          <span>
            {typeof skill === "string"
              ? skill
              : `${skill.skillName}${
                  skill.years
                    ? ` | ${skill.years} ${
                        skill.years === 1 ? "year" : "years"
                      }`
                    : ""
                }`}
          </span>
          {skill?.hasOwnProperty("canRemove") && (
            <img
              className="w-5 h-5 ml-2"
              alt="Plus"
              src="/api/placeholder/20/20"
            />
          )}
        </div>
      ))}
      {title === "Location preference" && (
        <img
          className="ml-4 w-4 h-4"
          alt="Plus"
          src="/api/placeholder/16/16"
        />
      )}
    </div>
  </div>
);

interface RenderListSectionProps {
  title: string;
  items: string[];
  key?: React.Key;
  onEdit?: () => void;
}

// Responsibility/Achievement section renderer with edit button
export const renderListSection = ({
  title,
  items = [],
  key,
  onEdit
}: RenderListSectionProps) => (
  <div key={key} className="w-full rounded-3xl bg-white shadow p-8">
    <div className="flex items-start justify-between mb-4">
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <button 
        onClick={onEdit} 
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <Pencil className="w-5 h-5 text-gray-500" />
      </button>
    </div>

    {items.length > 0 ? (
      items.map((item, index) => (
        <React.Fragment key={index}>
          <div className="flex items-start gap-4 mb-4">
            <Briefcase strokeWidth={1.5} />
            <div className="flex-1">
              <div className="font-medium">{item}</div>
            </div>
          </div>
          {index < items.length - 1 && (
            <div className="border-t border-gray-200 opacity-20 my-4"></div>
          )}
        </React.Fragment>
      ))
    ) : (
      <div className="text-sm text-gray-500">No items added yet.</div>
    )}
  </div>
);