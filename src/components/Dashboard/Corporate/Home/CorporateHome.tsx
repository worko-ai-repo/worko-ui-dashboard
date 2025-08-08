import HeaderDetails from "../../../Shared/Stats";

import { StatCard } from "./StatCard";
import { BarChart } from "@Components/Charts/LineGraph";
import { DonutChart } from "@Components/Charts/DonughtChart";
import { ChartLegend } from "./ChartLegend";
import { InterviewTable } from "./InterviewTable";
import { mockJobListings, mockCandidates, mockInterviews, mockEvaluations, chartData, pieChartData } from "./CorporateData";
import { JobListingCard } from "./JobListingCard";
import { CandidateCard } from "./CandidateCard";
import { EvaluationCard } from "./EvaluationCard";

const CorporateHome = () => {
  return (
    <>
      <div className="flex flex-col  gap-4  lg:gap-24 justify-between">
        <div className=" flex-1 flex flex-col gap-4 ">
          <div className="flex flex-col w-fit gap-4 justify-start">
            <HeaderDetails />
            <div className="min-h-screen">
              <div className=" mx-auto space-y-8">
                {/* Top Row - Charts */}
                <div className=" grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Hired Applicants Chart */}
                  <StatCard title="Hired applicants" className="lg:col-span-1 h-full ">
                    <div className="aspect-w-16 aspect-h-9">
                      <BarChart data={chartData} />
                    </div>
                  </StatCard>

                  {/* Joined Applicants Donut Chart */}
                  <StatCard title="Joined applicants" className="lg:col-span-1 h-full">
                    <div className="flex flex-col items-center aspect-w-16 aspect-h-9">
                      <DonutChart data={pieChartData} />
                      <ChartLegend data={pieChartData} />
                    </div>
                  </StatCard>

                  {/* Upcoming Interviews */}
                  <div className="lg:col-span-1 h-full">
                    <InterviewTable interviews={mockInterviews} />
                  </div>
                </div>

                {/* Middle Row - Job Listings and Hired Candidates */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Live Jobs */}
                  <StatCard title="Live Jobs" className="h-full">
                    <div className="space-y-3">
                      {mockJobListings.map((job) => (
                        <JobListingCard key={job.id} job={job} />
                      ))}
                    </div>
                    <div className="text-center mt-4">
                      <button className="text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors">View more</button>
                    </div>
                  </StatCard>

                  {/* Hired Candidates */}
                  <StatCard title="Hired candidates" className="h-full">
                    <div className="space-y-3">
                      {mockCandidates.map((candidate) => (
                        <CandidateCard key={candidate.id} candidate={candidate} />
                      ))}
                    </div>
                    <div className="text-center mt-4">
                      <button className="text-blue-600 text-xs font-medium hover:text-blue-700 transition-colors">View more</button>
                    </div>
                  </StatCard>
                </div>

                {/* Bottom Row - Evaluations */}
                <StatCard title="Evaluations pending" className="h-full">
                  <div className="space-y-3">
                    {mockEvaluations.map((evaluation) => (
                      <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                    ))}
                  </div>
                </StatCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CorporateHome;
