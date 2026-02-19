import React, { useMemo, useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { StatCard } from "@Components/Dashboard/Corporate/Home/StatCard";
import { BarChart } from "@Components/Charts/LineGraph";
import { useAppContext } from "@Context/App.context";
import AnalyticsServiceObj from "@Services/Analytics.service";
import { FunnelVelocityResponse } from "@Interfaces/Analytics.dto";
import { CorporateHomeChartDataDto } from "@Interfaces/CorporateHomeDto";

interface FunnelVelocityProps {
  companyId?: string;
  recruiterId?: string;
  jobIds?: string[];
  dateRange?: "7d" | "30d" | "90d" | "180d";
  jobStatus?: "ALL" | "PUBLISHED";
}

const FunnelVelocity: React.FC<FunnelVelocityProps> = ({
  companyId: propCompanyId,
  recruiterId,
  jobIds,
  dateRange,
  jobStatus,
}) => {
  const { userDetails } = useAppContext();
  const location = useLocation();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);

  // Check if we're on corporate page by checking URL
  const isCorporatePage =
    location.pathname.includes("/v1/corporate/home") || location.pathname.includes("corporate");

  // If on corporate page, use userDetails companyId as mandatory, otherwise use prop
  const companyId = isCorporatePage ? userDetails?.companyId : propCompanyId;

  const { data: funnelData, isLoading } = useQuery<FunnelVelocityResponse | null>({
    queryKey: ["analyticsFunnelVelocity", companyId, recruiterId, jobIds, dateRange, jobStatus],
    queryFn: () =>
      AnalyticsServiceObj.getFunnelVelocityAggregate({
        companyId,
        recruiterId,
        jobIds,
        dateRange,
        jobStatus,
      }),
    enabled: isCorporatePage ? !!companyId : true,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Define the stage progression we want to display
  const STAGE_PROGRESSION = [
    { from: 'APPLIED', to: 'ACCEPTED', label: 'Accepted' },
    { from: 'ACCEPTED', to: 'UNDER_EVALUATION', label: 'Evaluation' },
    { from: 'UNDER_EVALUATION', to: 'PROCESSING_INTERVIEW', label: 'Interview' },
    { from: 'PROCESSING_INTERVIEW', to: 'OFFER_SENT', label: 'Offer' },
    { from: 'OFFER_SENT', to: 'JOINED', label: 'Joined' },
  ];

  // Handle responsive chart width
  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Transform stage breakdown data for line chart - only include the specific progression
  const chartData: CorporateHomeChartDataDto[] = useMemo(() => {
    if (!funnelData?.stageBreakdown) return [];

    return STAGE_PROGRESSION.map((stageConfig) => {
      const stage = funnelData.stageBreakdown.find(
        (s) => s.fromStatus === stageConfig.from && s.toStatus === stageConfig.to
      );
      
      return {
        year: stageConfig.label,
        value: stage ? Math.round(stage.averageDays * 10) / 10 : 0,
      };
    });
  }, [funnelData]);

  // Calculate median time from the progression stages
  const medianTime = useMemo(() => {
    if (!funnelData?.stageBreakdown) return 0;

    const relevantStages = STAGE_PROGRESSION.map((stageConfig) => 
      funnelData.stageBreakdown.find(
        (s) => s.fromStatus === stageConfig.from && s.toStatus === stageConfig.to
      )
    ).filter((s) => s !== undefined);

    if (relevantStages.length === 0) return 0;

    const sortedMedians = relevantStages
      .map((stage) => stage!.medianDays)
      .sort((a, b) => a - b);

    const mid = Math.floor(sortedMedians.length / 2);
    return sortedMedians.length % 2 === 0
      ? (sortedMedians[mid - 1] + sortedMedians[mid]) / 2
      : sortedMedians[mid];
  }, [funnelData]);

  if (isLoading) {
    return (
      <StatCard title="Funnel Velocity (Avg. Days Per Stage)" className="bc text-left h-full">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 text-sm">Loading funnel velocity data...</div>
        </div>
      </StatCard>
    );
  }

  if (!funnelData /* || chartData.every(d => d.value === 0) */) {
    return (
      <StatCard title="Funnel Velocity (Avg. Days Per Stage)" className="text-left h-full">
        <div className="flex items-center justify-center h-fit">
          <div className="text-slate-400 text-sm">No funnel velocity data available</div>
        </div>
      </StatCard>
    );
  }

  return (
    <StatCard title="Funnel Velocity (Avg. Days Per Stage)" className="text-left h-full">
      {/* Top right stats */}
      <div className="flex justify-end gap-6 mb-4">
        <div className="text-right">
          <p className="text-xs text-slate-500">Total Candidates</p>
          <p className="text-2xl font-semibold text-slate-800">
            {funnelData.applicationsAnalyzed}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Median Time</p>
          <p className="text-2xl font-semibold text-blue-600">
            {medianTime.toFixed(1)}d
          </p>
        </div>
      </div>

      {/* Line chart */}
      <div ref={chartContainerRef} className="mb-0 w-full ">
        <div className="w-full" style={{ minHeight: '400px' }}>
          <BarChart data={chartData} width={chartWidth} height={300} />
        </div>
      </div>

    </StatCard>
  );
};

export default FunnelVelocity;
