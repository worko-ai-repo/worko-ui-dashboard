import React from "react";
import { CorporateHomeJobListingDto } from "@Interfaces/CorporateHomeDto";

interface JobListingCardProps {
  job: CorporateHomeJobListingDto;
}

export const JobListingCard: React.FC<JobListingCardProps> = ({ job }) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200">
      <div className="flex items-center gap-4">
        <img src={job.image} alt={job.title} className="w-11 h-11 rounded-xl object-cover" />
        <div className="flex-1 grid grid-cols-4 gap-4 text-xs">
          <div>
            <div className="font-medium text-neutral-800 mb-1">Job title</div>
            <div className="text-slate-400">{job.title}</div>
          </div>
          <div>
            <div className="font-medium text-neutral-800 mb-1">CTC</div>
            <div className="text-slate-400">{job.ctc}</div>
          </div>
          <div>
            <div className="font-medium text-neutral-800 mb-1">Location</div>
            <div className="text-slate-400">{job.location}</div>
          </div>
          <div>
            <div className="font-medium text-neutral-800 mb-1">Total applied</div>
            <div className="text-slate-400">
              {job.totalApplied}/{job.maxApplicants}
            </div>
          </div>
        </div>
        <button className="text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors">View Details</button>
      </div>
    </div>
  );
};
