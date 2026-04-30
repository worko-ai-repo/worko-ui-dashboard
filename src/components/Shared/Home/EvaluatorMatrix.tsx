import React, { useEffect } from "react";
import { Loader } from "lucide-react";
import { StatCard } from "@Components/Dashboard/Corporate/Home/StatCard";
import httpServiceObj from "@Services/ApiHandler.service";
import { useAppContext } from "@Context/App.context";
import { EvaluationRequest } from "@TypesAndConstants/index";
import { toTitleCase } from "@Utils/Titlecase.utils";
import { useQuery } from "@tanstack/react-query";

type DateRange = "7d" | "30d" | "90d" | "180d";

interface EvaluationResponseData {
  data:EvaluationRequest[],
  pagination: {
    count: number,
    pageSize: number,
    sortOrder: string,
    timesQueried: number,
    queriedCount: number
  }
}

interface EvaluatorMatrixProps {
  companyIdOverride?: string;
  dateRange?: DateRange;
  recruiterId?:string;
  firstName?:string;
  lastName?:string;
}

type EvaluatorGroup = {
  evaluatorName: string;
  evaluatorEmail: string;
  candidates: EvaluationRequest[];
};

const EvaluatorMatrix = ({ companyIdOverride, recruiterId, firstName, lastName }: EvaluatorMatrixProps) => {
  const [search, setSearch] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = React.useState<string>("ALL");
  const {userDetails} = useAppContext()

  const selectedCompanyId = recruiterId || companyIdOverride || userDetails?.companyId;

  const {
    data: evaluationResponse,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["analyticsEvaluatorMatrixCompany", selectedCompanyId],
    enabled: !!selectedCompanyId,
    queryFn: async () => {
      const params = {
        pageSize: 200,
        sortOrder: "descending",
        dashboardType: "EVALUATOR",
        companyId: selectedCompanyId,
      };

      const { response, error } = await httpServiceObj.get<EvaluationResponseData>(
        `/request-evaluation/company`,
        true,
        params,
        false,
        "JOB"
      );

      if (error) {
        throw new Error(error.message || "Failed to fetch evaluator matrix data");
      }

      return response;
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const data = evaluationResponse?.data ?? [];

  const processedData = React.useMemo(() => {
    if (!data?.length) return [];

    if (data.some((item) => !item?.evaluatorDetails?.email)) {
      return [];
    }
    const grouped = data.reduce<Record<string, EvaluatorGroup>>((acc, item) => {
      const key = item.evaluatorDetails.email; // no optional now (based on your type)

      // 👉 FILTER BY SELECTED EVALUATOR HERE
      if (selectedEvaluator !== "ALL" && key !== selectedEvaluator) {
        return acc;
      }

      if (!acc[key]) {
        acc[key] = {
          evaluatorName: item.evaluatorDetails.name,
          evaluatorEmail: key,
          candidates: [],
        };
      }

      acc[key].candidates.push(item);

      return acc;
    }, {});

    return Object.values(grouped)
      .map((evaluator) => {
        let candidates = evaluator.candidates;

        if (search) {
          candidates = candidates.filter(
            (c) =>
              c.applicantName?.toLowerCase().includes(search.toLowerCase()) ||
              c.jobTitle?.toLowerCase().includes(search.toLowerCase())
          );
        }

        const pending = candidates.filter((c) => !c.evaluationResponseStatus);
        const rejected = candidates.filter((c) => c.evaluationResponseStatus === "REJECTED");
        const onHold = candidates.filter((c) => c.evaluationResponseStatus === "ON_HOLD");
        const scheduled = candidates.filter(
          (c) => c.evaluationResponseStatus === "INTERVIEW_SCHEDULED"
        );

        return {
          ...evaluator,
          hasData: candidates.length > 0,
          pendingProfiles: pending.map((c) => ({
            candidateName: `${c.applicantName}`,
            profileName: `${c.jobTitle}`,
            createdAt: c.createdAt,
          })),
          pendingCount: pending.length,
          rejectedCount: rejected.length,
          onHoldCount: onHold.length,
          scheduledCount: scheduled.length,
        };
      })
      .filter((e) => e.hasData);
  }, [data, search, selectedEvaluator]);

  const evaluatorOptions = React.useMemo(() => {
  if (!data) return [];

  const map = new Map();

  data.forEach((item) => {
    const email = item?.evaluatorDetails?.email;
    if (!email) return;
    if (!map.has(email)) {
      map.set(email, {
        name: item.evaluatorDetails.name,
        email,
      });
    }
  });

  return Array.from(map.values());
  }, [data]);

  const selectedEvaluatorName = React.useMemo(() => {
    if (selectedEvaluator === "ALL") return "All Evaluators";

    const found = evaluatorOptions.find(
      (e) => e.email === selectedEvaluator
    );

    return found ? toTitleCase(found.name) : "Select Evaluator";
  }, [selectedEvaluator, evaluatorOptions]);

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
      <StatCard title="Evaluator Matrix" className="text-left h-full">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-xs text-slate-400">
            Evaluator-wise workload and candidate status tracking
          </p>
          
          <div className="flex items-center justify-center gap-3">
          {/* <div className="flex flex-col min-w-[150px] justify-center">
            <select
              className="border border-slate-200 rounded-lg px-3 py-2 text-xs h-[34px] cursor-pointer"
              value={selectedEvaluator}
              onChange={(e) => {
                setSearch("");
                setSelectedEvaluator(e.target.value)
              }}
            >
              <option value="ALL">All evaluators</option>
              {evaluatorOptions.map((e) => (
                <option key={e.email} value={e.email}>
                  {toTitleCase(e.name)}
                </option>
              ))}
            </select>
          </div> */}
          <div ref={dropdownRef} className="relative w-[150px] min-w-[150px] max-w-[150px] z-[20]">
            <button
              type="button"
              className="border px-3 py-2 w-full text-xs rounded-lg truncate text-left"
              onClick={() => setIsOpen((prev) => !prev)}
            >
              {selectedEvaluatorName}
            </button>

            {isOpen && (
              <div className="text-xs absolute mt-1 w-full max-h-40 overflow-y-auto border bg-white rounded-lg shadow">
                <div
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => {
                    setSearch("");
                    setSelectedEvaluator("ALL");
                    setIsOpen(false);
                  }}
                >
                  All Evaluators
                </div>

                {evaluatorOptions.map((e) => (
                  <div
                    key={e.email}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setSearch("");
                      setSelectedEvaluator(e.email);
                      setIsOpen(false);
                    }}
                  >
                    {toTitleCase(e.name)}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search profiles..."
            className="px-3 py-1 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto relative">
          <div className="border max-h-[200px] overflow-y-auto border-slate-200 rounded-lg">
            <table className="min-w-full text-xs">
              <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-50 to-blue-50">
                <tr className="text-left text-slate-700 border-b border-blue-200">
                  <th className="py-3 px-4 font-semibold">RECRUITER NAME</th>
                  <th className="py-3 px-4 font-semibold">EVALUATOR NAME</th>
                  <th className="py-3 px-4 font-semibold">CANDIDATE NAME</th>                  
                  <th className="py-3 px-4 font-semibold">PROFILE NAME</th>
                  <th className="py-3 px-4 font-semibold">PENDING DURATION</th>
                </tr>
              </thead>

              <tbody>
                  {processedData.flatMap((evaluator) =>
                    evaluator.pendingProfiles?.length
                      ? evaluator.pendingProfiles.map((profile, i) => {
                          const daysPending = Math.floor(
                            (Date.now() - new Date(profile.createdAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          );

                          return (
                            <tr key={`${evaluator.evaluatorEmail}-${i}`}>
                              <td className="py-3 px-4 font-medium">
                                {toTitleCase(`${firstName ?? ""} ${lastName ?? ""}`)}
                              </td>
                              <td className="py-3 px-4 font-medium">
                                {toTitleCase(evaluator.evaluatorName)}
                              </td>

                              <td className="py-3 px-4">
                                {toTitleCase(profile.candidateName)}
                              </td>

                              <td className="py-3 px-4">
                                {toTitleCase(profile.profileName)}
                              </td>

                              <td className="py-3 px-4">
                                {daysPending} {daysPending === 1 ? "day" : "days"}
                              </td>
                            </tr>
                          );
                        })
                      : []
                  )}
                {!processedData.length && !isLoading && !isFetching && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No evaluator data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(isLoading || isFetching) && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
              <Loader className="animate-spin text-slate-400 h-8 w-8" />
            </div>
          )}
        </div>
      </StatCard>
    </div>
  );
};

export default EvaluatorMatrix;