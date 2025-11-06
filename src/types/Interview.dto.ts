// Interview Status Types
export type InterviewStatusType = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EXPIRED";

export type InterviewChunkUploadStatusType = "PENDING" | "UPLOADING" | "UPLOADED" | "FAILED";

// Interview DTOs
export interface InterviewHistoryEntryDto {
  questionId: string;
  questionText: string;
  userAnswer: string;
  feedback: string;
  isCorrect: boolean;
  timeTaken: number;
  chunkId: string;
  chunkUploadStatus: InterviewChunkUploadStatusType;
  chunkFileMimeType: string;
}

export interface InterviewRequestDto {
  userId: string;
  corporateUserId: string;
  companyId: string;
  positionId: string;
  jobId: string;
  requestedAt: string;
}

export interface InterviewScoreBreakdownDto {
  domainExpertise?: number;
  attitude?: number;
  achievement?: number;
}

export interface InterviewUserFeedbackDto {
  rating: number;
  comments?: string;
}

export interface InterviewDto {
  id: string;
  GSI1PK: string;
  GSI1SK: string;
  createdByUserId: string;
  candidateEmail: string;
  status: InterviewStatusType;
  totalQuestions: number;
  currentQuestion: string;
  requestedBy?: InterviewRequestDto[];
  score?: number;
  scoreBreakdown?: InterviewScoreBreakdownDto;
  duration?: number;
  avgResponseTime?: number;
  interviewHistory?: InterviewHistoryEntryDto[];
  storagePath?: string;
  uploadStatus?: string;
  lastChunkUploaded?: string;
  userFeedback?: InterviewUserFeedbackDto;
  updatedBy?: string;
  createdBy?: string;
  retryCount?: number;
  initiatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
