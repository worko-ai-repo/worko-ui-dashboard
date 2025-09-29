import httpServiceObj from '@Services/ApiHandler.service';
import { EvaluationRequest, EvaluationDetails } from 'src/types';

const APP_API_URI = import.meta.env.APP_API_URI || '';
const JOB_BASE_URL = import.meta.env.APP_JOBS_API_URI;

const RESPONSE_EVALUATION_URL = `${JOB_BASE_URL}/response-evaluation/`;

export interface SubmitEvaluationPayload {
  createdByUserEmail: string;
  evaluationRequesterCorporateUserId?: string;
  evaluationRequesterUserId?: string;
  evaluationRequestId: string;
  evaluatorName: string;
  jobApplicationId: string;
  jobId: string;
  companyId: string;
  applicantUserId: string;
  status: 'REJECTED' | 'ON_HOLD' | 'INTERVIEW_SCHEDULED';
  score: number;
  detailedFeedback: string;
  htmlDetailedFeedback?: string;
  reason: string;
  comment?: string;
  htmlComment?: string;
  applicantUserEmail: string;
}

export interface EvaluationResponse {
  evaluationRequesterCorporateUserId?: string;
  evaluationRequesterUserId?: string;
  companyId: string;
  status: 'REJECTED' | 'ON_HOLD' | 'INTERVIEW_SCHEDULED';
  jobId: string;
  jobApplicationId: string;
  applicantUserId: string;
  applicantUserEmail: string;
  evaluationRequestId: string;
  evaluatorName: string;
  createdByUserEmail: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  statusTracker: {
    detailedFeedback: string;
    htmlDetailedFeedback?: string;
    score: number;
    newStatus: 'REJECTED' | 'ON_HOLD' | 'INTERVIEW_SCHEDULED';
    actionDate: string;
  }[];
  scheduledInterviewDetails?: {
    date: string; // yyyy-mm-dd
    startTime: string; // "12:30 PM"
    endTime: string;   // "1:00 PM"
    availability: number; // 1 | 2 | 3
    timeSlot: string;     // "30 mins"
    actionDate: string;   // ISO
  }[];
}

export const fetchEvaluationRequests = async (
  evaluatorEmail: string
): Promise<EvaluationRequest[]> => {
  const url = `${JOB_BASE_URL}/request-evaluation/`;
  const params = {
    evaluatorEmail,
    pageSize: '25',
    sortOrder: 'descending',
    dashboardType:"EVALUATOR"
  };

  const { response, error } = await httpServiceObj.get<{ data: EvaluationRequest[] }>(url, true, params, true);

  if (error || !Array.isArray(response?.data)) {
    console.error('Invalid or missing response:', response);
    return [];
  }
  return response.data || [];
};

export const fetchEvaluationDetails = async (
  jobApplicationId: string,
  evaluationRequestId: string
): Promise<EvaluationDetails> => {
  const url = `${JOB_BASE_URL}/request-evaluation/${jobApplicationId}/${evaluationRequestId}`;
  const { response, error } = await httpServiceObj.get<EvaluationDetails>(url, true, {}, true);

  if (error) throw error;
  return response!;
};

export const fetchCandidateDetails = async (email: string): Promise<any> => {
  const url = `${APP_API_URI}/user/${email}/details`;
  const { response, error } = await httpServiceObj.get<any>(url, true, {}, true);
  if (error) throw error;
  return response!;
};

export const fetchCandidateSocial = async (email: string): Promise<any> => {
  const url = `${APP_API_URI}/user/${email}/socialprofile`;

  const { response, error } = await httpServiceObj.get<any>(url, true, {}, true);

  if (error) throw error;
  return response!;
};

export const fetchApplicationDetails = async (
  jobApplicationId: string
): Promise<any> => {
  const url = `${JOB_BASE_URL}/job-application/${jobApplicationId}`;
  const { response, error } = await httpServiceObj.get<any>(url, true, {}, true);

  if (error) throw error;
  return response!;
};

export const submitEvaluationResponse = async (
  payload: SubmitEvaluationPayload
) => {
  const { response, error } = await httpServiceObj.post(RESPONSE_EVALUATION_URL, payload, true, {}, true);
  if (error) {
    console.error('Error submitting evaluation response:', error);
    throw error;
  }
  return response;
};

export const getEvaluationResponse = async (
  jobApplicationId: string,
  responseId: string
): Promise<EvaluationResponse> => {
  const url = `${JOB_BASE_URL}/response-evaluation/${jobApplicationId}/${responseId}`;
  const { response, error } = await httpServiceObj.get<EvaluationResponse>(url, true, {}, true);
  if (error) throw error;
  return response!;
};