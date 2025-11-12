import httpServiceObj from "@Services/ApiHandler.service";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";

interface ApiResponse<T> {
  response: T | null;
  error: string | null;
}

interface InterviewCompletionPayload {
  candidateEmail: string;
  status: "COMPLETED" | "CLOSED";
  userFeedback: {
    rating: number;
    comments?: string;
  };
  lastChunkUploaded?: string;
}

class InterviewService {
  /**
   * Initiate a new interview for a candidate
   */
  async initiateInterview(candidateEmail: string): Promise<ApiResponse<InterviewDto>> {
    try {
      const { response, error, status } = await httpServiceObj.post<InterviewDto>(
        "/user/interview/initiate",
        { candidateEmail },
        true
      );

      if (status === 409) {
        return {
          response: null,
          error: "You cannot start more than 1 interview within 3 months. Please try again later.",
        };
      }

      if (error) {
        console.error("Failed to initiate interview:", error);
        return { response: null, error: "Failed to initiate interview. Please try again." };
      }

      return { response: response || null, error: null };
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
      const { response, error } = await httpServiceObj.get<[InterviewDto]>(
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

  /**
   * Complete an interview with user feedback
   */
  async completeInterview(
    interviewId: string,
    payload: InterviewCompletionPayload
  ): Promise<ApiResponse<InterviewDto>> {
    try {
      const { response, error, status } = await httpServiceObj.patch<InterviewDto>(
        `/user/interview/complete/${interviewId}`,
        payload,
        true
      );

      if (error) {
        console.error("Failed to complete interview:", error);
        return { response: null, error: "Failed to complete interview. Please try again." };
      }

      return { response: response || null, error: null };
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "An error occurred while completing the interview.";
      console.error("Error completing interview:", err);
      return { response: null, error: errorMsg };
    }
  }
}

export default new InterviewService();
