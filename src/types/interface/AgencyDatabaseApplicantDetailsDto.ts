export interface AgencyAllCandidatesListDetailsDto {
  agencyComments: string;
  agencyJobAssignedByCorporateUserId: string;
  agencyJobAssignmentId: string;
  agencyName: string;
  agencyRegisteredEmail: string;
  agencyUserId: string;
  agencyUserInviteId: string;
  candidateEmail:  string;
  candidateParsedCvDetails: CandidateParsedCvDetails;
  candidateParsedCvId: string;
  companyId: string;
  createdAt: string;
  id: string;
  jobDetails: JobDetails;
  jobId: string;
  updatedAt: string;
}

export interface JobDetails {
  companyId: string;
  companyLogoUrl: string;
  companyName: string;
  companyUrl: string;
  coreSkills: string[];
  createdAt: string;
  createdByCorporateUserId: string;
  department: string;
  displaySalaryRange: boolean;
  experienceRange: {
    min: number;
    max: number;
  };
  flexibleNotice: boolean;
  htmlJobDescription: string;
  id: string;
  isDeleted: boolean;
  jobDescription: string;
  jobTitle: string;
  jobUrl: string;
  location: {
    city: string[];
    fullLocation: string[];
    state: string[];
    country: string[];
  };
  miscellaneousSkills: string[];
  noticePeriod: number;
  numOfOpenings: number;
  otherRequirements: string;
  salaryRange: {
    min: number;
    max: number;
    fixedComponentPercentage: number;
    variableComponentPercentage: number;
  };
  softSkills: string[];
  sourcedFrom: string;
  status: string;
  technicalSkills: string[];
  typeofEmployment: string;
  updatedAt: string;
  workMode: string;
}

export interface CandidateParsedCvDetails {
  agencyUserSubmissionId: string;
  createdAt: string;
  currentCTC: number;
  currentCompany: string;
  currentDesignation: string;
  cvAwsS3FileName: string;
  email: string;
  expectedCTC: number;
  id: string;
  isNoticePeriodNegotiable: boolean;
  location: string;
  name: string;
  noticePeriod: number;
  phoneNumberDetails: PhoneNumberDetails;
  countryCode: number;
  number: number;
  readyToRelocate: boolean;
  relevantYOE: number;
  totalYOE: number;
  updatedAt: string;
  userDetailId:String;
  //for admin db listing
  companyId:string;
  jobId:string;
  agencyUserId:string;
}

export interface AgencyDatabaseApplicantDetailsDto {
  agencyUserId:string;
  agencyUserSubmissionId: string;
  candidateEmail: string;
  candidateParsedCvDetails: CandidateParsedCvDetails;
  candidateParsedCvId: string;
  companyId: string;
  createdAt: string;
  id: string;
  jobId: string;
  phoneNumberDetails: PhoneNumberDetails;
  refereeType: string;
  updatedAt: string;
  candidateProfileInCompanies:CandidateProfileInCompanies[];

  //fake data
  emailId:string;
}

export interface CandidateProfileInCompanies{
    companyId: string;
    companyName: string;
    jobIds: string[];
}
interface PhoneNumberDetails {
  number: number;
  countryCode: number;
}


export interface AgencyListDetailsDto {
  GSTIN: string;
  agencyName: string;
  companyId: string;
  companyName: string;
  contractCopyAwsS3FileName:string;
  contractCopyUserFileName: string;
  createdAt: string; 
  email: string;
  id: string;
  inviteStatus: string;
  invitedByCorporateUserId: string;
  inviterName: string;
  miscellaneousEmailDomainName: string;
  name: string;
  phoneNumberDetails:PhoneNumberDetails;
  updatedAt: string;
  updatedByAgencyUserId: string;

  //future data
  totalAssignedJobs:number;
  totalCandidatesSubmitted:number;
  totalCandidateRejected:number;
  totalCandidateHired:number;
  isPaused:boolean;
  isDelete:boolean;

  //fake data
  emailId:string;
}