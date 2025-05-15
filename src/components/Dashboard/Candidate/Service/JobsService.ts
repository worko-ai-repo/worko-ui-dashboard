import httpServiceObj from '@Services/ApiHandler.service';
import { JobApiResponse, JobFilters } from '../Pages/Job/JobTypes';

const BASE_URL = 'https://jobs.dev.worko.work';

export class JobService {
  static async fetchJobs(
    userEmail: string,
    pageSize: number = 25,
    lastKey: string = '',
    filters: JobFilters = {}
  ): Promise<{ response: JobApiResponse | null; error: Error | null }> {
    try {
      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
        companyId: filters.companyId || '',
        sortOrder: filters.sortOrder || 'descending',
        userEmail,
        userType: filters.userType || 'CAND',
        lastKey,
      });

      if (filters.searchText) {
        params.append('searchText', filters.searchText);
      }

      const url = `${BASE_URL}/job-application/?${params.toString()}`;
      const { response, error } = await httpServiceObj.get(url, true, {}, true);
      
      return { response: response as JobApiResponse | null, error };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return { response: null, error: error as Error };
    }
  }


  //below to be implemented in FE.
  
  static async getJobDetails(jobId: string, userEmail: string): Promise<{ response: any | null; error: Error | null }> {
    try {
      const url = `${BASE_URL}/job-application/${jobId}?userEmail=${userEmail}`;
      return await httpServiceObj.get(url, true, {}, true);
    } catch (error) {
      console.error('Error fetching job details:', error);
      return { response: null, error: error as Error };
    }
  }
  
  static async submitDocuments(jobId: string, documents: File[], userEmail: string): Promise<{ response: any | null; error: Error | null }> {
    try {
      const formData = new FormData();
      documents.forEach(doc => {
        formData.append('documents', doc);
      });
      formData.append('userEmail', userEmail);
      
      const url = `${BASE_URL}/job-application/${jobId}/documents`;
      return await httpServiceObj.post(url, formData, true, {}, true);
    } catch (error) {
      console.error('Error submitting documents:', error);
      return { response: null, error: error as Error };
    }
  }
  
  static async acceptOffer(jobId: string, userEmail: string): Promise<{ response: any | null; error: Error | null }> {
    try {
      const url = `${BASE_URL}/job-application/${jobId}/accept`;
      return await httpServiceObj.post(url, { userEmail }, true, {}, true);
    } catch (error) {
      console.error('Error accepting offer:', error);
      return { response: null, error: error as Error };
    }
  }
  
  static async markAsJoined(jobId: string, userEmail: string): Promise<{ response: any | null; error: Error | null }> {
    try {
      const url = `${BASE_URL}/job-application/${jobId}/joined`;
      return await httpServiceObj.post(url, { userEmail }, true, {}, true);
    } catch (error) {
      console.error('Error marking as joined:', error);
      return { response: null, error: error as Error };
    }
  }
}

export default JobService;