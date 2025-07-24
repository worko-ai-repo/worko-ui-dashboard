import React from "react";
import { CorporateHomePieChartDataDto } from "@Interfaces/CorporateHomeDto"; 

interface ChartLegendProps {
  data: CorporateHomePieChartDataDto[];
}

export const ChartLegend: React.FC<ChartLegendProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
      {data.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
          <span className="text-xs font-medium text-slate-400 font-['Poppins']">{item.label}</span>
        </div>
      ))}
    </div>
  );
};
