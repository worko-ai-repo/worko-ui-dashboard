import { ComponentType, SVGProps } from "react";

export type DashboardType = 'CORPORATE' | 'EMPLOYEE' | 'CANDIDATE' | 'ADMIN';

export type TabId =
//Candidate Dashboard Tabs
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
| 'applicants'
| 'interviews'
| 'hire'
| 'bulk-cv-check'
| 'referrals'
| 'invoice-&-payment';

export interface NavItem {
    id: TabId;
    label: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    dashboardTypes?: DashboardType[];
}

export interface UserDetails {
    name?: string;
    avatar?: string;
}