import { SelectedRow } from "@Components/Dashboard/Corporate/Job/Jobs";
import { JobFormSchema } from "@Components/Dashboard/types";
import { JobApiResponse } from "@Interfaces/CorporateDashboard.dto";
import { JobDto } from "@Interfaces/JobsAndCompany.dto";
import httpServiceObj from "@Services/ApiHandler.service";

/**
 * Corporate Service File
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

}

const AdminServiceObj = new AdminService();
export default AdminServiceObj;
