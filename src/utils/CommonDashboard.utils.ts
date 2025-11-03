import { TimelineStep } from "@Components/Shared/Timeline";
import { ReferralStatusEnum } from "@Enums/JobAndApplication.enum";
import { ApplicantDetails, ReferralDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { CompanyDto, UserBasicDetailsDto } from "@Interfaces/JobsAndCompany.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import {
  GUIDANCE_REQUEST_TYPE_LABELS,
  GUIDANCE_STATUS_COLORS,
  GUIDANCE_STATUS_LABELS,
  REFERRAL_STATUS_COLORS,
  REFERRAL_STATUS_LABELS,
  STATUS_LABELS,
  STATUS_TYPE_MAP,
} from "../types/common.constants";
import {
  ReferralStatusType,
  UserGuidanceRequestStatusType,
  UserGuidanceRequestType,
} from "src/types/JobsAndApplication.type";

export interface ExtraReferralDetailsResponse {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyId: string;
  score: number;
  status: ReferralStatusType;
  requestDate: string;
  viewCvLink: string;
  jobUrl: string;
  jobDescription: string;
}

class CommonDashboardServices {
  constructor() {}

  //getter for referral status colors
  public get getReferralStatusColor(): Record<ReferralStatusType, string> {
    return REFERRAL_STATUS_COLORS;
  }
  //getter for referral status labels
  public get getReferralStatusAlias(): Record<ReferralStatusType, string> {
    return REFERRAL_STATUS_LABELS;
  }
  //getter for the guidance status labels
  public get getGuidanceStatusAlias(): Record<UserGuidanceRequestStatusType, string> {
    return GUIDANCE_STATUS_LABELS;
  }
  //getter for the guidance status colors
  public get getGuidanceStatusColor(): Record<UserGuidanceRequestStatusType, string> {
    return GUIDANCE_STATUS_COLORS;
  }
  //getter for the guidance request types
  public get getGuidanceRequestAlias(): Record<UserGuidanceRequestType, string> {
    return GUIDANCE_REQUEST_TYPE_LABELS;
  }

  // Method to fetch extra referral details (stub implementation)
  public getReferralTimeline(currentStatus: ReferralDetailsDto): TimelineStep[] {
    // define the "positive" sequence of statuses
    const POSITIVE_FLOW: ReferralStatusEnum[] = [
      ReferralStatusEnum.AWAITING,
      ReferralStatusEnum.ACCEPTED,
      ReferralStatusEnum.DONE,
    ];

    // find index of the current status in the positive flow
    const currentIndex = POSITIVE_FLOW.indexOf(currentStatus?.status as ReferralStatusEnum);

    // if status not part of positive flow (rejected, withdrawn, cancelled)
    if (currentIndex === -1) {
      return [];
    }

    // build the timeline steps only up to the current status
    return POSITIVE_FLOW.slice(0, currentIndex + 1).map((status, index) => {
      const label = STATUS_LABELS[status];
      const type = STATUS_TYPE_MAP[status] ?? "pending";

      return {
        label,
        date: new Date(currentStatus.updatedAt).toISOString(), // you can replace with real date from row if available
        status: index < currentIndex ? "success" : type, // mark previous as completed (success), current as its mapped type
      };
    });
  }

  // Stub method to simulate fetching extra referral details
  public async fetchExtraReferralDetails(
    data: ReferralDetailsDto
  ): Promise<ExtraReferralDetailsResponse | null> {
    try {
      // Fetch the company details from the company ID
      const { response: companyResponse, error: companyError } =
        await httpServiceObj.get<CompanyDto>(`/admin/company/${data.companyId}`);
      if (companyError) {
        console.error(`Error fetching company details: ${companyError}`);
        return null;
      }
      if (!companyResponse) {
        console.error("Company response is null");
        return null;
      }
      const companyDetails: CompanyDto = companyResponse;

      // Fetch user details from the user ID
      const userId = data.PK.slice(8); // Extract user ID from PK
      const { response: userResponse, error: userError } =
        await httpServiceObj.get<ApplicantDetails>(`/admin/user/${userId}/detail`);
      if (userError) {
        console.error(`Error fetching user details: ${userError}`);
        return null;
      }
      if (!userResponse) {
        console.error("User response is null");
        return null;
      }
      const userDetails: ApplicantDetails = userResponse;

      // Fetch user resume href from S3
      const { response: resumeResponse, error: resumeError } = await httpServiceObj.get<{
        objectUrl: string;
      }>(`/file/${userDetails.id}/${userDetails.CV}/USER_RESUME`);
      if (resumeError) {
        console.error(`Error fetching resume link: ${resumeError}`);
        return null;
      }
      const resumeLink: string = resumeResponse?.objectUrl || "";

      // Format and return the result
      const result: ExtraReferralDetailsResponse = {
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.number,
        companyName: companyDetails.name,
        companyId: companyDetails.id,
        score: data.matchingScore,
        status: data.status,
        requestDate: new Date(data.createdAt).toLocaleDateString(),
        viewCvLink: resumeLink,
        jobUrl: data.jobUrl,
        jobDescription: data?.jdExtracted || "No job description available",
      };

      return result;
    } catch (error: any) {
      console.error(`Unexpected error in fetchExtraReferralDetails: ${error.message || error}`);
      return null;
    }
  }
}
const CommonDashboardServicesObj = new CommonDashboardServices();
export default CommonDashboardServicesObj;
