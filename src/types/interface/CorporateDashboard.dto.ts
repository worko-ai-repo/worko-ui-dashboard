export interface JobApiResponse {
  data: JobData[];
  pagination: {
    count: number;
    pageSize: number;
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
  createdByUserId: string;
  companyName: string;
  companyUrl: string;
  companyLogoUrl: string;
  id: string;
  jobUrl: string;
  sourcedFrom: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  companyDetails: CompanyDetails;
}

export interface CompanyDetails {
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

export interface CorporateInviteResponse {
  data: CorporateInvite[];
  pagination: {
    count: number;
    pageSize: number;
    lastKey: string;
    sortOrder: string;
    timesQueried: number;
    queriedCount: number;
  };
}

export interface CorporateInvite {
  companyId: string;
  lastName: string;
  createdAt: string;
  isDeleted: boolean;
  email: string;
  GSI1SK: string;
  firstName: string;
  GSI1PK: string;
  createdByUserId: string;
  expiresAt: string;
  updatedAt: string;
  SK: string;
  corporateUserType: string;
  inviteStatus: string;
  id: string;
  PK: string;
  companyDetails: CompanyDetails;
}
