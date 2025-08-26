/**
 * JobApplicationStatusEnum
 *
 * @description: Enum representing the various statuses of a job application.
 */
export enum JobApplicationStatusEnum {
  ALL = "ALL", // used for filtering in job application list
  APPLIED = "APPLIED",
  ACCEPTED = "ACCEPTED",
  CV_DOWNLOADED = "CV_DOWNLOADED",
  DOCUMENT_REQUESTED = "DOCUMENT_REQUESTED", // send email to cand
  ADDITIONAL_DOCUMENT_REQUESTED="ADDITIONAL_DOCUMENT_REQUESTED",
  DOCUMENT_REVISION_REQUESTED = "DOCUMENT_REVISION_REQUESTED", // whenever submitted document is re-requested by corporate or worko-admin
  DOCUMENT_REVISION_REQUEST_SUBMITTED = "DOCUMENT_REVISION_REQUEST_SUBMITTED", // whenever re-requested document is submitted by candidate to corporate or worko-admin
  DOCUMENT_SUBMITTED = "DOCUMENT_SUBMITTED", // send email to job poster
  DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED",
  HIRING_IN_PROCESS = "HIRING_IN_PROCESS",
  INTERVIEW_DONE = "INTERVIEW_DONE",
  OFFER_SENT = "OFFER_SENT", // send email to cand
  ON_HOLD = "ON_HOLD",
  PROCESSING_INTERVIEW = "PROCESSING_INTERVIEW",
  UNDER_EVALUATION = "UNDER_EVALUATION",
  EVALUATION_RECEIVED = "EVALUATION_RECEIVED", // send email to job poster
  HIRED = "HIRED",
  JOINED = "JOINED", // send email to both cand and job poster
  REJECTED = "REJECTED",
  OFFER_ACCEPTED = "OFFER_ACCEPTED",
  REVISED_LETTER="REVISED_LETTER",
  REVISED_OFFER_SENT="REVISED_OFFER_SENT",
  DOCUMENT_ADDITIONAL_REQUESTED="DOCUMENT_ADDITIONAL_REQUESTED",
  OFFER_ISSUE_RAISED="OFFER_ISSUE_RAISED",
  DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED="DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED",
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
