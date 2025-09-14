import { CorporateUserDetail } from "@Context/App.context";
import { AuthLoginForGeneralUserDto } from "@Interfaces/Auth.dto";
import { CVExtractParsed } from "@Interfaces/CorporateDashboard.dto";


export interface NormalizedUser {
    id: string;
	email: string;
	updatedAt: string;
	PK: string;
	SK: string;
	GSI1PK: string;
	GSI1SK: string;
	fullName: string;
	userType: string[]; // e.g. ['CAND', 'EMP'] or ['corporate-admin']
	isCorporate: boolean;

	// Optional depending on user type
	companyId?: string;

	// General User only
	profileImageUrl?: string;
    profileImageAwsS3SignedUrl?:string;
	cvUrl?: string;
	CTC?: number;
	ECTC?: number;
	YOE?: number;
	noticePeriod?: number;
	location?: string;
	about?: string;
	cvExtractParsed?: CVExtractParsed | null;

	// Shared
	createdAt: string;
}
export function normalizeUserData(raw: Partial<CorporateUserDetail | AuthLoginForGeneralUserDto>): NormalizedUser {
    const isCorporate = "corporateUserType" in raw;

    let fullName: string;
    if (isCorporate) {
        fullName = [
            raw.firstName?.trim() ?? '',
            raw.lastName?.trim() ?? ''
        ].filter(Boolean).join(' ') || 'Corporate User';
    } else {
        fullName = raw.name?.trim() ?? 'User';
    }

    return {
        id: raw.id ?? '',
        email: isCorporate ? raw.email ?? '' : raw.emailList?.primary ?? raw.email ?? '',
        fullName,
        updatedAt: raw.updatedAt ?? new Date().toISOString(),
        PK: raw.PK ?? '',
        SK: isCorporate ? raw.SK ?? '' : '',
        GSI1PK: raw.GSI1PK ?? '',
        GSI1SK: raw.GSI1SK ?? '',
        userType: isCorporate
            ? raw.corporateUserType ? [raw.corporateUserType] : []
            : Array.isArray(raw.userType) ? raw.userType : [],
        isCorporate,

        // Corporate
        companyId: isCorporate ? raw.companyId ?? '' : undefined,

        // General
        profileImageUrl: isCorporate ? undefined : raw.profileImageAwsS3SignedUrl ?? '',
        cvUrl: isCorporate ? undefined : raw.cvAwsS3SignedUrl ?? '',
        CTC: isCorporate ? undefined : raw.CTC ?? 0,
        ECTC: isCorporate ? undefined : raw.ECTC ?? 0,
        YOE: isCorporate ? undefined : raw.YOE ?? 0,
        noticePeriod: isCorporate ? undefined : raw.noticePeriod ?? 0,
        location: isCorporate ? undefined : raw.location ?? '',
        about: isCorporate ? undefined : raw.about ?? '',

        createdAt: raw.createdAt ?? new Date().toISOString(),
    };
}


