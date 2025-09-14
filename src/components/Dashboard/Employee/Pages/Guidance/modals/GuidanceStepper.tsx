import React, { FunctionComponent } from "react";

interface SimpleStepperProps {
  jobUrl?: string;
  guidanceRequestDescription?: string;
}

const GuidanceStepper: FunctionComponent<SimpleStepperProps> = ({
  jobUrl,
  guidanceRequestDescription,
}) => {
  if (!jobUrl && !guidanceRequestDescription) return null;

  return (
  <div className="flex justify-start gap-10 items-start px-4 py-3 bg-gray-50 rounded text-sm">
    {jobUrl && (
      <div className="flex flex-col gap-2">
        <span className="font-semibold">Job URL</span>
        <a
          href={jobUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline break-words"
        >
          Link
        </a>
      </div>
    )}
    {guidanceRequestDescription && (
      <div className="flex flex-col gap-2">
        <span className="font-semibold text-start">Requirement Detail</span>
        <span>{guidanceRequestDescription}</span>
      </div>
    )}
  </div>
);

};

export default GuidanceStepper;
