import { JobApplicationStatusEnum, JobStatusTypeEnum, ReferralStatusEnum } from "@Enums/JobAndApplication.enum";

/**
 * JobStatus
 * 
 * @description -  Represent the type of status a job can have
 */
export type JobStatusType = `${JobStatusTypeEnum}`;

/**
 * JobApplicationStatusType
 * 
 * @description: Type representing the possible values of JobApplicationStatusEnum.
 */
export type JobApplicationStatusType = `${JobApplicationStatusEnum}`;

/**
 * JobTypeofEmploymentType
 * 
 * @description: Type representing the possible values of job typeof employment.
 */
export type JobTypeofEmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

/**
 * ReferralStatusType
 * 
 * @description - Represents the type of status a referral can have
 */
export type ReferralStatusType = `${ReferralStatusEnum}`;