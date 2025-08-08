import { SelectedRow } from "@Components/Dashboard/Corporate/Job/Jobs";
import { JobFormSchema } from "@Components/Dashboard/types";
import { AdminBulkJobApplicationUpdateItem, ApiResponseDto } from "@Interfaces/AdminServices.dto";
import { JobApiResponse, JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { JobDto } from "@Interfaces/JobsAndCompany.dto";
import httpServiceObj from "@Services/ApiHandler.service";

/**
 * Admin Service File
 *
 * @description - This file contains the Api calls made on the behalf of Corporate Component
 */
class AdminService {
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
      console.error("[ADMIN SERVICE]: Failed to update Job.", error);
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
   * @return {Promise<JobDto>} -= Common job data that will be listed in the admin dashboard.
   */
  async fetchJobs(params: object): Promise<JobApiResponse> {
    try {
      const { response } = await httpServiceObj.get<JobApiResponse>("/job", true, params, false, "JOB");
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to fetch Jobs.", error);
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
   * updateJob
   *
   * @type {PUT}
   *
   * @description -  This api is used to update a job
   *
   * @param {JobFormSchema} payload for the job Api
   *
   * @return {Promise<JobDto>} -= Common job data that will be listed in the admin dashboard.
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
      console.error("[ADMIN SERVICE]: Failed to update Job.", error);
      return null;
    }
  }

  /**
   * bulkUpdate
   *
   * @type {PATCH}
   *
   * @description - This api is used to patch jobs based on the selected tab - OPEN ARCHIVED AND CLOSED.
   *
   * @return {any} - Common job data that will be listed in the admin dashboard.
   */
  async bulkUpdate(payload: { bulkJobUpdate: SelectedRow[] }): Promise<any> {
    try {
      const { response } = await httpServiceObj.patch<any>("/job/bulk-update", payload, true, {}, false, "JOB");
      if (response) return response;
      else {
        throw new Error();
      }
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to Bulk Update.");
      return null;
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
      console.error("[ADMIN SERVICE]: Failed to update Application Status.", error);
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
   * postBulkApplicationUpdate
   *
   * @description - This API is used to send multiple evaluator feedback requests for multiple job applications at once.
   */
  async postBulkApplicationUpdate(payload: { bulkJobApplicationUpdate: AdminBulkJobApplicationUpdateItem[] }): Promise<any> {
    try {
      const { response, status } = await httpServiceObj.post<any>(
        "/job-application/bulk-update",
        payload,
        true, // withAuth
        {}, // headers
        false, // noContentTypeHeader
        "JOB" // serviceIdentifier (optional)
      );

      if (!response) {
        throw new Error("No response received from bulk update request.");
      }

      return response;
    } catch (error) {
      console.error("[CORPORATE SERVICE]: Failed to post Bulk Application Update Request.", error);
      throw error;
    }
  }
}

const AdminServiceObj = new AdminService();
export default AdminServiceObj;
