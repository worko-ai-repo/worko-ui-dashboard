import React, { useEffect } from "react";
import { Loader } from "lucide-react";
import { StatCard } from "@Components/Dashboard/Corporate/Home/StatCard";
import { useAppContext } from "@Context/App.context";
import { toTitleCase } from "@Utils/Titlecase.utils";
import { useQuery } from "@tanstack/react-query";
import httpServiceObj from "@Services/ApiHandler.service";
import { AgencyRequest } from "@TypesAndConstants/index";

type DateRange = "7d" | "30d" | "90d" | "180d";

interface AgencyListResponseData {
  data: AgencyRequest[];
  pagination: {
    count: number;
    pageSize: number;
    sortOrder: string;
    timesQueried: number;
    queriedCount: number;
  };
}

interface AgencyMatrixProps {
  companyIdOverride?: string;
  dateRange?: DateRange;
  recruiterId?: string;
  firstName?: string;
  lastName?: string;
}

type AgencyGroup = {
  agencyName: string;
  agencyId: string;
  agency: AgencyRequest[];
};

const AgencyMatrix = ({
  companyIdOverride,
  recruiterId,
  firstName,
  lastName,
}: AgencyMatrixProps) => {
  const [search, setSearch] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = React.useState<string>("ALL");
  const { userDetails } = useAppContext();

  const selectedCompanyId = companyIdOverride || userDetails?.companyId;

  const { data: agencyResponse, isLoading, isFetching } = useQuery({
    queryKey: ["analyticsAgencyMatrixCompany", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const params = {
        pageSize: 200,
        companyId: selectedCompanyId,
      };

      const { response, error } =
        await httpServiceObj.get<AgencyListResponseData>(
          "/analytics/agency-performance-matrix",
          true,
          params,
          false,
          "AGENCY"
        );

      if (error) {
        throw new Error(error.message);
      }

      return response;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const data = agencyResponse?.data ?? [];

  const processedData = React.useMemo(() => {
    if (!data?.length) return [];

    if (data.some((item) => !item?.agencyId)) {
      return [];
    }
    const grouped = data.reduce<Record<string, AgencyGroup>>((acc, item) => {
      const key = item.agencyId;

      if (selectedEvaluator !== "ALL" && key !== selectedEvaluator) {
        return acc;
      }

      if (!acc[key]) {
        acc[key] = {
          agencyName: item.agencyName,
          agencyId: key,
          agency: [],
        };
      }

      acc[key].agency.push(item);

      return acc;
    }, {});

    return Object.values(grouped)
      .map((evaluator) => {
        let agency = evaluator.agency;

        if (search) {
          agency = agency.filter(
            (c) =>
              c.agencyName?.toLowerCase().includes(search.toLowerCase()) ||
              c.jobTitle?.toLowerCase().includes(search.toLowerCase())
          );
        }

        return {
          ...evaluator,
          agency, // ✅ THIS LINE WAS MISSING
          hasData: agency.length > 0,

          totalCandidates: agency.reduce((sum, c) => sum + (c.totalCandidates || 0), 0),
          submittedCount: agency.reduce((sum, c) => sum + (c.submittedCount || 0), 0),
          rejectedCount: agency.reduce((sum, c) => sum + (c.rejectedCount || 0), 0),
          inProcessCount: agency.reduce((sum, c) => sum + (c.inProcessCount || 0), 0),
          acceptedCount: agency.reduce((sum, c) => sum + (c.acceptedCount || 0), 0),
          hiredCount: agency.reduce((sum, c) => sum + (c.hiredCount || 0), 0),
        };
      })
      .filter((e) => e.hasData);
  }, [data, search, selectedEvaluator]);

  const agencyOptions = React.useMemo(() => {
    if (!data) return [];

    const map = new Map();

    data.forEach((item) => {
      const agencyId = item?.agencyId;
      if (!agencyId) return;
      if (!map.has(agencyId)) {
        map.set(agencyId, {
          name: item?.agencyName,
          agencyId,
        });
      }
    });

    return Array.from(map.values());
  }, [data]);

  const selectedAgencyName = React.useMemo(() => {
    if (selectedEvaluator === "ALL") return "All Agency";

    const found = agencyOptions.find((a) => a.agencyId === selectedEvaluator);

    return found ? toTitleCase(found.name) : "Select Agency";
  }, [selectedEvaluator, agencyOptions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      <StatCard title="Agency Matrix" className="text-left h-full">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs text-slate-400">
            Agency-wise workload and candidate status tracking
          </p>

          <div className="flex items-center justify-center gap-3">
            <div
              ref={dropdownRef}
              className="relative w-[150px] min-w-[150px] max-w-[150px] z-[20]">
              <button
                type="button"
                className="border px-3 py-2 w-full text-xs rounded-lg truncate text-left"
                onClick={() => setIsOpen((prev) => !prev)}>
                {selectedAgencyName}
              </button>

              {isOpen && (
                <div className="text-xs absolute mt-1 w-full max-h-40 overflow-y-auto border bg-white rounded-lg shadow">
                  <div
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSearch("");
                      setSelectedEvaluator("ALL");
                      setIsOpen(false);
                    }}>
                    All Agency
                  </div>

                  {agencyOptions.map((e) => (
                    <div
                      key={e.agencyId}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        setSearch("");
                        setSelectedEvaluator(e.agencyId);
                        setIsOpen(false);
                      }}>
                      {toTitleCase(e.name)}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* SEARCH */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                {processedData.flatMap((agency) =>
                  agency.agency.map((job, i) => {
                    return (
                      <tr key={`${agency.agencyId}-${job.jobId}-${i}`}>
                        <td className="py-3 px-4 font-medium">{toTitleCase(agency.agencyName)}</td>

                        <td className="py-3 px-4 font-medium">{toTitleCase(job.jobTitle)}</td>

                        <td className="py-3 px-4">{job.submittedCount ?? 0}</td>

                        <td className="py-3 px-4">{job.inProcessCount ?? 0}</td>

                        <td className="py-3 px-4">{job.hiredCount ?? 0}</td>

                        <td className="py-3 px-4">{job.rejectedCount ?? 0}</td>

                        <td className="py-3 px-4">
                          {new Date(job.jobAssignedDate).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}

                {!processedData.length && !isLoading && !isFetching && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No agency data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </StatCard>
    </div>
  );
};

export default AgencyMatrix;
