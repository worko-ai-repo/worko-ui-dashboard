export type JobFormSchema = {
    status: string;
    companyId: string;
    coreSkills: string[];
    department: string;
    experienceRange: {
      min: number;
      max: number;
    };
    jobTitle: string;
    htmlJobDescription: string;
    location?: {
      city: string[];
      country: string[];
      fullLocation: string[];
      state: string[];
    };
    miscellaneousSkills: string[];
    numOfOpenings: number;
    noticePeriod: number;
    otherRequirements: string;
    salaryRange: {
      min: number;
      max: number;
      variableComponentPercentage?: number;
      fixedComponentPercentage?: number;
    };
    displaySalaryRange: boolean;
    softSkills: string[];
    technicalSkills: string[];
    typeofEmployment: "FULL_TIME" | "PART_TIME" | "CONTRACT" | 'INTERNSHIP';
    workMode: "WFO" | "WFH" | "HYBRID";
    jobDescription: string;
    flexibleNotice: boolean;
  }


export interface JobApiResponse {
  data: JobData[];
  pagination: {
    count: number;
    pageSize: number;
    key: string;
  };
}

export interface JobData {
  status: string;
  companyId: string;
  coreSkills: string[];
  department: string;
  experienceRange: {
    min: number;
    max: number;
  };
  jobTitle: string;
  htmlJobDescription: string;
  location: {
    city: string[];
    fullLocation: string[];
    state: string[];
    country: string[];
  };
  miscellaneousSkills: string[];
  numOfOpenings: number;
  noticePeriod: number;
  otherRequirements: string;
  salaryRange: {
    min: number;
    max: number;
  };
  softSkills: string[];
  technicalSkills: string[];
  typeofEmployment: string;
  workMode: string;
  jobDescription: string;
  createdByCorporateUserId: string;
  companyName: string;
  companyUrl: string;
  companyLogoUrl: string;
  id: string;
  jobUrl: string;
  sourcedFrom: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  updatedByCorporateUserId: string;
  companyDetails: CompanyDetails;
}

interface CompanyDetails {
  website: string;
  linkedIn: string;
  industry: string;
  logoUrl: string;
  createdAt: string;
  isDeleted: boolean;
  GSI1SK: string;
  logo: string;
  carrierPage: string;
  name: string;
  isVerified: boolean;
  teamSize: number;
  GSI1PK: string;
  updatedAt: string;
  aboutCompany: string;
  SK: string;
  PK: string;
  id: string;
}

export interface JobDetails {
  jobTitle: string;
  salaryRange: {
    min: string;
    max: string;
  };
  experienceRange: {
    min: string;
    max: string;
  };
  numberOfOpenings: string;
  workMode: string;
  location: string;
  noticePeriod: string;
  typeOfEmployment: string;
  department: string;
  coreSkills: string[];
  softSkills: string[];
  technicalSkills: string[];
  goodToHaveSkills: string[];
  formattedHTML: string;
}
