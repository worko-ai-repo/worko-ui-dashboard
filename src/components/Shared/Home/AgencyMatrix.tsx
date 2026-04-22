import React from "react";
import { Loader } from "lucide-react";
import { StatCard } from "@Components/Dashboard/Corporate/Home/StatCard";
import { useAppContext } from "@Context/App.context";
import { toTitleCase } from "@Utils/Titlecase.utils";
import { useQuery } from "@tanstack/react-query";

type DateRange = "7d" | "30d" | "90d" | "180d";

interface AgencyListResponseData {
  data:[], //define data here interface here
  pagination: {
    count: number,
    pageSize: number,
    sortOrder: string,
    timesQueried: number,
    queriedCount: number
  }
}

interface AgencyMatrixProps {
  companyIdOverride?: string;
  dateRange?: DateRange;
  recruiterId?:string;
  firstName?:string;
  lastName?:string;
}

type EvaluatorGroup = {
  evaluatorName: string;
  evaluatorEmail: string;
  candidates: [];//define data here interface here
};

const AgencyMatrix = ({ companyIdOverride, recruiterId, firstName, lastName }: AgencyMatrixProps) => {

  return (
    <div>
      <StatCard title="Agency Matrix" className="text-left h-full">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs text-slate-400">
            Agency-wise workload and candidate status tracking
          </p>
          
          <div className="flex items-center justify-center gap-3">

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search profiles..."
            className="px-3 py-1 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto relative">
          <div className="border max-h-[200px] overflow-y-auto border-slate-200 rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-blue-50">
                <tr className="text-left text-slate-700 border-b border-blue-200">
                  <th className="py-3 px-4 font-semibold">AGENCY NAME</th>
                  <th className="py-3 px-4 font-semibold">ROLE</th>
                  <th className="py-3 px-4 font-semibold">SUBMITTED</th>                  
                  <th className="py-3 px-4 font-semibold">IN-PROCESS</th>
                  <th className="py-3 px-4 font-semibold">HIRED</th>
                  <th className="py-3 px-4 font-semibold">REJECTED</th>
                  <th className="py-3 px-4 font-semibold">ROLE ASSIGNED DATE</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                    <td className="py-3 px-4 font-medium">
                    {toTitleCase("op agency")}
                    </td>
                    <td className="py-3 px-4 font-medium">
                    {toTitleCase("software developer")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("1")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("2")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("3")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("4")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("10-10-2024")}
                    </td>
                </tr>
                                <tr>
                    <td className="py-3 px-4 font-medium">
                    {toTitleCase("op agency")}
                    </td>
                    <td className="py-3 px-4 font-medium">
                    {toTitleCase("software developer")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("1")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("2")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("3")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("4")}
                    </td>

                    <td className="py-3 px-4">
                    {toTitleCase("10-10-2024")}
                    </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </StatCard>
    </div>
  );
};

export default AgencyMatrix;