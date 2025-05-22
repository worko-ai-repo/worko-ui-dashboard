import { NavItem } from "src/types/sidebar";
import { ApplicantsIcon, BulkCVIcon, HomeIcon, InterviewIcon, InviteIcon, InvoiceAndPaymentIcon, JobIcon, ReferralIcon, SupportIcon } from "./icons";

// Define navigation items for all dashboard types
const navigationItems: NavItem[] = [
    {
        id: 'home',
        label: 'Home',
        icon: HomeIcon,
        dashboardTypes: ['CORPORATE']
    },
    {
        id:'profile',
        label:'Profile',
        icon:InterviewIcon,
        dashboardTypes: ['CANDIDATE']
    },
    {
        id: 'jobs',
        label: 'Jobs',
        icon: JobIcon,
        dashboardTypes: ['CORPORATE', 'EMPLOYEE', 'CANDIDATE'],
    },
    {
        id: 'applicants',
        label: 'Applicants',
        icon: ApplicantsIcon,
        dashboardTypes: ['CORPORATE'],
    },
    {
        id: 'bulk-cv-check',
        label: 'Bulk CV Check',
        icon: BulkCVIcon,
        dashboardTypes: ['CORPORATE'],
    },
    {
        id: 'invites',
        label: 'Invites',
        icon: InviteIcon,
        dashboardTypes: ['CORPORATE'],
    },
    {
        id: 'referral',
        label: 'Referral',
        icon: ReferralIcon,
        dashboardTypes: ['CORPORATE', 'EMPLOYEE', 'CANDIDATE'],
    },
    {
        id: 'guidance',
        label: 'Guidance',
        icon: HomeIcon,
        dashboardTypes: ['CANDIDATE']
      },
    {
        id: 'refer-and-earn',
        label: 'Refer & Earn',
        icon: HomeIcon,
        dashboardTypes: ['CANDIDATE']
      },
      
      {
        id: 'subscription',
        label: 'Subscription',
        icon: HomeIcon,
        dashboardTypes: ['CANDIDATE']
      },
    
    {
        id: 'interviews',
        label: 'Interviews',
        icon: InterviewIcon,
        dashboardTypes: ['CORPORATE'],
    },
    {
        id: 'invoice-&-payment',
        label: 'Invoice & Payment',
        icon: InvoiceAndPaymentIcon,
        dashboardTypes: ['CORPORATE'],
    },
    {
        id: 'support',
        label: 'Support',
        icon: SupportIcon,
    },
];

export default navigationItems;
