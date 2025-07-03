
export interface JobApiResponse {
  data: JobData[];
  pagination: {
    lastKey?: string;
    sortOrder?: string;
    timesQueried?: number;
    queriedCount?: number;
    count: number;
    pageSize: number;
  };
}
export interface ApiResponseDto<T> {
  data: T[];
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

export interface JobDetails {
  id?:string;
  jobTitle?: string;
  company?: string;
  offerings?: string;
  gradeLevel?: string;
  department?: string;
  workMode?: "WFO" | "WFH" | "HYBRID";
  location?: {
    city: string[];
    fullLocation: string[];
  };
  experienceRange?: {
    min?: number;
    max?: number;
  };
  salaryRange?: {
    min?: number;
    max?: number;
  };
  creatorName?: string;
  coreSkills?: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  goodSkills?: string[];
  otherRequirements?: string;
  typeofEmployment: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";
  status: "PUBLISHED" | "ARCHIVED" | "CLOSED";
  noticePeriod: number;
  displaySalaryRange: boolean;
  miscellaneousSkills?: any;
  jobDescription: string;
  htmlJobDescription: string;
  fixedComponent?: number;
  variableComponent?: number;
}



//========================================JOB APPLICATIONS INTERFACES========================================
export interface JobApplicationDetailsDto   {
  id: string;
  companyId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobPortal: string;
  jobUrl: string;
  status: string;
  rejectionAwsScheduleId?: string;
  rejectionFeedbackBySystem?: string;
  jdMatchErrorCode?: number;
  jdMatchErrorDesc?: string;
  scoreDetails?: string;
  matchingScore?: number;
  scoreFetchedDate?: string;
  createdAt: string;
  updatedAt: string;
  displayToCorporate: boolean;
  hiredFromOtherPortal?: {
    portal: string;
    date: string;
  };
  statusTracker: StatusTracker[];
  applicantDetails: ApplicantDetails;
  GSI1PK: string;
  GSI1SK: string;
  GSI2PK: string;
  GSI2SK: string;
  PK: string;
  SK: string;
}

export interface StatusTracker {
  userType: 'CAND' | 'ADMIN' | string;
  newStatus: string;
  oldStatus: string;
  actionDate: string;
  userId: string;
}

export interface ApplicantDetails {
  id: string;
  userId: string;
  name: string;
  email: string;
  emailList: {
    primary: string;
  };
  profileImage: string;
  profileImageAwsS3SignedUrl: string;
  cvAwsS3SignedUrl: string;
  CV: string;
  country: string;
  number: string;
  location: string;
  YOE: number;
  CTC: number;
  ECTC: number;
  noticePeriod: number;
  acceptedTermsAndConditions: boolean;
  isSubscribed: boolean;
  isEmailVerified: boolean;
  isNumberVerified: boolean;
  isWhatsappNotificationEnabled: boolean;
  isCandidateFresher: boolean;
  lastAccessedDash: string;
  about: string;
  createdAt: string;
  updatedAt: string;
  expiryDate: string;
  coverLetter: string;
  referralCount: number;
  userType: string[];
  cvExtract: string;
  cvExtractDate: string;
  cvExtractParsedDate: string;
  GSI1PK: string;
  GSI1SK: string;
  SK: string;
  cvExtractParsed: CVExtractParsed;
  candidateExperience: {
    companyName: string;
    department: string;
    designation: string;
  };
}

export interface CVExtractParsed {
  personalDetails: {
    name: string;
    phone: string;
    email: string;
  };
  roleAndResponsibilities: RoleAndResponsibility[];
  industryExperience: IndustryExperience[];
  education: Education[];
  professionalExperience: ProfessionalExperience[];
}

export interface RoleAndResponsibility {
  role: string;
  responsibilities: string[];
  achievements: string[];
  teamLeadership: string[];
}

export interface IndustryExperience {
  industryType: string;
  industryDomain: string;
  details: string[];
}

export interface Education {
  degree: string;
  institution: string;
  certifications: string[];
  year: string;
}

export interface ProfessionalExperience {
  workExperience: string[];
  company: string;
  period: string;
  role: string;
}
