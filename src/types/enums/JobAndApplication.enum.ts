/**
 * JobApplicationStatusEnum
 *
 * @description: Enum representing the various statuses of a job application.
 */
export enum JobApplicationStatusEnum {
  ALL = "ALL", // used for filtering in job application list
  APPLIED = "APPLIED",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  ON_HOLD = "ON_HOLD",
  CV_DOWNLOADED = "CV_DOWNLOADED",
  UNDER_EVALUATION = "UNDER_EVALUATION",

  PROCESSING_INTERVIEW = "PROCESSING_INTERVIEW",
  INTERVIEW_DONE = "INTERVIEW_DONE",
  HIRING_IN_PROCESS = "HIRING_IN_PROCESS",

  DOCUMENT_REQUESTED = "DOCUMENT_REQUESTED", // send email to cand
  DOCUMENT_ADDITIONAL_REQUESTED = "DOCUMENT_ADDITIONAL_REQUESTED",
  DOCUMENT_SUBMITTED = "DOCUMENT_SUBMITTED", // send email to job poster
  DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED = "DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED",
  DOCUMENT_REVISION_REQUESTED = "DOCUMENT_REVISION_REQUESTED", // whenever submitted document is re-requested
  DOCUMENT_REVISION_REQUEST_SUBMITTED = "DOCUMENT_REVISION_REQUEST_SUBMITTED", // when re-requested doc is submitted
  DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED",

  OFFER_SENT = "OFFER_SENT", // send email to cand
  OFFER_ISSUE_RAISED = "OFFER_ISSUE_RAISED", // candidate raised issue on offer letter
  REVISED_OFFER_SENT = "REVISED_OFFER_SENT",

  HIRED = "HIRED",
  JOINED = "JOINED", // send email to both cand and job poster

  REVISED_LETTER = "REVISED_LETTER",
  OFFER_ACCEPTED = "OFFER_ACCEPTED"
}



/**
 * JobStatusTypeEnum
 *
 * @description: Enum representing the various statuses a job can have.
 */

export enum JobStatusTypeEnum {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  CLOSED = "CLOSED",
  ARCHIVED = "ARCHIVED",
}

/**
 * ReferralStatusEnum
 * 
 * @description - Enum representing the various statuses of a referral.
 */
export enum ReferralStatusEnum {
  // User Referral related status
  AWAITING = "AWAITING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  WITHDRAWN = "WITHDRAWN",
  DONE = "DONE",
}
