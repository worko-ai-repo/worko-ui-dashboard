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
  UserIcon,
  Subscription,
  Guidance,
  FolderOpenIcon,
  Warehouse,
  Vault,
} from "./icons";
import { IdCard, List, Settings, User, Zap } from "lucide-react";

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
    icon: UserIcon,
    dashboardTypes: ["CANDIDATE","EMPLOYEE"],
  },
  {
    id: "home",
    label: "Analytics",
    icon: HomeIcon,
    dashboardTypes: ["CORPORATE","ADMIN"],
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: JobIcon,
    dashboardTypes: ["CORPORATE", "CANDIDATE"],
  },
  // referral is being removed from everywhere
  // {
  //   id: "referral",
  //   label: "Referral",
  //   icon: ReferralIcon,
  //   dashboardTypes: ["EMPLOYEE", "CANDIDATE"],
  // },
  {
    id: "guidance",
    label: "Guidance",
    icon: Guidance,
    dashboardTypes: ["CANDIDATE","EMPLOYEE"],
  },
  {
    id: "refer-and-earn",
    label: "Refer & Earn",
    icon: InterviewIcon,
    dashboardTypes: ["CANDIDATE","EMPLOYEE"],
  },
  // {
  //   id: "subscription",
  //   label: "Subscription",
  //   icon: Subscription,
  //   dashboardTypes: ["CANDIDATE"],
  // },
  {
    id: "documentVault",
    label: "Document Vault",
    icon: Vault,
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
  // referral is being removed from everywhere
  // {
  //   id: "aReferrals",
  //   label: "Referrals",
  //   icon: ReferralIcon,
  //   dashboardTypes: ["ADMIN"],
  // },
  {
    id: "agencyList",
    label: "Agency List",
    icon: Warehouse,
    dashboardTypes: ["ADMIN", "CORPORATE"],
    expandable: true,
    child: [
      { 
        id: "allCandidates",
        label: "Agency candidates", 
        icon: Warehouse,
        dashboardTypes: ["ADMIN", "CORPORATE"],
        expandable:false,
      }
    ]
  },
  // {
  //   id: "aSearchDB",
  //   label: "A.T.L.A.S",
  //   icon: FolderOpenIcon,
  //   dashboardTypes: ["ADMIN","CORPORATE"],
  //   expandable: true,
  //   child: [
  //     { 
  //       id: "aDatabase",
  //       label: "My database", 
  //       icon: FolderOpenIcon,
  //       dashboardTypes: ["ADMIN", "CORPORATE"],
  //       expandable:false,
  //     }
  //   ]
  // },
  {
    id: "aDatabase",
    label: "My database", 
    icon: FolderOpenIcon,
    dashboardTypes: ["ADMIN", "CORPORATE"],
    expandable:true,
    child: [
      { 
        id: "aSearchDB",
        label: "A.T.L.A.S",
        icon: FolderOpenIcon,
        dashboardTypes: ["ADMIN","CORPORATE"],
        expandable: false,
      }
    ]
  },
  {
    id: "aGuidance",
    label: "Guidance",
    icon: Guidance,
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
    icon: InterviewIcon,
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

/*   {
    id: "interviews",
    label: "Interviews",
    icon: InterviewIcon,
    dashboardTypes: ["CORPORATE"],
  }, */
  {
    id: "bulk-cv-check",
    label: "Bulk CV Check",
    icon: BulkCVIcon,
    dashboardTypes: ["CORPORATE"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings />,
    dashboardTypes: ["CORPORATE"],
    expandable:true,
    child: [
      {
        id: "invites",
        label: "Invites",
        icon: InviteIcon,
        dashboardTypes: ["CORPORATE"],
        expandable: false,
      },
      { 
        id: "referralsSettings",
        label: "Referral Settings",
        icon: <User/>,
        dashboardTypes: ["CORPORATE"],
        expandable: false,
      },
      // { 
      //   id: "driveResumeFetcher",
      //   label: "Drive Fetcher",
      //   icon: <User/>,
      //   dashboardTypes: ["CORPORATE"],
      //   expandable: false,
      // },
      // { 
      //   id: "profileSettings",
      //   label: "Profile Settings",
      //   icon: <User/>,
      //   dashboardTypes: ["CORPORATE"],
      //   expandable: false,
      // },
    ]
  },
  // {
  //   id: "recharge",
  //   label: "Recharge",
  //   icon: <Zap/>,
  //   dashboardTypes: ["CORPORATE"],
  //   expandable:true,
  //   child: [
  //     {
  //       id: "credits",
  //       label: "Credits",
  //       icon: ReferralIcon,
  //       dashboardTypes: ["CORPORATE"],
  //       expandable: false,
  //     },
  //     {
  //       id: "recruiterRecharge",
  //       label: "Recruiter Recharge",
  //       icon: ReferralIcon,
  //       dashboardTypes: ["CORPORATE"],
  //       expandable: false,
  //     },
  //   ]
  // },
  /* {
        id: 'invoice-&-payment',
        label: 'Invoice & Payment',
        icon: InvoiceAndPaymentIcon,
        dashboardTypes: ['CORPORATE'],
    }, */
  // { //@NEXT-RELEASE : NEXT RELEASE
  //   id: "support",
  //   label: "Support",
  //   icon: SupportIcon,
  //   dashboardTypes: ["ADMIN", "EMPLOYEE", "CANDIDATE"],
  // },
];

export default navigationItems;
