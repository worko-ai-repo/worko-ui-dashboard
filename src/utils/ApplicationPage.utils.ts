import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { parseScorePoints, ScorePoint } from "./DetailedAnalysis.utils";

class JobApplicationService {
  private readonly THRESHOLD_SCORE = 50;
  private readonly UPPER_MID_SCORE = 70;
  private readonly HIGH_SCORE = 90;
  private readonly STATUS_REJECTED = "REJECTED";
  private readonly STATUS_APPLIED = "APPLIED";

  constructor() {}

  /**
   * Determines if the "Push to Recruiter" button should be shown for a job application.
   */
  public showPushToRecruiterButton(jobApplication: JobApplicationDetailsDto): boolean {
    if (!jobApplication?.statusTracker?.length || !jobApplication.matchingScore) return false;

    // Find the latest APPLIED status change
    const appliedStatus = [...jobApplication.statusTracker]
      .reverse()
      .find((entry) => entry.newStatus === this.STATUS_APPLIED);

    if (!appliedStatus?.actionDate) return false;

    // Calculate hours since APPLIED
    const hoursSinceApplied =
      (new Date().getTime() - new Date(appliedStatus.actionDate).getTime()) / (1000 * 60 * 60);

    const isWithin24Hours = hoursSinceApplied < 24;

    // Score validity: (50–70) OR (>=90), and scoreDetails must exist
    const scoreIsValid =
      ((jobApplication.matchingScore >= this.THRESHOLD_SCORE &&
        jobApplication.matchingScore <= this.UPPER_MID_SCORE) ||
        jobApplication.matchingScore >= this.HIGH_SCORE) &&
      Boolean(jobApplication.scoreDetails);

    return (
      isWithin24Hours &&
      jobApplication.status !== this.STATUS_REJECTED &&
      !jobApplication.displayToCorporate &&
      scoreIsValid
    );
  }

  /**
   * Returns the appropriate score details or rejection feedback for a job application.
   */
  public getScoreDetails(jobApplication: JobApplicationDetailsDto): {
    feedback: any;
    type: "REJ" | "SCORE";
  } {
    if (
      !jobApplication ||
      jobApplication.matchingScore === null ||
      jobApplication.matchingScore === undefined
    ) {
      console.error("Invalid input: job is null or undefined");
      return {
        feedback: null,
        type: "REJ",
      };
    }

    const isSentToCorporate = jobApplication.displayToCorporate ?? false;

    if (!isSentToCorporate) {
      if (
        jobApplication.matchingScore >= this.THRESHOLD_SCORE &&
        jobApplication.matchingScore <= this.UPPER_MID_SCORE
      ) {
        return this.createResponse(jobApplication.rejectionFeedbackBySystem, "REJ");
      } else if (jobApplication.matchingScore >= this.HIGH_SCORE) {
        return this.createResponse(jobApplication.scoreDetails, "SCORE");
      } else if (jobApplication.matchingScore < this.THRESHOLD_SCORE) {
        return this.createResponse(jobApplication.rejectionFeedbackBySystem, "REJ");
      }
    }
    return this.createResponse(
      jobApplication.scoreDetails || "No score details available",
      "SCORE"
    );
  }

  /**
   * Helper method to create a response object.
   */
  private createResponse(feedback: any, type: "REJ" | "SCORE") {
    return { feedback, type };
  }

  public getRejectionReason(data: JobApplicationDetailsDto | string | null): string[] {
    if (!data) return [];
  
    let feedback: string | undefined;
  
    if (typeof data === "string") {
      feedback = data;
    } else {
      feedback = data.rejectionFeedbackBySystem;
    }
  
    if (!feedback) return [];
  
    try {
      const scorePoints: ScorePoint[] = JSON.parse(feedback);
      return scorePoints.map(point => point.detail || "");
    } catch (e) {
      console.error("Invalid rejection feedback format:", e);
      return [];
    }
  }
  
}

const jobApplicationServiceObj = new JobApplicationService();
export default jobApplicationServiceObj;
