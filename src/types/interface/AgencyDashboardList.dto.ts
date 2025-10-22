export interface AgencyDashboardList {
  id: string;
  pk: string;
  sk: string;
  companyName:string;
  senderName:string;
  date:string;
}

export interface AgencyJobsList {
  id: string;
  pk: string;
  sk: string;
  companyName:string;
  profile:string;
  YOEStart: number;
  YOEEnd: number;
  salaryStart: number;
  salaryEnd: number;
  location:string;
  noticePeriod: number;
  dateAssigned: string,
  candidatesUploaded: number;
  candidatesRejected: number;
  candidatesInProcess: number;
}