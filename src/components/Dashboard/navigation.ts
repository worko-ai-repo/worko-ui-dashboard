import { NavItem } from "src/types/sidebar";
import { ApplicantsIcon, BulkCVIcon, HomeIcon, InterviewIcon, InviteIcon, InvoiceAndPaymentIcon, JobIcon, ReferralIcon, SupportIcon } from "./icons";

// Define navigation items for all dashboard types
const navigationItems: NavItem[] = [
    {
        id: 'home',
        label: 'Home',
        icon: HomeIcon,
    },
    {
        id: 'jobs',
        label: 'Jobs',
        icon: JobIcon,
        dashboardTypes: ['CORPORATE', 'EMPLOYEE'],
    },
    {
        id: 'applicants',
        label: 'Applicants',
        icon: ApplicantsIcon,
        dashboardTypes: ['CORPORATE'],
    },
    {
        id: 'interviews',
        label: 'Interviews',
        icon: InterviewIcon,
        dashboardTypes: ['CORPORATE', 'CANDIDATE'],
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
        dashboardTypes: ['CORPORATE', 'CANDIDATE'],
    },
    {
        id: 'referrals',
        label: 'Referrals',
        icon: ReferralIcon,
        dashboardTypes: ['CORPORATE', 'EMPLOYEE'],
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
