import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import AnalyticsServiceObj from "@Services/Analytics.service";
import { HiringTrendResponse, HiringTrendPoint } from "@Interfaces/Analytics.dto";
import { useAppContext } from "@Context/App.context";
import * as d3 from "d3";

type TrendFilter = "weekly" | "monthly" | "yearly";

const FILTER_TO_GRANULARITY: Record<TrendFilter, "daily" | "weekly" | "monthly"> = {
  weekly: "daily",
  monthly: "weekly",
  yearly: "monthly",
};

const FILTER_TO_DATERANGE: Record<TrendFilter, "30d" | "90d" | "365d"> = {
  weekly: "30d",
  monthly: "90d",
  yearly: "365d",
};

const SERIES_COLORS = {
  jobs: "#0284C7",
  applications: "#22C55E",
  hires: "#F97316",
};

interface HiringTrendProps {
  dateRange: "7d" | "30d" | "90d" | "180d";
  jobStatus: "ALL" | "PUBLISHED";
  companyIdOverride?: string;
  recruiterIdOverride?: string;
}

const HiringTrend: React.FC<HiringTrendProps> = ({
  dateRange,
  jobStatus,
  companyIdOverride,
  recruiterIdOverride,
}) => {
  const { userDetails } = useAppContext();
  const defaultCompanyId = userDetails?.companyId;
  const companyId = companyIdOverride ?? defaultCompanyId;

  const { data } = useQuery<HiringTrendResponse>({
    queryKey: [
      "analyticsHiringTrend",
      companyId,
      recruiterIdOverride,
      dateRange,
      jobStatus,
    ],
    // enabled: !!companyId,
    queryFn: () =>
      AnalyticsServiceObj.getHiringTrend({
        companyId,
        recruiterId: recruiterIdOverride,
        granularity: "monthly",
        dateRange,
        jobStatus,
      }),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const svgRef = useRef<SVGSVGElement | null>(null);

  const chartData = useMemo(() => {
    const points = data?.points ?? [];
    if (!points.length) {
      return { labels: [] as string[], jobs: [], applications: [], hires: [] };
    }

    const formatLabel = (isoDate: string) => {
      const d = new Date(isoDate);
      return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    };

    const labels = points.map((p) => formatLabel(p.periodStart));
    const jobs = points.map((p) => p.jobsPosted);
    const applications = points.map((p) => p.applications);
    const hires = points.map((p) => p.hires);

    return { labels, jobs, applications, hires };
  }, [data]);

  useEffect(() => {
    if (!svgRef.current) return;

    const { labels, jobs, applications, hires } = chartData;
    const hasData = labels.length > 0;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 220;
    const margin = { top: 16, right: 24, bottom: 40, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (!hasData) {
      g
        .append("text")
        .attr("x", innerWidth / 2.6)
        .attr("y", innerHeight / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#9CA3AF")
        .style("font-size", "12px")
        .text("No hiring trend data available.");
      return;
    }

    const xScale = d3
      .scalePoint<string>()
      .domain(labels)
      .range([0, innerWidth])
      .padding(0.5);

    const maxY = d3.max([...jobs, ...applications, ...hires]) ?? 0;
    const yScale = d3
      .scaleLinear()
      .domain([0, maxY || 1])
      .nice()
      .range([innerHeight, 0]);

    const yTicks = yScale.ticks(5);
    g.selectAll(".grid-line")
      .data(yTicks)
      .enter()
      .append("line")
      .attr("class", "grid-line")
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("stroke", "#e2e8f0")
      .attr("stroke-width", 1);

    type SeriesKey = "jobs" | "applications" | "hires";
    const series: { key: SeriesKey; color: string; values: number[] }[] = [
      { key: "jobs", color: SERIES_COLORS.jobs, values: jobs },
      { key: "applications", color: SERIES_COLORS.applications, values: applications },
      { key: "hires", color: SERIES_COLORS.hires, values: hires },
    ];

    const lineGenerator = d3
      .line<{ label: string; value: number }>()
      .x((d) => xScale(d.label) ?? 0)
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    series.forEach((serie) => {
      const lineData = labels.map((label, idx) => ({
        label,
        value: serie.values[idx] ?? 0,
      }));

      const path = g
        .append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", serie.color)
        .attr("stroke-width", 2)
        .attr("d", lineGenerator as any);

      const totalLength = (path.node() as SVGPathElement | null)?.getTotalLength() ?? 0;
      if (totalLength > 0) {
        path
          .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
          .attr("stroke-dashoffset", totalLength)
          .transition()
          .duration(1200)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0);
      }

      // Add circles with tooltips and hover effects
      const circles = g
        .selectAll(`.dot-${serie.key}`)
        .data(lineData)
        .enter()
        .append("circle")
        .attr("class", `dot-${serie.key}`)
        .attr("cx", (d) => xScale(d.label) ?? 0)
        .attr("cy", (d) => yScale(d.value))
        .attr("r", 3)
        .attr("fill", serie.color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          d3.select(this)
            .attr("r", 5)
            .attr("stroke-width", 2);
        })
        .on("mouseout", function () {
          d3.select(this)
            .attr("r", 3)
            .attr("stroke-width", 1);
        });

      // Add tooltips (title element)
      circles
        .append("title")
        .text((d) => {
          const label = serie.key === "jobs" ? "Jobs" : serie.key === "applications" ? "Applications" : "Hires";
          return `${label}: ${d.value}`;
        });
    });

    g
      .append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#94A3B8");

    g
      .append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .selectAll("text")
      .style("font-size", "11px")
      .style("fill", "#94A3B8");

    g.selectAll(".domain").attr("stroke", "#CBD5E1");
    g.selectAll(".tick line").attr("stroke", "#E5E7EB");
  }, [chartData]);

  return (
    <div className="flex bg-white rounded-xl shadow-xl p-4 flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-left">
          <p className="text-lg font-semibold text-slate-700">Hiring trend</p>
          <p className="text-xs text-slate-400">
            Jobs, applications & hires over time
          </p>
        </div>
      </div>


      <div className="w-full  h-56 mb-2">
        <svg ref={svgRef} className="w-full h-full overflow-visible" />
      
        <div className="flex justify-center items-center gap-4 text-xs text-slate-500 mb-2">
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: SERIES_COLORS.jobs }}
          />
          Jobs posted
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: SERIES_COLORS.applications }}
          />
          Applications
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: SERIES_COLORS.hires }}
          />
          Hires
        </div>
      </div>
      </div>
    </div>
  );
};

export default HiringTrend;
