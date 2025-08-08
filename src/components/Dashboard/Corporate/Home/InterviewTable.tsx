import { CorporateHomeInterviewDto } from "@Interfaces/CorporateHomeDto";
import React from "react";

interface InterviewTableProps {
  interviews: CorporateHomeInterviewDto[];
}

export const InterviewTable: React.FC<InterviewTableProps> = ({ interviews }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-700 font-['Poppins']">Upcoming interviews</h3>
        <button className="px-6 py-2 bg-blue-500 text-white text-[10px] font-bold rounded-md hover:bg-blue-600 transition-colors">View all</button>
      </div>

      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-xs font-normal text-slate-400 font-['Poppins']">Job title</th>
              <th className="text-left py-2 text-xs font-normal text-slate-400 font-['Poppins']">Date created</th>
              <th className="text-left py-2 text-xs font-normal text-slate-400 font-['Poppins']">Name</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((interview) => (
              <tr key={interview.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="py-3 text-left ">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-100 rounded-full overflow-hidden">
                      <img src={interview.image} alt={interview.jobTitle} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-xs text-slate-700 font-['Poppins']">{interview.jobTitle}</span>
                  </div>
                </td>
                <td className="py-3 text-left ">
                  <span className="text-xs text-slate-700 font-['Poppins']">{interview.dateCreated}</span>
                </td>
                <td className="py-3 text-left ">
                  <span className="text-xs text-slate-700 font-['Poppins']">{interview.candidateName}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
