export interface AgencyInvitesListDetailsDto {
  GSTIN: string;
  companyId: string;
  contractCopyUserFileName: string;
  createdAt: string;
  email: string; 
  id: string;
  inviteStatus: string;
  invitedByCorporateUserId: string;
  name: string;
  phoneNumberDetails: {
    number: number; 
    countryCode: number;
  }
  updatedAt: string;
  updatedByAgencyUserId: string;
  // upcoming
  senderName:string;
  companyName:string;
}

// export interface AgencyJobsList {
//   id: string;
//   pk: string;
//   sk: string;
//   companyName:string;
//   profile:string;
//   YOEStart: number;
//   YOEEnd: number;
//   salaryStart: number;
//   salaryEnd: number;
//   location:string;
//   noticePeriod: number;
//   dateAssigned: string,
//   candidatesUploaded: number;
//   candidatesRejected: number;
//   candidatesInProcess: number;
// }

export interface AgencyJobsList {
  agencyRegisteredEmail: string;
  assignedByCorporateUserId: string;
  companyId: string;
  createdAt: string;
  id: string;
  jobId: string;
  status: string; 
  updatedAt: string; 
  jobDetails:JobDetails;
  //fake data
  candidatesUploaded:number;
  candidatesRejected:number;
  candidatesInProcess:number;
}

export interface JobDetails {
  id: string;
  jobId?: string;
  companyId: string;
  companyName: string;
  companyLogoUrl: string;
  companyUrl?: string;
  coreSkills: string[];
  technicalSkills: string[];
  softSkills: string[];
  miscellaneousSkills: string[];
  createdAt: string; 
  updatedAt?: string; 
  createdByCorporateUserId?: string;
  department?: string;
  displaySalaryRange?: boolean;
  experienceRange?: ExperienceRange;
  flexibleNotice?: boolean;
  htmlJobDescription?: string;  
  jobDescription?: string;
  jobTitle?: string;
  jobUrl?: string;
  location?: LocationInfo;
  noticePeriod?: number;
  numOfOpenings?: number;
  otherRequirements?: string;
  salaryRange?: SalaryRange;
  sourcedFrom?: string;         
  status?: string;              
  typeofEmployment?: string;   
  workMode?: string;            
  isDeleted?: boolean;
}

export interface ExperienceRange {
  min: number;
  max: number;
}

export interface SalaryRange {
  min: number;
  max: number;
  fixedComponentPercentage?: number;  
  variableComponentPercentage?: number;
}

export interface LocationInfo {
  city: string[];
  fullLocation: string[];
  state: string[];
  country: string[];
}