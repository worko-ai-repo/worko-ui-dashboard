import { Group } from "@Assets";
import { toTitleCase } from "@Utils/Titlecase.utils";
import { Briefcase, Edit, Pencil,Link } from "lucide-react";
import React, { MouseEventHandler } from "react";

function formatDate(isoDate?: string) {
  if (!isoDate) return "present";
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${month}-${year}`;
}

function calculateYOE(startDate?: string, endDate?: string): { years: number; months: number } {
  if (!startDate) return { years: 0, months: 0 };

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { years: 0, months: 0 };
  }

  if (end < start) return { years: 0, months: 0 };

  const diffMs: number = end.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const totalMonths = Math.floor(diffDays / 30);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  return { years, months };
}

interface RenderCardProps {
  title: string;
  children: React.ReactNode;
  editIcon?: boolean;
  onEdit?: () => void;
}

interface ResponsibilityItem {
  companyName: string;
  date: {
    startDate: string;
    endDate?: string;
  };
  description: string;
}

interface ExperienceItem {
  companyName: string;
  designation: string;
  department: string;
  YOE: number;
  startDate:string;
  endDate:string;
}

interface EducationItem {
  collage: string;
  degree: string;
  passingYear: string;
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
          <img src={Group} alt="Edit" className="w-5 h-5" />
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
        <span className="text-black">{title}</span>
      </div>
      {!hasActions && onEdit && (
        <button 
          onClick={onEdit} 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <img src={Group} alt="Edit" className="w-5 h-5" />
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
      {/* {title === "Location preference" && (
        <img
          className="ml-4 w-4 h-4"
          alt="Plus"
          src="/api/placeholder/16/16"
        />
      )} */}
    </div>
  </div>
);

interface RenderListSectionProps {
  title: string;
  items: React.ReactNode[];
  key?: React.Key;
  onEdit?: () => void;
  variant?: "default" | "socials" | "responsibilities" | "experience" | "education";
}

// Responsibility/Achievement section renderer with edit button
export const renderListSection = ({
  title,
  items = [],
  key,
  onEdit,
  variant = "default"
}: RenderListSectionProps) => (
  <div key={key} className="w-full rounded-3xl bg-white shadow p-8">
    <div className="flex items-start justify-between mb-4">
      <h3 className="text-lg font-semibold text-black">{title}</h3>
      <button 
        onClick={onEdit} 
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <img src={Group} alt="Edit" className="w-5 h-5" />
      </button>
    </div>

    {items.length > 0 ? (
      variant === "socials" ? (
        <div className="flex flex-wrap gap-4">
          {(items as string[]).map((item, index) => (
            <div key={index} className="text-blue-600 text-sm underline">
              {item}
            </div>
          ))}
        </div>
      ) : variant === "responsibilities" ? (
        (items as unknown as ResponsibilityItem[]).map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex justify-between items-start mb-1 gap-4">
              <div className="flex-1 min-w-0">
                <span className="font-medium text-black block truncate">
                  {toTitleCase(item.companyName)}
                </span>
                {item.description && (
                  <p className="mt-1 text-sm text-gray-700 max-w-4xl">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap min-w-[140px] text-right flex-shrink-0">
                {formatDate(item.date.startDate)} - {formatDate(item.date.endDate)}
                {/* {new Date(item.date.startDate).toLocaleDateString()} -{" "}
                {item.date.endDate
                  ? new Date(item.date.endDate).toLocaleDateString()
                  : "Present"} */}
              </div>
            </div>
            {index < items.length - 1 && (
              <div className="border-t border-gray-400 opacity-20 my-4"></div>
            )}
          </React.Fragment>
        ))
      ) : variant === "experience" ? (
        (items as unknown as ExperienceItem[]).map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex justify-between items-start mb-1 gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-black truncate">
                  {item.designation} at {item.companyName}
                </div>
                {item.department && (
                  <p className="text-sm text-gray-700">
                    Department: {item.department}
                  </p>
                )}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap text-right min-w-[100px]">
                {formatDate(item.startDate)} - {formatDate(item.endDate)}{" "}
                {(() => {
                  const { years, months } = calculateYOE(item.startDate, item.endDate);
                  let yoeString = "";
                  if (years > 0) yoeString += `${years} ${years === 1 ? "year" : "years"}`;
                  if (months > 0) yoeString += `${yoeString ? " " : ""}${months} ${months === 1 ? "month" : "months"}`;
                  return yoeString ? ` · ${yoeString}` : "";
                })()}
              </div>
            </div>
            {index < items.length - 1 && (
              <div className="border-t border-gray-800 opacity-20 my-4"></div>
            )}
          </React.Fragment>
        ))
      ) : variant === "education" ? (
        (items as unknown as EducationItem[]).map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex justify-between items-start mb-1 gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-black truncate">
                  {item.degree} from {item.collage}
                </div>
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap text-right min-w-[100px]">
                Passing Year  - {item.passingYear}
              </div>
            </div>
            {index < items.length - 1 && (
              <div className="border-t border-gray-800 opacity-20 my-4"></div>
            )}
          </React.Fragment>
        ))
      ):(
        (items as React.ReactNode[]).map((item, index) => (
          <React.Fragment key={index}>
            <div className="flex items-start gap-4 mb-4">
              <Briefcase className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              <div className="flex-1">
                <div className="text-sm">{item}</div>
              </div>
            </div>
            {index < items.length - 1 && (
              <div className="border-t border-gray-800 opacity-20 my-4"></div>
            )}
          </React.Fragment>
        ))
      )
    ) : (
      <div className="text-sm text-gray-500">No items added yet.</div>
    )}
  </div>
);
