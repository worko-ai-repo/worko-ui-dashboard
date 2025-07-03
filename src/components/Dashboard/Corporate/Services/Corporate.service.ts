import { JobFormSchema } from "@Components/Dashboard/types";
import { ApiResponseDto, CorporateInvite, CorporateInviteResponse, JobApiResponse, JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { JobDto } from "@Interfaces/JobsAndCompany.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { SelectedRow } from "../Job/Jobs";
import { CorporateBulkScreeningDto, FileMetadataDto, BulkUploadResponseDto, BulkScreeningListItemDto, ResumeScreeningRecordDto } from "src/types/corporateServices.types";

/**
 * Corporate Service File
 *
 * @description - This file contains the Api calls made on the behalf of Corporate Component
 */
class CorporateService {
  /**
   * postJobs
   *
   * @type {POST}
   *
   * @description - This api is used to post jobs based on the tab - OPEN ARCHIVED AND CLOSED.
   *
   * @param {JobFormSchema} payload for the job Api
   *
   * @return {Promise<JobDto>} -= Common job data that will be listed in the corporate dashboard.
   */
  async postJobs(payload: JobFormSchema, params: object): Promise<JobDto | []> {
    try {
      const { response } = await httpServiceObj.post<JobDto>("/job", payload, true, params, false, "JOB");

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to update Job.", error);
      return [];
    }
  }

  /**
   * fetchJobs
   *
   * @type {GET}
   *
   * @description - This api is used to get jobs based on the tab - OPEN ARCHIVED AND CLOSED.
   *
   * @return {Promise<JobDto>} -= Common job data that will be listed in the corporate dashboard.
   */
  async fetchJobs(params: object): Promise<JobApiResponse> {
    try {
      const { response } = await httpServiceObj.get<JobApiResponse>("/job", true, params, false, "JOB");
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to fetch Jobs.", error);
      // fallback response to prevent `null`
      return {
        data: [],
        pagination: {
          count: 0,
          pageSize: 0,
        },
      };
    }
  }

  /**
   * bulkUpdate
   *
   * @type {PATCH}
   *
   * @description - This api is used to patch jobs based on the selected tab - OPEN ARCHIVED AND CLOSED.
   *
   * @return {any} - Common job data that will be listed in the corporate dashboard.
   */
  async bulkUpdate(payload: { bulkJobUpdate: SelectedRow[] }): Promise<any> {
    try {
      const { response } = await httpServiceObj.patch<any>("/job/bulk-update", payload, true, {}, false, "JOB");
      if (response) return response;
      else {
        throw new Error();
      }
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to Bulk Update.");
      return null;
    }
  }

  /**
   * updateJob
   *
   * @type {PUT}
   *
   * @description -  This api is used to update a job
   *
   * @param {JobFormSchema} payload for the job Api
   *
   * @return {Promise<JobDto>} -= Common job data that will be listed in the corporate dashboard.
   */
  async updateJob(
    payload: {
      companyId: string;
      status: string;
    },
    params: object,
    jobId: string
  ): Promise<JobDto | null> {
    try {
      const { response } = await httpServiceObj.put<JobDto>(`/job/${jobId}`, payload, true, params, false, "JOB");

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to update Job.", error);
      return null;
    }
  }

  /**
   * fetchApplications
   *
   * @type {GET}
   *
   * @description - This api is used to get jobs based on the tab .
   *
   * @return {Promise<ApiResponseDto<JobApplicationDetailsDto>>} -= Common job data that will be listed in the corporate dashboard.
   */
  async fetchApplications(params: object): Promise<ApiResponseDto<JobApplicationDetailsDto>> {
    try {
      //path: string, data: object, authorization: boolean = true, params = {}, fullUri: boolean = false,apiType: ApiType = "BASE"
      const { response } = await httpServiceObj.get<ApiResponseDto<JobApplicationDetailsDto>>("/job-application", true, params, false, "JOB");
      if (response) return response;
      else {
        throw new Error();
      }
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to fetch Applications.");
      return {
        data: [],
        pagination: {
          count: 0,
          pageSize: 0,
        },
      };
    }
  }

  /**
   * updateApplicationStatus
   *
   * @description - This api is used to update the status of a job application.
   *
   * @type {PATCH}
   * @example - {
        applicantName: "ashutosh kumar"
        emailId : "ashutosh.sharma+corp@worko.ai"
        status : "CV_DOWNLOADED"
        userId : "4HTC6XN01HE0YSRF5BFSTWTHGD" 
        userType : "corporate-admin"
         }
   * @return {Promise<JobApplicationDetailsDto>} -= Common job data that will be listed in the corporate dashboard.
   */
  async updateApplicationStatus(payload: any, jobId: string): Promise<JobApplicationDetailsDto | null> {
    try {
      const { response } = await httpServiceObj.patch<JobApplicationDetailsDto>(`/job-application/${jobId}/corp-action`, payload, true, {}, false, "JOB");

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to update Application Status.", error);
      return null;
    }
  }

  /**
   * parseJobDescription
   *
   * @description - This api is used to parse the job description and extract the required information.
   *
   * @type {POST}
   * @example - {
        jobDescription: "We are looking for a software engineer with experience in React and Node.js."
         }
   * @return {Promise<any>} -= Parsed job description data.
   */
  async parseJobDescription(jobDescription: string): Promise<any> {
    try {
      const { response } = await httpServiceObj.post<any>("/job/parsejd", { jobDescription }, true, {}, false, "JOB");

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to parse Job Description.", error);
      return null;
    }
  }
  /**
 * bulkScreening
 * 
 * @description - This api is used to bulk screen the job applications based on the selected job.
 * @payload - {
 * 
 * companyId: string;
  jobTitle: string;
  experienceRange: { min: number; max: number };
  coreSkills: string[];
  softSkills: string[];
  mustNotHaveSkills: string[];
  mustHave: string[];
  goodToHave: string[];
  technicalSkills: string[];
  industryPreference: string;
  jobLocation: string;}'
  * @return {Promise<CorporateBulkScreeningDto>} - Common job data that will be listed in the corporate dashboard.
 */
  async bulkScreening(payload: any): Promise<CorporateBulkScreeningDto | {}> {
    try {
      const { response } = await httpServiceObj.post<CorporateBulkScreeningDto>("/corporate-bulk-jd/", payload, true, {}, false, "BASE");

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to bulk screen Job applications.", error);
      return {};
    }
  }

  /**
   * bulkScreeningUpload
   *
   * @description - This api is used to upload the bulk screening file metadata to the server.
   * @param  {FileMetadataDto[]}
   *
   * @returns  {BulkUploadResponseDto} -
   */
  async bulkScreeningUpload(payload: FileMetadataDto[], bulkCvId: string): Promise<BulkUploadResponseDto | {}> {
    try {
      const { response } = await httpServiceObj.post<BulkUploadResponseDto>(`/corporate-bulk-jd/${bulkCvId}/resumes`, { bulkCvs: payload }, true, {}, false, "BASE");

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to upload bulk screening file metadata.", error);
      return {};
    }
  }

  async getBulkScreeningList(params: object): Promise<{ data: BulkScreeningListItemDto[] } | null> {
    try {
      const { response } = await httpServiceObj.get<{ data: BulkScreeningListItemDto[] }>(`/corporate-bulk-jd/`, true, params, false, "BASE");

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to fetch Bulk Screening List.", error);
      return null;
    }
  }

  /**
   * corporate-bulk-jd-resume
   *
   * @description - This api is used to get the bulk screening resumes based on the bulkCvId.
   */
  async getBulkScreeningResumes(params: object): Promise<{ data: ResumeScreeningRecordDto[] } | null> {
    try {
      const { response } = await httpServiceObj.get<{ data: ResumeScreeningRecordDto[] }>(`/corporate-bulk-jd-resume/`, true, params, false, "BASE");

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to fetch Bulk Screening Resumes.", error);
      return null;
    }
  }

  /**
   * fetchInvites
   * 
   * @description - This api is used to fetch the corporate invites.
   * @param {object} params - The parameters for the API call, such as pagination and filters.
   */
  async fetchInvites(params: object): Promise<ApiResponseDto<CorporateInvite>> {
    try {
      const { response } = await httpServiceObj.get<ApiResponseDto<CorporateInvite>>("/corporate-invite/", true, params, false, "BASE");
      if (response) {
        return response;
      }
      throw new Error("No response received");
    } catch (error: any) {
      console.error("[CORPORATE SERVICE]: Failed to fetch invites.", error);
      return {
        data: [],
        pagination: {
          count: 0,
          pageSize: 0,
        },
      };
    }
  }
}

const CorporateServiceObj = new CorporateService();
export default CorporateServiceObj;
