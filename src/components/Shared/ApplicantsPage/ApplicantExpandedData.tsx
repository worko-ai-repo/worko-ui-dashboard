// ============================================
// GRID-BASED APPROACH FOR PERFECT ALIGNMENT
// This uses CSS Grid to ensure expanded actions
// align perfectly with the main row action column
// ============================================

// ============================================
// 1. UPDATED: ApplicantExpandedRowDetails.tsx
// ============================================

import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import React, { useState } from "react";
import Timeline from "../Timeline";
import CreatedByDisplay from "../PostJob/CreatedByDisplay";
import {
  getCvDownloadedById,
  getCvViewDate,
  getRejectedById,
} from "@Components/Dashboard/WorkoAdmin/Applicants/ApplicantsTable";
import Modal from "../Modal";
import ExperienceEducationModal from "./ExperienceEducationModal";

interface ExpandedRowDetailsProps {
  row: JobApplicationDetailsDto;
  activeTab: string;
  jobApplicationServiceObj: any;
  getCvViewDate: (statusTracker: any) => string;
  getCvDownloadedById: (row: any) => any;
  getRejectedById: (row: any) => any;
  expandedActions?: React.ReactNode; // NEW
}

const ApplicantExpandedRowDetails: React.FC<ExpandedRowDetailsProps> = ({
  row,
  activeTab,
  jobApplicationServiceObj,
  getCvViewDate,
  getCvDownloadedById,
  getRejectedById,
  expandedActions,
}) => {
  const [isRejectionReasonExpanded, setIsRejectionReasonExpanded] = useState(false);
  const [candidateDetailsModal, setCandidateDetailsModal] = useState<{
    isOpen: boolean;
    defaultSection: "experience" | "education" | "about";
  }>({
    isOpen: false,
    defaultSection: "experience",
  });

  // For Timeline view (no action split needed here)
  if (row.status === "JOINED" && activeTab === "Joined") {
    const timeLineProps = jobApplicationServiceObj.getTimelineDetails(row);
    return (
      <div className="p-4 w-full">
        <Timeline steps={timeLineProps} />
      </div>
    );
  }

  const workExperiences = row.applicantDetails.cvExtractParsed?.multipleCandidateExperience || [];
  const educations = row.applicantDetails.cvExtractParsed?.education || [];
  const showContactInfo = row.status !== "APPLIED";
  const about = row.applicantDetails?.about || null;

  return (
    // KEY: Grid container with 2 columns
    // Column 1: Takes remaining space (1fr)
    // Column 2: Auto-sized to fit action buttons (auto)
    <>
      <div className="grid grid-cols-[1fr_auto] gap-6">
        {/* LEFT SIDE: All content */}
        <div className="min-w-0">
          {" "}
          {/* min-w-0 prevents grid blowout */}
          {/* Main Info Grid */}
          <div className="grid grid-cols-7 gap-4 mb-1 text-left">
            {/* Work Experience */}
            <div className="col-span-2">
              <h3 className="font-semibold text-gray-400 mb-1">Work Experience</h3>
              <div className="space-y-1">
                {workExperiences.length > 0 ? (
                  <div
                    className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                    onClick={() =>
                      setCandidateDetailsModal({
                        isOpen: true,
                        defaultSection: "experience",
                      })
                    }>
                    {workExperiences.slice(0, 3).map((exp, index) => (
                      <div key={index} className="text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium line-clamp-2 flex-1">
                            {index + 1}. {exp.designation}{" "}
                            {exp.companyName ? `at ${exp.companyName}` : ""} •{" "}
                            {exp.startDate ? new Date(exp.startDate).getFullYear() : "N/A"} -{" "}
                            {exp.endDate && !isNaN(new Date(exp.endDate).getFullYear())
                              ? new Date(exp.endDate).getFullYear()
                              : "Present"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {workExperiences.length > 3 && (
                      <span className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        +{workExperiences.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No experience listed</p>
                )}
              </div>
            </div>

            {/* Education */}
            <div className="col-span-2">
              <h3 className="font-semibold text-gray-400 mb-1">Education</h3>
              <div className="space-y-1">
                {educations.length > 0 ? (
                  <div
                    className="cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors"
                    onClick={() =>
                      setCandidateDetailsModal({
                        isOpen: true,
                        defaultSection: "education",
                      })
                    }>
                    {educations.slice(0, 3).map((edu, index) => (
                      <div key={index} className="text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-medium line-clamp-2 flex-1">
                            {index + 1}. {edu.degree} at {edu.collage} • {edu.passingYear || "N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                    {educations.length > 3 && (
                      <span className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        +{educations.length - 3} more
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">No education listed</p>
                )}
              </div>
            </div>
            {/* ECTC Info */}
            <div className="">
              <div>
                <h3 className="font-semibold text-gray-400 mb-1">ECTC</h3>
                {row.applicantDetails?.ECTC ? (
                  <p className="capitalize">{row.applicantDetails.ECTC} LPA</p>
                ) : null}
              </div>
            </div>

            {/* Contact Info */}
            {showContactInfo ? (
              <div>
                <h3 className="font-semibold text-gray-400 mb-1">Contact Information</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="break-all">{row.applicantDetails?.email || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Phone:</span>
                    <p>{row?.applicantDetails?.number || row.applicantDetails?.personalDetails?.phone || "Not provided"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative group">
                <div className="">
                  <h3 className="font-semibold text-gray-400 mb-1">Contact Information</h3>
                  <div className="space-y-3 text-xs blur-sm">
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="break-all">Locked</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Phone:</span>
                      <p>Locked</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-center mx-auto text-blue-600 font-medium">
                    Unlock this details by accepting the application.
                  </p>
                </div>
              </div>
            )}

            {/* Location & ECTC */}
            <div className="space-y-3 text-xs">
              <div>
                <h3 className="font-semibold text-gray-400 mb-1">Location</h3>
                <p className="capitalize">{row.applicantDetails?.location || "Not Disclosed"}</p>
              </div>
            </div>
          </div>
          {/* About Section */}
          <div className="grid grid-cols-1 gap-4 mb-1 text-left">
            {about && (
              <div className="pt-4 text-left border-gray-200">
                <h3 className="font-semibold text-gray-400 mb-2">About</h3>
                <div
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                  onClick={() =>
                    setCandidateDetailsModal({
                      isOpen: true,
                      defaultSection: "about",
                    })
                  }>
                  <p className="text-xs leading-relaxed line-clamp-3">{about}</p>
                  {about.split(" ").length > 30 && (
                    <span className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                      Read more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal for Candidate Details */}
      <Modal
        isOpen={candidateDetailsModal.isOpen}
        onClose={() =>
          setCandidateDetailsModal({
            isOpen: false,
            defaultSection: "experience",
          })
        }
        className="w-[90vw] sm:max-w-2xl h-auto">
        <ExperienceEducationModal
          workExperiences={workExperiences}
          educations={educations.map((edu) => ({ ...edu, passingYear: String(edu.passingYear) }))}
          about={about}
          candidateName={row.applicantDetails.name}
          defaultSection={candidateDetailsModal.defaultSection}
          onClose={() =>
            setCandidateDetailsModal({
              isOpen: false,
              defaultSection: "experience",
            })
          }
        />
      </Modal>
    </>
  );
};

export default ApplicantExpandedRowDetails;

export const expandedExtraApplicationRow = (expandedActions: React.ReactNode, row: any) => [
  // Node 2: Dates & Status (second last column
  // Node 1: Expanded Actions (last column)
  {
    content: (
      <>
        {/* RIGHT SIDE: Action buttons - aligns with action column! */}
        {expandedActions && (
          <div className="flex mx-auto flex-col gap-2 self-start w-full">
            {/* Sticky makes it stay visible while scrolling */}
            <div className="flex flex-col gap-2">{expandedActions}</div>
          </div>
        )}
      </>
    ),
    colSpan: 1,
  },
  {
    content: (
      <div className="w-full flex flex-col relative top-0  py-2 px-1  ">
        {/* Dates & Status */}
        <div>
          <div className="text-xs">
            <h3 className="font-semibold text-gray-400 mb-1">Application Date</h3>
            <p>
              {new Date(row.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>

          {getCvViewDate(row.statusTracker) !== "-" && (
            <div className="text-xs mt-3">
              <div>
                <span className="font-medium text-gray-600">CV Viewed By</span>
                <CreatedByDisplay row={getCvDownloadedById(row)} mode="updated" />
              </div>

              <h3 className="font-semibold text-gray-400 mb-1">CV Viewed Date</h3>
              <p className="mb-2">{getCvViewDate(row.statusTracker)}</p>
            </div>
          )}

          {row.status === "REJECTED" && (
            <div className="text-xs mt-3">
              <h3 className="font-semibold text-gray-400 mb-1">Rejected Date</h3>
              <p className="mb-2">
                {new Date(row?.rejectedByUserId?.actionDate || row?.updatedAt).toLocaleDateString(
                  "en-GB",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  }
                )}
              </p>
              <div className="mb-2">
                <span className="font-semibold text-gray-400 mb-1">Rejected By </span>
                <CreatedByDisplay row={getRejectedById(row)} mode="updated" key={row.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    ),
  },
];
