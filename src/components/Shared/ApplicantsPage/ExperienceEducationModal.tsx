import React from "react";
import { X } from "lucide-react";

interface WorkExperience {
  designation: string;
  companyName: string;
  startDate: string;
  endDate?: string;
}

interface Education {
  degree: string;
  collage: string;
  passingYear: string;
}

interface ExperienceEducationModalProps {
  workExperiences: WorkExperience[];
  educations: Education[];
  about: string | null;
  candidateName: string;
  coreSkills?:[];
  onClose: () => void;
  defaultSection?: "experience" | "education" | "about" | "coreSkills";
}

const ExperienceEducationModal: React.FC<ExperienceEducationModalProps> = ({
  workExperiences,
  educations,
  about,
  candidateName,
  coreSkills,
  onClose,
}) => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold capitalize text-gray-800">
          Candidate Details - {candidateName}
        </h2>
      </div>

      <div className="max-h-[70vh] overflow-y-auto space-y-5">
        {/* Experience Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Work Experience
          </h3>
          {workExperiences.length > 0 ? (
            <ul className="space-y-1 text-xs text-gray-700 ml-1">
              {workExperiences.map((exp, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <div className="flex-1">
                    <span className="font-medium">{exp.designation}</span>
                    {exp.companyName && <span> at {exp.companyName}</span>}
                    <span className="text-gray-500">
                      {" "}
                      • {exp.startDate ? new Date(exp.startDate).getFullYear() : "N/A"} -{" "}
                      {exp.endDate && !isNaN(new Date(exp.endDate).getFullYear())
                        ? new Date(exp.endDate).getFullYear()
                        : "Present"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 ml-1">No experience listed</p>
          )}
        </div>

        {/* Education Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Education 
          </h3>
          {educations.length > 0 ? (
            <ul className="space-y-1 text-xs text-gray-700 ml-1">
              {educations.map((edu, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <div className="flex-1">
                    <span className="font-medium">{edu.degree}</span>
                    <span> from {edu.collage}</span>
                    <span className="text-gray-500"> • {edu.passingYear || "N/A"}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 ml-1">No education listed</p>
          )}
        </div>

        {/* About Section */}
        {about && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap ml-1">
              {about}
            </p>
          </div>
        )}
        {coreSkills && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Core Skills</h3>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap ml-1">
              {coreSkills.map((skill:any) => skill?.skillName).join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperienceEducationModal;
