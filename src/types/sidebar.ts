import { ComponentType, SVGProps } from "react";

export type DashboardType = 'CORPORATE' | 'EMPLOYEE' | 'CANDIDATE' | 'ADMIN';

export type TabId =
//Candidate Dashboard Tabs
| 'switch-dashboard'
| 'profile'
| 'jobs'
| 'referral'
| 'guidance'
| 'refer-and-earn'
| 'subscription'
| 'support'
// Corporate Dashboard Tabs
| 'home'
| 'invites'
| 'cApplicants'
| 'Aapplicants'
| 'interviews'
| 'hire'
| 'bulk-cv-check'
| 'referrals'
| 'invoice-&-payment'
// Admin Dashboard Tabs
| 'aApplicants';

export interface NavItem {
    id: TabId;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>> | React.ReactNode; //<i class="fa-solid fa-left-right"></i>
    dashboardTypes?: DashboardType[];
}

export interface UserDetails {
    name?: string;
    avatar?: string;
}