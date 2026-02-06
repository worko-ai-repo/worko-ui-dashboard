import { StatusTracker } from "@Interfaces/CorporateDashboard.dto";
export interface AgencyAllCandidatesListDetailsDto {
  agencyComments: string;
  agencyJobAssignedByCorporateUserId: string;
  agencyJobAssignmentId: string;
  agencyName: string;
  agencyRegisteredEmail: string;
  agencyUserId: string;
  agencyUserInviteId: string;
  candidateEmail: string;
  candidateParsedCvDetails: CandidateParsedCvDetails;
  candidateParsedCvId: string;
  companyId: string;
  createdAt: string;
  id: string;
  jobDetails: JobDetails;
  jobId: string;
  updatedAt: string;
  jobApplicationStatus: string;
  matchingScoreDetails: {
    rejectionFeedbackBySystemForApplicant: string;
    rejection_feedback: string;
    matchingScore: number;
    scoreDetails: string;
    scoreDetailsForApplicant: string;
    //fake data
    score: number;
  };
  matchingScore:number;
  scoreDetails:string;
  
  //fake data
  applicantName: string;
  statusTracker: any;
  isFindMatchingScoreInProgress: boolean;
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
  cvAwsS3ResourceType?: "USER_RESUME" | "AGENCY_SUBMIT_USER_CV" | "BULK_CVS" | "CORP_CAND_BULK_CV_UPLOAD" | "ADMIN_CAND_BULK_CV_UPLOAD" | "CORP_CAND_REFERRAL_CV";
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
  userDetailId: String;
  corporateBulkJdId: string;
  cvAwsS3FilePath:string;
  //for admin db listing
  companyId: string;
  jobId: string;
  agencyUserId: string;
}

export interface AgencyDatabaseApplicantDetailsDto {
  agencyUserId: string;
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
  candidateProfileInCompanies: CandidateProfileInCompanies[];
  name:string;
  email:string;
  relevantYOE:number;
  currentCTC:number;
  expectedCTC:number;
  noticePeriod:number;
  cvAwsS3ResourceType?: "USER_RESUME" | "AGENCY_SUBMIT_USER_CV" | "BULK_CVS" | "CORP_CAND_BULK_CV_UPLOAD" | "CORP_CAND_REFERRAL_CV";
  cvAwsS3FileName:string;
  cvAwsS3FilePath:string;
  userDetailId:string;
  corporateBulkJdId:string;
  isFindMatchingScoreInProgress:boolean;
  matchingScore:number;
  candidateMovedToApplicants:boolean;
  scoreDetails:string;
  hiringEligibilityStatus:string;
  //fake data
  emailId: string;
  addedBy: string;
  addedFor: string;
  coolingPeriodCompanies: CoolingPeriodCompanies[];
  lastActive: string;
  remark: string;
  profileName: string;
  referredBy: string;
  candidateName: string;
  currentCompany: string;
  contactNumber: string;
  coreSkills: {
    skillName:string;
  }[];
  currentDesignation: string;
  YOE: string;
  source: string;
  about: string;
  CTC: string;
  ECTC: string;
  cvLink: string;
  matchingScoreDetails: {
    rejectionFeedbackBySystemForApplicant: string;
    rejection_feedback: string;
    matchingScore: number;
    scoreDetails: string;
    scoreDetailsForApplicant: string;
    //fake data
    score: number;
  };
}

export interface CandidateProfileInCompanies {
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
  contractCopyAwsS3FileName: string;
  contractCopyUserFileName: string;
  createdAt: string;
  email: string;
  id: string;
  inviteStatus: string;
  invitedByCorporateUserId: string;
  inviterName: string;
  miscellaneousEmailDomainName: string;
  name: string;
  phoneNumberDetails: PhoneNumberDetails;
  updatedAt: string;
  updatedByAgencyUserId: string;

  //future data
  totalAssignedJobs: number;
  totalCandidatesSubmitted: number;
  totalCandidateRejected: number;
  totalCandidateHired: number;
  inviteAction: "PAUSE" | "RESUME" | "DELETE";
  isDelete: boolean;

  //fake data
  emailId: string;
}

export interface CoolingPeriodCompanies{
  companyId: string;
  companyName: string;
}