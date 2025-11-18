import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import { TranscriptEntry } from "@Components/Interview/TranscriptHistory";
import httpServiceObj from "@Services/ApiHandler.service";
import secureStorage from "./SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";

export interface SignedUrlResponse {
  userFileName: string;
  cloudFileName: string;
  fileMimeType: string;
  fileExtension: string;
  awsS3SignedUrl: string;
}

export interface UploadChunkPayload {
  userId: string;
  interviewId: string;
  chunkFileName: string;
  chunkFileMimeType: string;
  chunkSequence: number;
}

export interface InterviewHistoryEntryDto {
  questionId: string;
  questionText: string;
  userAnswer: string;
  feedback: string;
  isCorrect: boolean;
  timeTaken: number;
  chunkId: string;
  chunkUploadStatus: string;
  chunkFileMimeType: string;
}

export interface FeedbackPatchPayload {
  email: string;
  interviewHistory: {
    questionId: string;
    questionText: string;
    userAnswer: string;
    timeTaken: number;
    chunkId: string;
    chunkUploadStatus: string;
    chunkFileMimeType: string;
  };
}

class QnaHandler {
  private currentQuestionIndex: number = 0;
  private questions: Array<InterviewHistoryEntryDto> = [];
  private userEmail = (secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) as string) || "";
  private introductoryFeedback: string = "Welcome to your interview. Let's begin with the first question. Please take your time and answer to the best of your ability.";

  /**
   * Initialize the QNA handler with interview data
   * Matches the current question from interviewDTO and sets up the question list
   */
  initialize(interview: InterviewDto): { currentQuestion: string; acknowledgement: string; feedback?: string } {
    if (!interview.interviewHistory || interview.interviewHistory.length === 0) {
      return {
        currentQuestion: "No questions available",
        acknowledgement: "Interview setup complete",
      };
    }

    this.questions = interview.interviewHistory;
    // Find the current question index based on interviewHistory
    if (interview.interviewHistory && interview.interviewHistory.length > 0) {
      this.currentQuestionIndex = interview.interviewHistory.findIndex(
        (question) => question.questionId === interview.currentQuestion
      );
      // If currentQuestion not found in history, default to 0
      if (this.currentQuestionIndex === -1) {
        this.currentQuestionIndex = 0;
      }
    } else {
      this.currentQuestionIndex = 0;
    }

    const currentQ = this.questions[this.currentQuestionIndex];

    // Add introductory feedback for first question
    const feedback = this.currentQuestionIndex === 0 ? this.introductoryFeedback : undefined;

    return {
      currentQuestion: currentQ?.questionText || "No more questions",
      acknowledgement: `Ready for question ${this.currentQuestionIndex + 1}`,
      feedback,
    };
  }

  /**
   * Get the next question after user submits answer
   */
  getNextQuestion(): { nextQuestion: string | null; isFinal: boolean; acknowledgement: string; feedback?: string } {
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.questions.length) {
      return {
        nextQuestion: null,
        isFinal: true,
        acknowledgement: "Interview completed. Thank you!",
      };
    }

    const nextQ = this.questions[this.currentQuestionIndex];
    const previousQ = this.questions[this.currentQuestionIndex - 1];
    
    // Concatenate previous question's feedback with next question if feedback exists
    let questionWithFeedback = nextQ?.questionText || null;
    let feedback: string | undefined;
    
    if (previousQ?.feedback) {
      feedback = previousQ.feedback;
      questionWithFeedback = `${previousQ.feedback}\n\n${nextQ?.questionText || ""}`;
    }

    return {
      nextQuestion: questionWithFeedback,
      isFinal: false,
      acknowledgement: `Moving to question ${this.currentQuestionIndex + 1}`,
      feedback,
    };
  }

  /**
   * Generate signed URL for uploading video chunk to S3
   */
  async generateSignedUrl(
    interviewId: string,
    chunkFileName: string,
    chunkFileMimeType: string,
    chunkSequence: number,
    userId: string 
  ): Promise<SignedUrlResponse> {
    try {
      const payload: UploadChunkPayload = {
        userId,
        interviewId,
        chunkFileName,
        chunkFileMimeType,
        chunkSequence,
      };

      const { response, error } = await httpServiceObj.post<SignedUrlResponse>(
        "/file/gsu2u/USER_INTERVIEW_RECORDING",
        payload
      );
      if (error) {
        throw new Error(error.message || "Error generating signed URL");
      }
      if (!response) {
        throw new Error("No response received from server");
      }
      return response;
    } catch (error) {
      console.error("Failed to generate signed URL:", error);
      throw error;
    }
  }

  /**
   * Upload video chunk to S3 using signed URL
   */
  async uploadChunkToS3(signedUrl: string, videoBlob: Blob, mimeType: string): Promise<void> {
    try {
      await fetch(signedUrl, {
        method: "PUT",
        body: videoBlob,
        headers: {
          "Content-Type": mimeType,
        },
      });
    } catch (error) {
      console.error("Failed to upload chunk to S3:", error);
      throw error;
    }
  }

  /**
   * Patch feedback for the completed question
   */
  async patchFeedback(interviewId: string, feedback: InterviewHistoryEntryDto): Promise<{ needsFollowUp: boolean; feedback: string; isCorrect: boolean }> {
    try {
      const payload: FeedbackPatchPayload = {
        email: this.userEmail,
        interviewHistory: {
          questionId: feedback.questionId,
          questionText: feedback.questionText,
          userAnswer: feedback.userAnswer,
          timeTaken: feedback.timeTaken,
          chunkId: feedback.chunkId,
          chunkUploadStatus: feedback.chunkUploadStatus,
          chunkFileMimeType: feedback.chunkFileMimeType,
        },
      };

      const { response: patchedInterview, error } = await httpServiceObj.patch<InterviewDto>(`/user/interview/question/${interviewId}`, payload);
      
      if (error && !patchedInterview) {
        throw new Error(error.message || "Error patching feedback");
      }
      
      console.log("Patched interview response:", patchedInterview);

      // Extract feedback data from response
      const needsFollowUp = (patchedInterview as any)?.needsFollowUp === "true" || (patchedInterview as any)?.needsFollowUp === true;
      const currentQuestionFeedback = patchedInterview?.interviewHistory?.[this.currentQuestionIndex]?.feedback || "";
      const isCorrect = patchedInterview?.interviewHistory?.[this.currentQuestionIndex]?.isCorrect || false;

      // Update local questions array with feedback
      if (this.questions[this.currentQuestionIndex]) {
        this.questions[this.currentQuestionIndex].feedback = currentQuestionFeedback;
        this.questions[this.currentQuestionIndex].isCorrect = isCorrect;
      }

      return {
        needsFollowUp,
        feedback: currentQuestionFeedback,
        isCorrect,
      };
    } catch (error) {
      console.error("Failed to patch feedback:", error);
      throw error;
    }
  }

  /**
   * Handle complete answer submission workflow:
   * 1. Generate signed URL for video chunk
   * 2. Upload chunk to S3
   * 3. Patch feedback to backend
   */
  async handleAnswerSubmission(
    interviewId: string,
    videoBlob: Blob,
    userAnswer: string,
    timeTaken: number,
    chunkSequence: number,
    userId: string,
    questionMeta?: { questionId?: string; questionText?: string }
  ): Promise<{ success: boolean; nextQuestion: string | null; isFinal: boolean; needsFollowUp: boolean; feedback?: string }> {
    try {
      // Step 1: Generate signed URL
      const signedUrlResponse = await this.generateSignedUrl(
        interviewId,
        `chunk_${chunkSequence}.webm`,
        "application/webm",
        chunkSequence,
        userId
      );

      // Step 2: Upload chunk to S3
      await this.uploadChunkToS3(
        signedUrlResponse.awsS3SignedUrl,
        videoBlob,
        signedUrlResponse.fileMimeType
      );

      // Step 3: Prepare feedback payload and patch
      if ((!this.questions.length || !this.questions[this.currentQuestionIndex]) && questionMeta?.questionId) {
        this.questions[this.currentQuestionIndex] = {
          questionId: questionMeta.questionId,
          questionText: questionMeta.questionText || "",
          userAnswer: "",
          feedback: "",
          isCorrect: false,
          timeTaken: 0,
          chunkId: "",
          chunkUploadStatus: "PENDING",
          chunkFileMimeType: "video/webm",
        };
      }

      const activeQuestion = this.questions[this.currentQuestionIndex];
      const questionId = activeQuestion?.questionId || questionMeta?.questionId || "";
      const questionText = activeQuestion?.questionText || questionMeta?.questionText || "";

      if (!questionId || !questionText) {
        throw new Error("Question metadata is missing. Please restart the interview.");
      }

      const feedbackEntry: InterviewHistoryEntryDto = {
        questionId,
        questionText,
        userAnswer,
        feedback: "", // To be filled by backend
        isCorrect: false, // To be determined by backend
        timeTaken,
        chunkId: signedUrlResponse.cloudFileName,
        chunkUploadStatus: "UPLOADED",
        chunkFileMimeType: signedUrlResponse.fileMimeType,
      };

      const patchResponse = await this.patchFeedback(interviewId, feedbackEntry);

      // Step 4: Check if needs follow-up
      if (patchResponse.needsFollowUp && !patchResponse.isCorrect) {
        // Repeat the current question with feedback
        const currentQ = this.questions[this.currentQuestionIndex];
        const questionWithFeedback = `${patchResponse.feedback}\n\n${currentQ?.questionText || ""}`;
        
        return {
          success: true,
          nextQuestion: questionWithFeedback,
          isFinal: false,
          needsFollowUp: true,
          feedback: patchResponse.feedback,
        };
      }

      // Step 5: Get next question if answer is correct or doesn't need follow-up
      const nextQuestionData = this.getNextQuestion();

      return {
        success: true,
        nextQuestion: nextQuestionData.nextQuestion,
        isFinal: nextQuestionData.isFinal,
        needsFollowUp: false,
        feedback: nextQuestionData.feedback,
      };
    } catch (error) {
      console.error("Answer submission workflow failed:", error);
      throw error;
    }
  }
  
  /**
   * Reset the handler state
   */
  reset(): void {
    this.currentQuestionIndex = 0;
    this.questions = [];
  }
}

export const qnaHandler = new QnaHandler();
