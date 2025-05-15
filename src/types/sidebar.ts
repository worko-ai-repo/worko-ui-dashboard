import { ComponentType, ReactElement, ReactNode, SVGProps } from "react";

export type DashboardType = 'CORPORATE' | 'EMPLOYEE' | 'CANDIDATE' | 'ADMIN';

export type TabId =
    | 'home'
    | 'jobs'
    | 'invites'
    | 'applicants'
    | 'interviews'
    | 'hire'
    | 'bulk-cv-check'
    | 'referrals'
    | 'invoice-&-payment'
    | 'support';

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