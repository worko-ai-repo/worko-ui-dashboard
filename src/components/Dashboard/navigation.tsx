import { NavItem } from "src/types/sidebar";
import {
  adminEmployeeIcon,
  ApplicantsIcon,
  BulkCVIcon,
  HomeIcon,
  InterviewIcon,
  InviteIcon,
  InvoiceAndPaymentIcon,
  JobIcon,
  ReferralIcon,
  SupportIcon,
} from "./icons";
import { IdCard, List } from "lucide-react";

// Define navigation items for all dashboard types
const navigationItems: NavItem[] = [
  {
    id: "switch-dashboard",
    label: "Switch Dashboard",
    icon: <i className="fa-solid fa-left-right"></i>,
    dashboardTypes: ["CANDIDATE", "ADMIN","EMPLOYEE"],
  },
  {
    id: "profile",
    label: "Profile",
    icon: InterviewIcon,
    dashboardTypes: ["CANDIDATE","EMPLOYEE"],
  },
  {
    id: "home",
    label: "Home",
    icon: HomeIcon,
    dashboardTypes: ["CORPORATE"],
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: JobIcon,
    dashboardTypes: ["CORPORATE", "CANDIDATE"],
  },
  {
    id: "referral",
    label: "Referral",
    icon: ReferralIcon,
    dashboardTypes: ["EMPLOYEE", "CANDIDATE"],
  },
  {
    id: "guidance",
    label: "Guidance",
    icon: HomeIcon,
    dashboardTypes: ["CANDIDATE","EMPLOYEE"],
  },
  {
    id: "refer-and-earn",
    label: "Refer & Earn",
    icon: HomeIcon,
    dashboardTypes: ["CANDIDATE","EMPLOYEE"],
  },

  {
    id: "subscription",
    label: "Subscription",
    icon: HomeIcon,
    dashboardTypes: ["CANDIDATE"],
  },

  {
    id: "cApplicants",
    label: "Applicants",
    icon: ApplicantsIcon,
    dashboardTypes: ["CORPORATE"],
  },
  {
    id: "aCandidate",
    label: "Candidates",
    icon: <IdCard />,
    dashboardTypes: ["ADMIN"],
  },
  {
    id: "aEmployee",
    label: "Employees",
    icon: adminEmployeeIcon,
    dashboardTypes: ["ADMIN"],
  },
  {
    id: "ajobs",
    label: "Jobs",
    icon: JobIcon,
    dashboardTypes: ["ADMIN"],
  },
  {
    id: "aApplicants",
    label: "Applicants",
    icon: ApplicantsIcon,
    dashboardTypes: ["ADMIN"],
  },
  {
    id: "aAllApplicants",
    label: "All Applicants",
    icon: (
      <div className="border w-4 h-4 flex p-0.5 rounded-sm items-center justify-center">
        <List className="w-4" />
      </div>
    ),
    dashboardTypes: ["ADMIN"],
  },
  {
    id: "aReferrals",
    label: "Referrals",
    icon: ReferralIcon,
    dashboardTypes: ["ADMIN"],
  },
  {
    id: "aGuidance",
    label: "Guidance",
    icon: HomeIcon,
    dashboardTypes: ["ADMIN"],
  },
  {
    id: "aBulkCVCheck",
    label: "Bulk CV Check",
    icon: BulkCVIcon,
    dashboardTypes: ["ADMIN"],
  },
  {
    id: "aInvites",
    label: "Corporate Users",
    icon: InviteIcon,
    dashboardTypes: ["ADMIN"],
  },
  {
    id: "Refer-n-Earn",
    label: "Refer & Earn",
    icon: HomeIcon,
    dashboardTypes: ["ADMIN"],
  },
/*   { //@NEXT-RELEASE : NEXT RELEASE
    id: "aPayments",
    label: "Payments",
    icon: InvoiceAndPaymentIcon,
    dashboardTypes: ["ADMIN"],
  }, */
  {
    id: "aCompanies",
    label: "Companies",
    icon: <i className="fa-solid fa-building"></i>,
    dashboardTypes: ["ADMIN"],
  },
 /*  { //@NEXT-RELEASE : NEXT RELEASE
    id: "aPackages",
    label: "Packages",
    icon: <i className="fa-solid fa-box-open"></i>,
    dashboardTypes: ["ADMIN"],
  }, */

  {
    id: "interviews",
    label: "Interviews",
    icon: InterviewIcon,
    dashboardTypes: ["CORPORATE"],
  },
  {
    id: "bulk-cv-check",
    label: "Bulk CV Check",
    icon: BulkCVIcon,
    dashboardTypes: ["CORPORATE"],
  },
  {
    id: "invites",
    label: "Invites",
    icon: InviteIcon,
    dashboardTypes: ["CORPORATE"],
  },
  /* {
        id: 'invoice-&-payment',
        label: 'Invoice & Payment',
        icon: InvoiceAndPaymentIcon,
        dashboardTypes: ['CORPORATE'],
    }, */
  /* { //@NEXT-RELEASE : NEXT RELEASE
    id: "support",
    label: "Support",
    icon: SupportIcon,
    dashboardTypes: ["ADMIN", "EMPLOYEE", "CANDIDATE"],
  }, */
];

export default navigationItems;
