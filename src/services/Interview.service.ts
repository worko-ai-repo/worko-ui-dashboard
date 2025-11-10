import httpServiceObj from "@Services/ApiHandler.service";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";

interface ApiResponse<T> {
  response: T | null;
  error: string | null;
}

class InterviewService {
  /**
   * Initiate a new interview for a candidate
   */
  async initiateInterview(candidateEmail: string): Promise<ApiResponse<InterviewDto>> {
    try {
      const { response, error } = await httpServiceObj.post<{ data: InterviewDto }>(
        "/user/interview/initiate",
        { candidateEmail },
        true
      );

      if (error) {
        console.error("Failed to initiate interview:", error);
        return { response: null, error: "Failed to initiate interview. Please try again." };
      }

      return { response: response?.data || null, error: null };
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An error occurred while initiating the interview.";
      console.error("Error initiating interview:", err);
      return { response: null, error: errorMsg };
    }
  }

  /**
   * Fetch list of all interviews for a candidate
   */
  async fetchInterviewList(candidateEmail: string): Promise<ApiResponse<InterviewDto[]>> {
    try {
      const { response, error } = await httpServiceObj.get<{ data: InterviewDto[] }>(
        `/user/interview/list/${candidateEmail}`,
        true
      );

      if (error) {
        console.error("Failed to fetch interviews:", error);
        return { response: null, error: "Failed to load interviews. Please try again." };
      }

      return { response: response?.data || [], error: null };
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An error occurred while fetching interviews.";
      console.error("Error fetching interviews:", err);
      return { response: null, error: errorMsg };
    }
  }

  /**
   * Fetch details of a specific interview
   */
  async fetchInterviewDetails(interviewId: string): Promise<ApiResponse<InterviewDto>> {
    try {
      const { response, error } = await httpServiceObj.get<[InterviewDto] >(
        `/user/interview/details/${interviewId}`,
        true
      );

      if (error) {
        console.error("Failed to fetch interview details:", error);
        return { response: null, error: "Failed to load interview details. Please try again." };
      }

      return { response: response?.[0] || null, error: null };
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An error occurred while fetching interview details.";
      console.error("Error fetching interview details:", err);
      return { response: null, error: errorMsg };
    }
  }
}

export default new InterviewService();
