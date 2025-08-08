import React from "react";
import { FileText, Gauge, Send } from "lucide-react";
import { CorporateHomeEvaluationDto } from "@Interfaces/CorporateHomeDto";
import ProgressCircle from "@Components/Shared/CircularBar";

interface EvaluationCardProps {
  evaluation: CorporateHomeEvaluationDto;
}

export const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluation }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getCircleColor = (score: number) => {
    if (score >= 80) return "bg-emerald-400";
    if (score >= 60) return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all hover:shadow-md hover:border-gray-200">
      <div className="flex items-center gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          <span className="font-medium text-neutral-800">Candidate name</span>
          <span className="text-slate-400 min-w-32">{evaluation.candidateName}</span>
          <span className="font-medium text-neutral-800">Evaluator name</span>
          <span className="text-slate-400 min-w-40">{evaluation.evaluatorNames.join(" | ")}</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-violet-100 rounded-full"></div>
            <span className="text-blue-600 text-[8px] font-medium">{evaluation.evaluatorCount}</span>
          </div>
          <span className="font-medium text-neutral-800">Email</span>
          <span className="text-slate-400 min-w-32">{evaluation.email}</span>
          <span className="font-medium text-neutral-800">Phone no</span>
          <span className="text-slate-400">{evaluation.phone}</span>
          <span className="font-medium text-neutral-800">Date</span>
          <span className="text-slate-400">{evaluation.dates.join(" | ")}</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-violet-100 rounded-full"></div>
            <span className="text-blue-600 text-[8px] font-medium">{evaluation.evaluatorCount}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 mx-4">
{/*           <div className={`text-[10px] font-semibold ${getScoreColor(evaluation.score)}`}>{evaluation.score}%</div>
 */}         {/*  <div className="relative"> */}
           
           {/*  <div
              className={`absolute top-0 w-9 h-9 rounded-full ${getCircleColor(evaluation.score)}`}
              style={{
                clipPath: `polygon(50% 50%, 50% 0%, ${50 + (evaluation.score / 100) * 50}% 0%, ${50 + (evaluation.score / 100) * 50}% 100%, 50% 100%)`,
              }}></div> */}
            <ProgressCircle 
              value={evaluation.score} 
              onClick={() => console.log("ProgressCircle clicked")} 
            />
          </div>
          {/* <div className="text-zinc-500 text-[8px] font-semibold">View details</div>
        </div> */}

        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-2 bg-gradient-to-l from-blue-600/30 to-sky-400/30 text-white text-xs font-semibold rounded-lg hover:from-blue-600/40 hover:to-sky-400/40 transition-all">
            <FileText size={16} />
            View CV
          </button>
          <button className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            <Send size={14} />
            Send for evaluation
          </button>
        </div>
      </div>
    </div>
  );
};
