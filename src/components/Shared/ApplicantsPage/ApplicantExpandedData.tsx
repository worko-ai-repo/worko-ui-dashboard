import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import React, { useState } from "react";
import Timeline from "../Timeline";
import CreatedByDisplay from "../PostJob/CreatedByDisplay";

interface ExpandedRowDetailsProps {
  row: JobApplicationDetailsDto;
  activeTab: string;
  jobApplicationServiceObj: any; // replace with proper type
  getCvViewDate: (statusTracker: any) => string;
  getCvDownloadedById: (row: any) => any;
  getRejectedById: (row: any) => any;
}

const ApplicantExpandedRowDetails: React.FC<ExpandedRowDetailsProps> = ({
  row,
  activeTab,
  jobApplicationServiceObj,
  getCvViewDate,
  getCvDownloadedById,
  getRejectedById,
}) => {
  const [isRejectionReasonExpanded, setIsRejectionReasonExpanded] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  // For Timeline view
  if (row.status === "JOINED" && activeTab === "Joined") {
    const timeLineProps = jobApplicationServiceObj.getTimelineDetails(row);
    return (
      <div className="p-4">
        <Timeline steps={timeLineProps} />
      </div>
    );
  }

  const workExperiences = row.applicantDetails.cvExtractParsed?.multipleCandidateExperience || [];
  const educations = row.applicantDetails.cvExtractParsed?.education || [];
  const showContactInfo = row.status !== "APPLIED";
  const about = row.applicantDetails.cvExtractParsed?.about || null;

  return (
    <div>
      {/* Main Grid - 3 columns */}
      <div className="grid grid-cols-7  gap-4 mb-1 text-left">
        {/* Column 1: Work Experience */}
        <div className="col-span-2">
          <h3 className="font-semibold text-gray-400 mb-1">Work Experience</h3>
          <div className="space-y-1">
            {workExperiences.length > 0 ? (
              workExperiences.slice(0, 3).map((exp, index) => (
                <div key={index} className="text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium line-clamp-2 flex-1">
                      {index + 1}. {exp.designation} at {exp.companyName}
                    </span>
                    <span className="text-gray-600 text-xs whitespace-nowrap flex-shrink-0">
                      {exp.startDate ? new Date(exp.startDate).getFullYear() : "N/A"} -{" "}
                      {exp.endDate && !isNaN(new Date(exp.endDate).getFullYear())
                        ? new Date(exp.endDate).getFullYear()
                        : "Present"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No experience listed</p>
            )}
            {workExperiences.length > 3 && (
              <button
                className="text-xs text-blue-600 hover:underline"
                title={workExperiences
                  .slice(3)
                  .map((exp, i) => `${i + 4}. ${exp.designation} at ${exp.companyName}`)
                  .join("\n")}>
                +{workExperiences.length - 3} more
              </button>
            )}
          </div>
        </div>

        {/* Column 2: Education */}
        <div className="col-span-2">
          <h3 className="font-semibold text-gray-400 mb-1">Education</h3>
          <div className="space-y-1">
            {educations.length > 0 ? (
              educations.slice(0, 3).map((edu, index) => (
                <div key={index} className="text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-medium line-clamp-2 flex-1">
                      {index + 1}. {edu.degree} at {edu.collage}
                    </span>
                    <span className="text-gray-600 text-xs whitespace-nowrap flex-shrink-0">
                      {edu.passingYear || "N/A"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500">No education listed</p>
            )}
            {educations.length > 3 && (
              <button
                className="text-xs text-blue-600 hover:underline"
                title={educations
                  .slice(3)
                  .map((edu, i) => `${i + 4}. ${edu.degree} at ${edu.collage}`)
                  .join("\n")}>
                +{educations.length - 3} more
              </button>
            )}
          </div>
        </div>

        {/* Column 3: Contact Info (conditionally shown) */}
        {showContactInfo && (
          <div>
            <h3 className="font-semibold text-gray-400 mb-1">Contact Information</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="break-all">{row.applicantDetails?.email || "Not provided"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Phone:</span>
                <p>{row.applicantDetails?.personalDetails?.phone || "Not provided"}</p>
              </div>
              {/* {row.applicantDetails?.1 && (
                <div>
                  <span className="font-medium text-gray-600">LinkedIn:</span>
                  <p className="break-all truncate">{row.applicantDetails.personalDetails.linkedin}</p>
                </div>
              )} */}
            </div>
          </div>
        )}

        {/* Location & ECTC */}
        <div className="space-y-3 text-xs">
          <div>
            <h3 className="font-semibold text-gray-400 mb-1">Location</h3>
            <p className="capitalize">{row.applicantDetails?.location || "Not Disclosed"}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-400 mb-1">ECTC</h3>
            <p className="capitalize">{row.applicantDetails?.ECTC || "Not Disclosed"}</p>
          </div>
        </div>
        {/* Secondary Grid - Application Details & Dates */}
        <div className="">
          {/* Application Date */}
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

          {/* CV View Date & Viewed By */}
          {getCvViewDate(row.statusTracker) !== "-" && (
            <div className="text-xs">
              <h3 className="font-semibold text-gray-400 mb-1">CV Viewed</h3>
              <p className="mb-2">{getCvViewDate(row.statusTracker)}</p>
              <div>
                <span className="font-medium text-gray-600">By: </span>
                <CreatedByDisplay row={getCvDownloadedById(row)} mode="updated" />
              </div>
            </div>
          )}

          {/* Rejection Details */}
          {row.status === "REJECTED" && (
            <div className="text-xs">
              <h3 className="font-semibold text-gray-400 mb-1">Rejected</h3>
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
                <span className="font-semibold text-gray-400 mb-1">Rejected By: </span>
                <CreatedByDisplay row={getRejectedById(row)} mode="updated" key={row.id} />
              </div>
            </div>
          )}
        </div>
      </div>

    <div className="grid grid-cols-2  gap-4 mb-1 text-left">

      {/* About Section - Full Width */}
      {about && (
        <div className="pt-4 text-left border-gray-200">
        <h3 className="font-semibold text-gray-400 mb-2">About</h3>
        <p className={`text-xs leading-relaxed ${isAboutExpanded ? "" : "line-clamp-3"}`}>
          {about}
        </p>
        {about.split(" ").length > 30 && (
          <button
            className="text-xs text-blue-600 hover:underline mt-1"
            onClick={() => setIsAboutExpanded(!isAboutExpanded)}
          >
            {isAboutExpanded ? "Read less" : "Read more"}
          </button>
        )}
        </div>
      )}

      {/* Rejection Reason - Full Width */}
      {/* {row.status === "REJECTED" && (
        <div className="text-left mt-4 border-gray-200">
        <h3 className="font-semibold text-gray-400 mb-2">Rejection Reason</h3>
        <div className="text-xs">
          {row.rejectedByUserId ? (
            <div className="space-y-2">
            <li className={`list-disc list-inside ${isRejectionReasonExpanded ? "" : "line-clamp-3"}`}>
              {row.rejectedByUserId.reason}
            </li>
            {row.rejectedByUserId.userComment && (
              <div>
                <span className="font-medium text-gray-600 block mt-2">Comment:</span>
                <li className={`list-disc list-inside ${isRejectionReasonExpanded ? "" : "line-clamp-3"}`}>
                {row.rejectedByUserId.userComment}
                </li>
              </div>
            )}
            {(row.rejectedByUserId.reason.split(" ").length > 30 ||
              (row.rejectedByUserId.userComment &&
                row.rejectedByUserId.userComment.split(" ").length > 30)) && (
              <button
                className="text-xs text-blue-600 hover:underline mt-1"
                onClick={() => setIsRejectionReasonExpanded(!isRejectionReasonExpanded)}
              >
                {isRejectionReasonExpanded ? "Read less" : "Read more"}
              </button>
            )}
            </div>
          ) : (
            <div>
            {jobApplicationServiceObj.getRejectionReason(row).length === 0 ? (
              <p className="text-gray-500">No reason provided</p>
            ) : (
              <ul className="space-y-1">
                {jobApplicationServiceObj
                .getRejectionReason(row)
                .map((reason: string, index: number) => (
                  <li
                    key={index}
                    className={`list-disc list-inside ${isRejectionReasonExpanded ? "" : "line-clamp-3"}`}
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            )}
            {jobApplicationServiceObj.getRejectionReason(row).length > 3 && (
              <button
                className="text-xs text-blue-600 hover:underline mt-1"
                onClick={() => setIsRejectionReasonExpanded(!isRejectionReasonExpanded)}
              >
                {isRejectionReasonExpanded ? "Read less" : "Read more"}
              </button>
            )}
            </div>
          )}
        </div>
        </div>
      )} */}
    </div>
    </div>
  );
};

export default ApplicantExpandedRowDetails;
