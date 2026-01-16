import {
  CorporateHomeCandidateDto,
  CorporateHomeChartDataDto,
  CorporateHomeEvaluationDto,
  CorporateHomeInterviewDto,
  CorporateHomeJobListingDto,
  CorporateHomePieChartDataDto,
} from "@Interfaces/CorporateHomeDto";
import CorporateServiceObj from "../Services/Corporate.service";

export const mockJobListings: CorporateHomeJobListingDto[] = [
  {
    id: "1",
    title: "Business Developer",
    description: "Business developer",
    ctc: "5 LPA",
    location: "Ahmedabad",
    totalApplied: 20,
    maxApplicants: 22,
    image:
      "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
  },
  {
    id: "2",
    title: "Software Engineer",
    description: "Full-stack developer",
    ctc: "8 LPA",
    location: "Bangalore",
    totalApplied: 15,
    maxApplicants: 25,
    image:
      "https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
  },
  {
    id: "3",
    title: "Product Manager",
    description: "Product strategy and management",
    ctc: "12 LPA",
    location: "Mumbai",
    totalApplied: 8,
    maxApplicants: 15,
    image:
      "https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop",
  },
];

export class CorporateHomeData {
  private companyId: string;

  constructor(companyId: string) {
    this.companyId = companyId;
  }

  /**
   * getJobListings
   *
   * @description
   * Uses the existing `CorporateServiceObj.fetchJobs` API to fetch jobs
   * for the given company and maps them into `CorporateHomeJobListingDto`
   * so they can be directly consumed in the Corporate Home UI.
   */
  async getJobListings(): Promise<CorporateHomeJobListingDto[]> {
    try {
      const params = {
        pageSize: 5,
        sortOrder: "desc",
        dashboard: "CORPORATE",
        status: "PUBLISHED",
        companyId: this.companyId,
      };

      const response = await CorporateServiceObj.fetchJobs(params);
      const jobs = response?.data ?? [];

      return jobs.map((job) => ({
        id: job.id,
        title: job.jobTitle,
        description: job.jobDescription || job.htmlJobDescription || "",
        ctc:
          job.salaryRange && job.salaryRange.min != null && job.salaryRange.max != null
            ? `${job.salaryRange.min}-${job.salaryRange.max} LPA`
            : "",
        location: job.location?.fullLocation?.[0] || job.location?.city?.[0] || "",
        totalApplied: job.countCompanyJob?.allJobApplicationCounts?.total ?? 0,
        maxApplicants: job.numOfOpenings ?? 0,
        image: job.companyDetails?.logoUrl || job.companyDetails?.logo || "",
      }));
    } catch (error) {
      console.error("[CorporateHomeData]: Error fetching job listings:", error);
      // Fail gracefully with an empty list to avoid breaking the dashboard.
      return [];
    }
  }

  async getCandidates(): Promise<CorporateHomeCandidateDto[]> {
    return mockCandidates;
  }

  async getEvaluations(): Promise<CorporateHomeEvaluationDto[]> {
    return mockEvaluations;
  }
  async getInterviews(): Promise<CorporateHomeInterviewDto[]> {
    return mockInterviews;
  }
  async getChartData(): Promise<CorporateHomeChartDataDto[]> {
    return chartData;
  }
  async getPieChartData(): Promise<CorporateHomePieChartDataDto[]> {
    return pieChartData;
  }
}

export const mockCandidates: CorporateHomeCandidateDto[] = [
  {
    id: "1",
    name: "Avijit Dutta Gupta",
    email: "avijitduttagupta51@gmail.com",
    phone: "9831688541",
    ctc: "5 LPA",
    joiningDate: "24-05-2025",
  },
  {
    id: "2",
    name: "Priya Sharma",
    email: "priya.sharma@gmail.com",
    phone: "9876543210",
    ctc: "6 LPA",
    joiningDate: "15-06-2025",
  },
  {
    id: "3",
    name: "Rahul Kumar",
    email: "rahul.kumar@gmail.com",
    phone: "9123456789",
    ctc: "7 LPA",
    joiningDate: "01-07-2025",
  },
  {
    id: "4",
    name: "Sneha Patel",
    email: "sneha.patel@gmail.com",
    phone: "9987654321",
    ctc: "5.5 LPA",
    joiningDate: "10-07-2025",
  },
];

export const mockInterviews: CorporateHomeInterviewDto[] = [
  {
    id: "1",
    jobTitle: "Graphics Designer",
    candidateName: "Jane Smith",
    dateCreated: "Jun 24, 2025",
    image:
      "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop",
  },
  {
    id: "2",
    jobTitle: "UI/UX Designer",
    candidateName: "John Doe",
    dateCreated: "Jun 25, 2025",
    image:
      "https://images.pexels.com/photos/3184454/pexels-photo-3184454.jpeg?auto=compress&cs=tinysrgb&w=50&h=50&fit=crop",
  },
];

export const mockEvaluations: CorporateHomeEvaluationDto[] = [
  {
    id: "1",
    candidateName: "Avijit Dutta Gupta",
    evaluatorNames: ["Sayan Das", "Rahit Deb", "Akanksha Namdy"],
    email: "avijitduttagupta51@gmail.com",
    phone: "9831688541",
    dates: ["24-05-2025", "2-05-2025"],
    score: 80,
    evaluatorCount: 3,
  },
  {
    id: "2",
    candidateName: "Raj Patel",
    evaluatorNames: ["Amit Singh", "Neha Gupta"],
    email: "raj.patel@gmail.com",
    phone: "9876543210",
    dates: ["23-05-2025", "1-05-2025"],
    score: 75,
    evaluatorCount: 2,
  },
  {
    id: "3",
    candidateName: "Simran Kaur",
    evaluatorNames: ["Vikash Kumar", "Ritu Sharma", "Manish Jain"],
    email: "simran.kaur@gmail.com",
    phone: "9123456789",
    dates: ["22-05-2025", "30-04-2025"],
    score: 90,
    evaluatorCount: 3,
  },
  {
    id: "4",
    candidateName: "Arjun Mehta",
    evaluatorNames: ["Pooja Reddy", "Suresh Nair"],
    email: "arjun.mehta@gmail.com",
    phone: "9987654321",
    dates: ["21-05-2025", "29-04-2025"],
    score: 65,
    evaluatorCount: 2,
  },
];

export const chartData: CorporateHomeChartDataDto[] = [
  { year: "2016", value: 50 },
  { year: "2017", value: 120 },
  { year: "2018", value: 180 },
  { year: "2019", value: 300 },
  { year: "2020", value: 220 },
  { year: "2021", value: 400 },
];

export const pieChartData: CorporateHomePieChartDataDto[] = [
  { label: "Direct Applications", value: 45, color: "#3B82F6" },
  { label: "Referral", value: 30, color: "#14B8A6" },
  { label: "BRC Bank", value: 15, color: "#93C5FD" },
  { label: "MCP Bank", value: 10, color: "#67E8F9" },
];
