export interface Candidate {
  id: string;
  name: string;
  email: string;
  sentTime: string;
  isNew: boolean;
  applicantName:string;
}

export interface SocialLinks {
  linkedin?: string[];
  github?: string[];
  twitter?: string[];
  portfolio?: string[];
}
export interface RouteParams {
  companyId: string;
  applicationId: string;
}

export interface EvaluationRequest {
  id: string;
  jobId: string;
  companyId: string;
  jobApplicationId: string;
  applicantUserId: string;
  applicantUserEmail: string;
  hrName: string;
  hrCurrentCompanyName: string;
  jobTitle: string;
  hrDetailedFeedback: string;
  createdAt: string;
  evaluatorDetails: {
    name: string;
    email: string;
  };
  applicantName:string;
  createdByUserId?:string;
  createdByCorporateUserId?:string;
  evaluationResponseId?:string;
  candidateParsedCvId:string;
}

export interface EvaluationDetails extends EvaluationRequest {
  hrHtmlDetailedFeedback: string;
}

export interface CandidateDetails {
  name: string;
  email: string;
  country: string;
  YOE: number;
  CTC: number;
  ECTC: number;
  location: string;
  about?: string;
  profileImage?: string;
  cvExtractParsedDate?: string;
  candidateExperience?: {
    companyName: string;
    designation: string;
    department: string;
  };
  linkedinUrl?: string;
  number?: string;
  noticePeriod?: number;
  profileImageAwsS3SignedUrl?: string;
  cvAwsS3SignedUrl?: string;
  cvExtractParsed?: {
    personalDetails?: {
      name?: string;
      phone?: string;
      email?: string;
    };
    education?: {
      degree: string;
      institution: string;
      year: string;
      certifications?: {
        name: string;
        issuer: string;
        year: string;
      }[];
    }[];
    roleAndResponsibilities?: {
      role: string;
      responsibilities: string[];
      achievements: string[];
    }[];
    industryExperience?: {
      industryType: string;
      industryDomain: string;
      details: string[];
    }[];
    professionalExperience?: {
      company: string;
      role: string;
      period: string;
      workExperience: string[];
    }[];
  };
  cvAwsS3ResourceType:string;
  id:string;
  cvAwsS3FileName:string;
  companyId:string;
  corporateBulkJdId:string;
  jobId:string;
  agencyUserId:string;
  userDetailId:string;
}

export interface ScoreDetail {
  heading: string;
  detail: string;
}

export interface ApplicationDetails {
  id: string;
  jobId: string;
  companyId: string;
  companyName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  jobPortal: string;
  emailFeedback?: string;
  scoreDetails: string; // JSON string — consider parsing to `ScoreDetail[]`
  matchingScore?: number;
  rejectionFeedbackBySystem?: string;
  scoreFetchedDate?: string;
  jdMatchErrorDesc?: string;
  jdMatchErrorCode?: number;

  statusTracker: {
    userType: string;
    newStatus: string;
    oldStatus: string;
    actionDate: string;
    userId: string;
  }[];
}

export interface EvaluationRequestDetails {
  id: string;
  name: string;
  aboutCandidate?: string;
  role: string;
  recruiterFeedback: string;
  overallScore: number;
  workoFeedback: string;
  videoInterview: {
    confidence: number;
    attitude: number;
    domainKnowledge: number;
    commSkills: number;
  };
  profileSentDate: string;
  recruiterName: string;
  matchingScore?: number;
  scoreDetails?: ScoreDetail[] | string;
  evaluationResponseId?:string;
  email?: string;
  applicantUserId?:string;
}

