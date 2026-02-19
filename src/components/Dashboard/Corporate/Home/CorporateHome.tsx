import { useMemo } from "react";
import HeaderDetails from "../../../Shared/Stats";

import { StatCard } from "./StatCard";
import { BarChart } from "@Components/Charts/LineGraph";
import { DonutChart } from "@Components/Charts/DonughtChart";
import { ChartLegend } from "./ChartLegend";
import { InterviewTable } from "./InterviewTable";
import { JobListingCard } from "./JobListingCard";
import { CandidateCard } from "./CandidateCard";
import { EvaluationCard } from "./EvaluationCard";
import { useQuery } from "@tanstack/react-query";
import { useAppContext } from "@Context/App.context";
import CorporateServiceObj from "../Services/Corporate.service";
import { CorporateHomeData } from "./CorporateData";

const CorporateHome = () => {
  /**
   * Fetch corporate home data from the API
   */
  const { userDetails } = useAppContext();

  const companyId = userDetails?.companyId;

  /**
   * Initialize the CorporateHomeData helper once the companyId
   * is available from context. This mirrors how other modules
   * (like Admin jobs) use a data/service layer to talk to APIs.
   */
  const corporateHomeData = useMemo(
    () => (companyId ? new CorporateHomeData(companyId) : null),
    [companyId]
  );

  async function fetchCorporateHomeData() {
    try {
      if (!companyId) {
        throw new Error("Company ID is not available");
      }
      const data = await CorporateServiceObj.getCompanyDetails(companyId);
      if (!data) {
        throw new Error("No data found");
      }
      return data;
    } catch (error) {
      console.error("Error fetching corporate home data:", error);
      throw error;
    }
  }

  const { data: companyDetails, error } = useQuery({
    queryKey: ["corporateHomeData", companyId],
    queryFn: fetchCorporateHomeData,
    enabled: !!companyId,
  });

  /**
   * Fetch dashboard-specific data for Corporate Home using
   * the CorporateHomeData class. These use the Corporate
   * service APIs under the hood where available.
   */
  const { data: jobListings = [] } = useQuery({
    queryKey: ["corporateHomeJobListings", companyId],
    queryFn: () => corporateHomeData!.getJobListings(),
    enabled: !!corporateHomeData,
  });

  const { data: candidates = [] } = useQuery({
    queryKey: ["corporateHomeCandidates", companyId],
    queryFn: () => corporateHomeData!.getCandidates(),
    enabled: !!corporateHomeData,
  });

  const { data: interviews = [] } = useQuery({
    queryKey: ["corporateHomeInterviews", companyId],
    queryFn: () => corporateHomeData!.getInterviews(),
    enabled: !!corporateHomeData,
  });

  const { data: evaluations = [] } = useQuery({
    queryKey: ["corporateHomeEvaluations", companyId],
    queryFn: () => corporateHomeData!.getEvaluations(),
    enabled: !!corporateHomeData,
  });

  const { data: barChartData = [] } = useQuery({
    queryKey: ["corporateHomeChartData", companyId],
    queryFn: () => corporateHomeData!.getChartData(),
    enabled: !!corporateHomeData,
  });

  const { data: donutChartData = [] } = useQuery({
    queryKey: ["corporateHomePieChartData", companyId],
    queryFn: () => corporateHomeData!.getPieChartData(),
    enabled: !!corporateHomeData,
  });
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
                      <BarChart data={barChartData} />
                    </div>
                  </StatCard>

                  {/* Joined Applicants Donut Chart */}
                  <StatCard title="Joined applicants" className="lg:col-span-1 h-full">
                    <div className="flex flex-col items-center aspect-w-16 aspect-h-9">
                      <DonutChart data={donutChartData} />
                      <ChartLegend data={donutChartData} />
                    </div>
                  </StatCard>

                  {/* Upcoming Interviews */}
                  <div className="lg:col-span-1 h-full">
                    <InterviewTable interviews={interviews} />
                  </div>
                </div>

                {/* Middle Row - Job Listings and Hired Candidates */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Live Jobs */}
                  <StatCard title="Live Jobs" className="h-full">
                    <div className="space-y-3">
                      {jobListings.map((job) => (
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
                      {candidates.map((candidate) => (
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
                    {evaluations.map((evaluation) => (
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
