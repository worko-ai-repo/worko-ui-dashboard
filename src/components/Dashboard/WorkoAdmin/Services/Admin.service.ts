import { SelectedRow } from "@Components/Dashboard/Corporate/Job/Jobs";
import { JobFormSchema } from "@Components/Dashboard/types";
import {
  AdminBulkJobApplicationUpdateItem,
  ApiResponseDto,
  CorporateUserPageAdminDataDto,
  CorporateUserPageRecDataDto,
  CursorPaginationReferAndEarnAdminParams,
  GuidanceRequestDto,
  ReferAndEarnDto,
  ReferAndEarnUpdateApiDto,
} from "@Interfaces/AdminServices.dto";
import {
  ApplicantDetails,
  JobApiResponse,
  JobApplicationDetailsDto,
  ReferralDetailsDto,
} from "@Interfaces/CorporateDashboard.dto";
import {
  BulkJobApplicationUpdatePayload,
  CursorPaginationCorporateUserAdminDataParams,
  CursorPaginationCorporateUserRecDataParams,
  JobEvaluationRequestDto,
} from "@Interfaces/CorporateServices.dto";
import { CompanyDto, CompanyRequestDto, JobDto } from "@Interfaces/JobsAndCompany.dto";
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
      const { response } = await httpServiceObj.post<JobDto>(
        "/job",
        payload,
        true,
        params,
        false,
        "JOB"
      );

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
      const { response } = await httpServiceObj.get<JobApiResponse>(
        "/job",
        true,
        params,
        false,
        "JOB"
      );
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
      shortSoftDeleteReason?: string;
      detailedSoftDeleteReason?: string;
    },
    params: object,
    jobId: string
  ): Promise<JobDto | null> {
    try {
      const { response } = await httpServiceObj.put<JobDto>(
        `/job/${jobId}`,
        payload,
        true,
        params,
        false,
        "JOB"
      );

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
   * deleteJob
   *
   * @type {DELETE}
   * @description - This api is used to delete a job.
   */
  async deleteJob(payload: any, jobId: string): Promise<any> {
    try {
      const { response, status } = await httpServiceObj.put(
        `/job/${jobId}/delete`,
        payload,
        true,
        {},
        false,
        "JOB"
      );
      return true;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to delete Job.", error);
      return false;
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
      const { response } = await httpServiceObj.patch<any>(
        "/job/bulk-update",
        payload,
        true,
        {},
        false,
        "JOB"
      );
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
   * bulkCloseJobs
   *
   * @type {PATCH}
   *
   * @description - This api is used to bulk close jobs with soft delete reasons.
   *
   * @return {any} - Bulk close metrics containing success and failure counts/ids.
   */
  async bulkCloseJobs(payload: {
    jobs: {
      jobId: string;
      companyId?: string;
      jobTitle: string;
    }[];
    shortSoftDeleteReason: string;
    detailedSoftDeleteReason?: string;
  }): Promise<any> {
    try {
      const { response } = await httpServiceObj.patch<any>(
        "/job/bulk-close",
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to bulk close Jobs.", error);
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
  async updateApplicationStatus(
    payload: any,
    jobId: string
  ): Promise<JobApplicationDetailsDto | null> {
    try {
      const { response } = await httpServiceObj.patch<JobApplicationDetailsDto>(
        `/job-application/${jobId}/corp-action`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

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
    const { response, error, status } = await httpServiceObj.get<
      ApiResponseDto<JobApplicationDetailsDto>
    >("/job-application", true, params, false, "JOB");

    if (error) {
      console.error("[ADMIN SERVICE]: Failed to fetch Applications.", error);
      throw error; // Throw error so React Query can retry
    }

    if (!response) {
      const err = new Error("No response received from fetchApplications");
      console.error("[ADMIN SERVICE]:", err);
      throw err; // Throw error so React Query can retry
    }

    return response;
  }

  /**
   * postBulkApplicationUpdate
   *
   * @description - This API is used to send multiple evaluator feedback requests for multiple job applications at once.
   */
  async postBulkApplicationUpdate(payload: BulkJobApplicationUpdatePayload): Promise<any> {
    try {
      const { response, status } = await httpServiceObj.patch<any>(
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
      console.error("[ADMIN SERVICE]: Failed to post Bulk Application Update Request.", error);
      throw error;
    }
  }

  /**
   * sendApplicationToRecruiters
   *
   * @description - This API is used to send a job application to recruiters for further processing.
   *
   * @param {string} applicationId - The ID of the application for which the application is being sent.
   */
  async sendApplicationToRecruiters(
    applicationId: string
  ): Promise<JobApplicationDetailsDto | null> {
    try {
      const { response } = await httpServiceObj.patch<JobApplicationDetailsDto>(
        `/job-application/${applicationId}/display-to-corporate`,
        {
          displayToCorporate: true, // Assuming this is the intended action
        },
        true,
        {},
        false,
        "JOB"
      );

      if (!response) {
        throw new Error("No response received from sending application to recruiters.");
      }
      return response;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to send application to recruiters.", error);
      return null;
    }
  }

  /**
   * postBulkEvaluatorFeedbackRequest
   *
   * @description - This API is used to send multiple evaluator feedback requests for multiple job applications at once.
   */
  async postBulkEvaluatorFeedbackRequest(payload: {
    requestEvaluations: JobEvaluationRequestDto[];
  }): Promise<any> {
    try {
      const { response, status } = await httpServiceObj.post<any>(
        "/request-evaluation/bulk",
        payload,
        true, // withAuth
        {}, // headers
        false, // noContentTypeHeader
        "JOB" // serviceIdentifier (optional)
      );

      if (status === 409) {
        const error = new Error("Some evaluator feedback requests already exist.");
        (error as any).status = 409;
        throw error;
      }

      if (!response) {
        throw new Error("No response received from bulk evaluation request.");
      }

      return response;
    } catch (error) {
      console.error("[CORPORATE SERVICE]: Failed to post Bulk Evaluator Feedback Request.", error);
      throw error;
    }
  }

  /**
   * postEvaluatorFeedbackRequest
   *
   * @description - This api is used to post the evaluator feedback request for a job application.
   */

  async postEvaluatorFeedbackRequest(payload: JobEvaluationRequestDto): Promise<any> {
    try {
      const { response, status } = await httpServiceObj.post<any>(
        "/request-evaluation/",
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (status === 409) {
        const error = new Error(
          `The application evaluator feedback request already exists against ${
            payload.evaluatorDetails.email || "this evaluator"
          }.`
        );
        (error as any).status = 409;
        throw error;
      }
      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error) {
      console.error("[CORPORATE SERVICE]: Failed to post Evaluator Feedback Request.", error);
      throw error; // Re-throw to let the caller handle it
    }
  }

  /**
   * fetchAdminUsers
   *
   * @description - This api is used to get employees based on the tab .
   */
  async fetchAdminUsers(params: object): Promise<ApiResponseDto<ApplicantDetails>> {
    try {
      const { response } = await httpServiceObj.get<ApiResponseDto<ApplicantDetails>>(
        "/admin/user",
        true,
        params,
        false,
        "BASE"
      );
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to fetch Employees.", error);
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
   * Delete User
   *
   * @description - This api is used to delete a user.
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      const { response, status } = await httpServiceObj.patch<{ message: string }>(
        `/admin/user/${userId}/delete`,
        { isDeleted: true },
        true,
        {},
        false,
        "BASE"
      );

      if (!response) {
        throw new Error("No response received");
      }
      return true;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to delete User.", error);
      return false;
    }
  }

  /**
   * ferchReferrals
   *
   * @description - This api is used to get referrals based on the tab .
   */
  async fetchReferrals(params: object): Promise<ApiResponseDto<ReferralDetailsDto>> {
    try {
      const { response } = await httpServiceObj.get<ApiResponseDto<ReferralDetailsDto>>(
        "/admin/referral",
        true,
        params,
        false,
        "BASE"
      );
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to fetch Referrals.", error);
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
   * fetchGuidace
   *
   * @description - This api is used to get guidance based on the tab .
   */
  async fetchGuidance(params: object): Promise<ApiResponseDto<GuidanceRequestDto>> {
    try {
      const { response } = await httpServiceObj.get<ApiResponseDto<GuidanceRequestDto>>(
        "/user/guidance-request",
        true,
        params,
        false,
        "BASE"
      );
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to fetch Guidance.", error);
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
   * patchGuidanceStatus
   *
   * @description - This api is used to patch guidance status.
   */
  async patchGuidanceStatus(guidanceId: string, payload: any): Promise<GuidanceRequestDto | null> {
    try {
      const { response } = await httpServiceObj.patch<GuidanceRequestDto>(
        `/user/guidance-request/${guidanceId}/WORKO_ADMIN_ACTION`,
        payload,
        true,
        {},
        false,
        "BASE"
      );

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to patch Guidance Status.", error);
      return null;
    }
  }

  /**
   * fetchCompanies
   *
   * @description - This api is used to get companies list.
   */
  async fetchCompanies(params: object): Promise<ApiResponseDto<CompanyDto>> {
    try {
      const { response } = await httpServiceObj.get<ApiResponseDto<CompanyDto>>(
        "/company",
        true,
        params,
        false,
        "BASE"
      );
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to fetch Companies.", error);
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
   * deleteCompany
   *
   * @description - This api is used to delete a company.
   */
  async deleteCompany(companyId: string): Promise<boolean> {
    try {
      const { response, error } = await httpServiceObj.delete(
        `/company/${companyId}`,
        true,
        {},
        "BASE"
      );
      if (error) {
        throw new Error("Failed to delete company");
      }
      return true;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to delete Company.", error);
      return false;
    }
  }
  /**
   * deleteCompanyRequest
   *
   * @description - This api is used to delete a company.
   */
  async deleteCompanyRequest(companyId: string): Promise<boolean> {
    try {
      const { response, error } = await httpServiceObj.delete(
        `/company/${companyId}/request`,
        true,
        {},
        "BASE"
      );
      if (error) {
        throw new Error("Failed to delete company");
      }
      return true;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to delete Company.", error);
      return false;
    }
  }

  /**
   * putCompanyDetails
   *
   * @description - This api is used to update company details.
   */
  async putCompanyDetails(companyId: string, payload: any): Promise<CompanyDto | null> {
    try {
      const { response, error } = await httpServiceObj.put<CompanyDto | null>(
        `/company/${companyId}/`,
        payload,
        true,
        {},
        false,
        "BASE"
      );
      if (error || !response) {
        throw new Error("Failed to update company details");
      }
      return response;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to update Company details.", error);
      return null;
    }
  }
  /**
   * patchCompanyLogo
   *
   * @description - This api is used to update company details.
   */
  async patchCompanyLogo(companyId: string, payload: any): Promise<CompanyDto | null> {
    try {
      const { response, error } = await httpServiceObj.patch<CompanyDto | null>(
        `/company/${companyId}/company-logo`,
        payload,
        true,
        {},
        false,
        "BASE"
      );
      if (error || !response) {
        throw new Error("Failed to update company details");
      }
      return response;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to update Company details.", error);
      return null;
    }
  }
  /**
   * createCompany
   *
   * @description - This api is used to create a new company.
   */
  async createCompany(payload: any): Promise<CompanyDto | null> {
    try {
      const { response } = await httpServiceObj.post<CompanyDto | null>(
        `/company`,
        payload,
        true,
        {},
        false,
        "BASE"
      );
      if (!response) {
        throw new Error("Failed to create company");
      }
      return response;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to create Company.", error);
      return null;
    }
  }
  /**
   * fetchCompanyRequestList
   *
   * @description - This api is used to get company request list.
   */
  async fetchCompanyRequests(params: object): Promise<ApiResponseDto<CompanyRequestDto>> {
    try {
      const { response } = await httpServiceObj.get<ApiResponseDto<CompanyRequestDto>>(
        "/company/request/list",
        true,
        params,
        false,
        "BASE"
      );
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to fetch Company Requests.", error);
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
   * ReferandEarn
   *
   * @type {GET}
   * @description - This api is used to get refer and earn details.
   */
  async fetchReferAndEarnDetails(
    params: CursorPaginationReferAndEarnAdminParams
  ): Promise<ApiResponseDto<ReferAndEarnDto>> {
    try {
      const { response } = await httpServiceObj.get<ApiResponseDto<ReferAndEarnDto>>(
        "/refer-and-earn",
        true,
        params,
        false,
        "JOB"
      );
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to fetch Refer and Earn details.", error);
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
   * patchReferAndEarnStatus
   *
   * @description - This api is used to patch refer and earn status.
   */
  async patchReferAndEarnStatus(
    referralId: string,
    payload: ReferAndEarnUpdateApiDto
  ): Promise<ReferAndEarnDto | null> {
    try {
      const { response } = await httpServiceObj.patch<ReferAndEarnDto>(
        `/refer-and-earn/${referralId}`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to patch Refer and Earn Status.", error);
      return null;
    }
  }

  /**
   * fetchCorporateUsersAdmin
   *
   * @description - This api is used to get corporate users list.
   */
  async fetchCorporateUsersAdmin(
    params: CursorPaginationCorporateUserAdminDataParams
  ): Promise<ApiResponseDto<CorporateUserPageAdminDataDto>> {
    try {
      const { response } = await httpServiceObj.get<ApiResponseDto<CorporateUserPageAdminDataDto>>(
        "/corporate-user",
        true,
        params,
        false,
        "BASE"
      );
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to fetch Corporate Users.", error);
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
   * fetchCorporateUsersRec
   *
   * @description - This api is used to get corporate users list.
   */
  async fetchCorporateUsersRec(
    params: CursorPaginationCorporateUserRecDataParams
  ): Promise<ApiResponseDto<CorporateUserPageRecDataDto>> {
    try {
      const { response } = await httpServiceObj.get<ApiResponseDto<CorporateUserPageRecDataDto>>(
        "/corporate-invite",
        true,
        params,
        false,
        "BASE"
      );
      if (response) return response;
      throw new Error("Empty response");
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to fetch Corporate Users.", error);
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
   * updateCorporateUserInviteStatus
   *
   * @method PATCH
   * @description - This api is used to update corporate user invite status.
   */
  async updateCorporateUserInviteStatus(
    corporateInviteId: string,
    payload: object
  ): Promise<CorporateUserPageRecDataDto | null> {
    try {
      const { response } = await httpServiceObj.patch<CorporateUserPageRecDataDto>(
        `/corporate-invite/${corporateInviteId}`,
        payload,
        true,
        {},
        false,
        "BASE"
      );

      if (!response) {
        throw new Error("No response received");
      }
      return response;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to update Corporate User Invite Status.", error);
      return null;
    }
  }

  /**
   * deleteCorporateUser
   *
   * @method DELETE
   * @description - This api is used to delete a corporate user.
   */
  async deleteCorporateUser(corporateUserId: string): Promise<boolean> {
    try {
      const { response, status } = await httpServiceObj.patch(
        `/corporate-user/${corporateUserId}/delete`,
        {},
        true,
        {},
        false,
        "BASE"
      );
      return true;
    } catch (error: any) {
      console.error("[ADMIN SERVICE]: Failed to delete Corporate User.", error);
      return false;
    }
  }
}

const AdminServiceObj = new AdminService();
export default AdminServiceObj;
