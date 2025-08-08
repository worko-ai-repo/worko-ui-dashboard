export interface CorporateHomeJobListingDto {
    id: string;
    title: string;
    description: string;
    ctc: string;
    location: string;
    totalApplied: number;
    maxApplicants: number;
    image: string;
  }
  
  export interface CorporateHomeCandidateDto {
    id: string;
    name: string;
    email: string;
    phone: string;
    ctc: string;
    joiningDate: string;
  }
  
  export interface CorporateHomeInterviewDto {
    id: string;
    jobTitle: string;
    candidateName: string;
    dateCreated: string;
    image: string;
  }
  
  export interface CorporateHomeEvaluationDto {
    id: string;
    candidateName: string;
    evaluatorNames: string[];
    email: string;
    phone: string;
    dates: string[];
    score: number;
    evaluatorCount: number;
  }
  
  export interface CorporateHomeChartDataDto {
    year: string;
    value: number;
  }
  
  export interface CorporateHomePieChartDataDto {
    label: string;
    value: number;
    color: string;
  }