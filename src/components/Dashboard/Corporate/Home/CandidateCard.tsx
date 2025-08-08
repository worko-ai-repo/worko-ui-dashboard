import React from "react";
import { CorporateHomeCandidateDto } from "@Interfaces/CorporateHomeDto";

interface CandidateCardProps {
  candidate: CorporateHomeCandidateDto;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="font-medium text-neutral-800">Candidate name</span>
        <span className="text-slate-400 min-w-32">{candidate.name}</span>
        <span className="font-medium text-neutral-800">CTC</span>
        <span className="text-slate-400">{candidate.ctc}</span>
        <span className="font-medium text-neutral-800">Email</span>
        <span className="text-slate-400 min-w-32">{candidate.email}</span>
        <span className="font-medium text-neutral-800">Phone no</span>
        <span className="text-slate-400">{candidate.phone}</span>
        <span className="font-medium text-neutral-800">Joining date</span>
        <span className="text-slate-400">{candidate.joiningDate}</span>
        <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors ml-auto">View Details</button>
      </div>
    </div>
  );
};
