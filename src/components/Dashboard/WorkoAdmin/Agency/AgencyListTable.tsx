import React, { useState } from "react";
import { CircleMinus, CirclePause, Clipboard, ClipboardCheck, Eye, Pause, Pencil, Trash2, User } from "lucide-react";
import { DynamicTable } from "../../../Shared/DynamicTable";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { NormalizedUser } from "@Utils/NormalizeUser";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import CreatedByDisplay from "@Components/Shared/PostJob/CreatedByDisplay";
import { AgencyDatabaseApplicantDetailsDto } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { Edit, View } from "@AssetsFolder/assets";
import AssignJobModal from "./modals/AssignJobModal";
import RemoveJobModal from "./modals/RemoveJobModal";
import EditAgencyModal, { FormValues } from "./modals/EditAgencyModal";
import PauseAgencyModal from "./modals/PauseAgencyModal";
import DeleteAgencyModal from "./modals/DeleteAgencyModal";

export const getCvViewDate = (statusTracker: any[]) => {
  const cvDownloadedEntry = statusTracker?.find((entry) => entry.newStatus === "CV_DOWNLOADED");
  return cvDownloadedEntry
    ? new Date(cvDownloadedEntry.actionDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "-";
};

export const getCvDownloadedById = (row: any) => {
  const cvDownloadedEntry = row.statusTracker?.find((entry:any) => entry.newStatus === "CV_DOWNLOADED");
  const isUserIdTypeULID = cvDownloadedEntry?.userId?.length === 26 || cvDownloadedEntry?.userId?.includes("-");
  return isUserIdTypeULID ? { updatedByUserId: cvDownloadedEntry?.userId || "" } : { updatedByCorporateUserId: cvDownloadedEntry?.userId || "" };
};

export const getCurrentPositionCell = (row: any) => {
  let currentExperience = row.multipleCandidateExperience?.find((exp: any) => !exp.endDate);
  if (!currentExperience) {
    currentExperience = row.multipleCandidateExperience
      ?.filter((exp: any) => exp.endDate)
      .sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())?.[0];
  }
  return currentExperience || null;
};


export default function AgencyListTable(props: any) {
  const {
    ListSelection,
    data,
    handleUpdate,
    userType,
  } = props as any;

  // State required for table interactions
  const [dropdownVisibleRows, setDropdownVisibleRows] = useState<string[]>([]);
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState<string>("");
  const [scorePointsModal, setScorePointsModal] = useState<any>();
  const [pdfViewDetailsID, setPdfViewDetailsID] = useState<string | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState({ isOpen: false, applicant: {} as any, action: "EDIT" as "EDIT" | "VIEW" });
  const [editProfileView,setEditProfileView] = useState<boolean>(false)
  const [editProfileData,setEditProfileData] = useState<any>()
  const [feedbackModalOpen,setFeedbackModalOpen] = useState<boolean>(false)
  const [isAssignJobModelOpen,setIsAssignJobModelOpen] = useState<boolean>(false);
  const [isRemoveJobModelOpen,setIsRemoveJobModelOpen] = useState<boolean>(false);
  const [isEditAgencyModelOpen,setIsEditAgencyModelOpen] = useState<boolean>(false);
  const [isPauseAgencyModelOpen,setIsPauseAgencyModelOpen] = useState<boolean>(false);
  const [isDeleteAgencyModelOpen,setIsDeleteAgencyModelOpen] = useState<boolean>(false);
  
  // App context
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };

  // Sorting hook (keeps same fallback keys as before)
  const keyFallbacks = {
    yoe: ["yoe", "applicantDetails.YOE"],
    matchingScore: ["matchingScore", "scoreDetails.matchingScore", "scoreDetails.matchingScorePercentage"],
    experience: ["applicantDetails.YOE", "yoe"],
    location: ["applicantDetails.location"],
    applicantDetails_candidateExperience_designation: ["applicantDetails.candidateExperience.designation"],
    applicantDetails_CTC: ["applicantDetails.CTC"],
    current_CTC: ["applicantDetails.CTC"], //changed currentCTC to current_CTC
    ECTC: ["applicantDetails.ECTC"],
    remarks: ["remarks", "remark"],
  };
  const { sortedData, onSortChange } = useSortableData(data as any, keyFallbacks);

  // Column definitions (kept same as previous "All" view)
  const columns = [
    {
        key: "agencyName",
        label: "Agency Name",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px] text-center'>
                <span 
                title={row?.agencyName}
                className="truncate block w-full">{row?.agencyName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "email",
        label: "Email ID",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px] text-center'>
                <span title={row?.emailId}
                className="truncate block w-full">{row?.emailId ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contactName",
        label: "Contact person name",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span 
                title={row?.contactName}
                className="truncate block w-full">{row?.contactName ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contactNumber",
        label: "Ph no",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.contactNumber ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "dateActivated",
        label: "Date activated",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[150px]'>
            <span>{row?.dateActivated ?? "NA"}</span>
        </div>
        ),
    },
    {
        key: "asignedJobs",
        label: "Assigned Jobs",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto bc'>
                <span>{row?.assignedJobs ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "totalSubmitted",
        label: "Total submitted",
        sortable: true,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto bc'>
                <span>{row?.totalCandidateSubmitted ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "totalRejected",
        label: "Total rejected",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto bc'>
                <span>{row?.totalCandidateRejected ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "totalHired",
        label: "Total hired",
        contentWidth: `max-w-none`,
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto bc'>
                <span>{row?.totalCandidateHired ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "action",
        label: "Action",
        sortable: false,
        contentWidth: `max-w-none`,
        render: (row: AgencyDatabaseApplicantDetailsDto) => {
        return (
            <div className='flex justify-start m-auto gap-1'>
                <div className="flex flex-row">
                    <button
                        className="btn-sky flex items-center space-x-2"
                        onClick={() => {
                        setIsAssignJobModelOpen(true)
                        setEditProfileData(row);
                        }}
                    >
                        <ClipboardCheck className="w-5 h-5 shrink-0" />
                        <span className="text-xs">Assign jobs</span>
                    </button>
                </div>

                <div className="flex flex-row">
                    <button className="btn-blue flex items-center space-x-2"
                        onClick={()=>{
                            setIsRemoveJobModelOpen(true)
                            setEditProfileData(row)
                        }}>
                        <CircleMinus className="w-5 h-5 shrink-0" />
                        <span className="text-xs">Remove jobs</span>
                    </button>
                </div>

                <button className="border rounded-lg p-2"
                    onClick={()=>{
                        setIsEditAgencyModelOpen(true)
                        setEditProfileData(row)
                    }}>
                    <Pencil className="w-5 h-5 shrink-0 rounded-sm" />
                </button>

                <button className="border rounded-lg p-2"
                    onClick={()=>{
                        setIsPauseAgencyModelOpen(true)
                        setEditProfileData(row)
                    }}>
                    <CirclePause className="w-5 h-5 shrink-0" />
                </button>

                <button className="border rounded-lg p-2 bg-red-500 text-white"
                    onClick={()=>{
                        setIsDeleteAgencyModelOpen(true)
                        setEditProfileData(row)
                    }}>
                    <Trash2 className="w-5 h-5 shrink-0" />
                </button>
            </div>
        )}
    },
    {
        key: "GSTIN",
        label: "GSTIN no",
        sortable: true,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
            <div className='flex justify-center m-auto w-[150px]'>
                <span>{row?.GSTIN ?? "NA"}</span>
            </div>
        ),
    },
    {
        key: "contractCopy",
        label: "Contract copy",
        sortable: false,
        render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className='flex justify-center m-auto w-[40px]'>
            {/* <img src={View} className="w-7 h-7 btn-sky shrink-0" /> */}
            <a href={row.contractLink} target="_blank" rel="noopener noreferrer" className="flex flex-row justify-center items-center">
                <img src={View} className="w-8 h-8 btn-sky shrink-0" />
                {/* <Eye className="cursor-pointer hover:text-blue-500" /> */}
            </a>
        </div>
        )
    },
];

const dummyJobData = [
  {
    id: "56739",
    jobName: "Frontend Software Developer",
    location: "Bangalore",
    CTC: 40
  },
  {
    id: "56740",
    jobName: "Backend Software Engineer",
    location: "Hyderabad",
    CTC: 38
  },
  {
    id: "56741",
    jobName: "Full Stack Developer",
    location: "Pune",
    CTC: 42
  },
  {
    id: "56742",
    jobName: "UI/UX Designer",
    location: "Delhi",
    CTC: 30
  },
  {
    id: "56743",
    jobName: "Data Scientist",
    location: "Mumbai",
    CTC: 45
  },
  {
    id: "56744",
    jobName: "DevOps Engineer",
    location: "Chennai",
    CTC: 39
  },
  {
    id: "56745",
    jobName: "Mobile App Developer",
    location: "Kolkata",
    CTC: 35
  },
  {
    id: "56746",
    jobName: "Cloud Solutions Architect",
    location: "Noida",
    CTC: 48
  },
  {
    id: "56747",
    jobName: "Machine Learning Engineer",
    location: "Ahmedabad",
    CTC: 50
  },
  {
    id: "56748",
    jobName: "QA Automation Tester",
    location: "Jaipur",
    CTC: 32
  },
  // New 20 entries
  {
    id: "56749",
    jobName: "Product Manager",
    location: "Surat",
    CTC: 55
  },
  {
    id: "56750",
    jobName: "Technical Writer",
    location: "Lucknow",
    CTC: 28
  },
  {
    id: "56751",
    jobName: "Business Analyst",
    location: "Indore",
    CTC: 36
  },
  {
    id: "56752",
    jobName: "Security Engineer",
    location: "Nagpur",
    CTC: 43
  },
  {
    id: "56753",
    jobName: "System Administrator",
    location: "Kanpur",
    CTC: 31
  },
  {
    id: "56754",
    jobName: "Network Engineer",
    location: "Coimbatore",
    CTC: 33
  },
  {
    id: "56755",
    jobName: "SEO Specialist",
    location: "Visakhapatnam",
    CTC: 25
  },
  {
    id: "56756",
    jobName: "Content Strategist",
    location: "Thane",
    CTC: 29
  },
  {
    id: "56757",
    jobName: "Graphic Designer",
    location: "Bhopal",
    CTC: 27
  },
  {
    id: "56758",
    jobName: "Database Administrator",
    location: "Patna",
    CTC: 37
  },
  {
    id: "56759",
    jobName: "AI Researcher",
    location: "Vadodara",
    CTC: 52
  },
  {
    id: "56760",
    jobName: "Technical Support Engineer",
    location: "Ghaziabad",
    CTC: 26
  },
  {
    id: "56761",
    jobName: "Digital Marketing Manager",
    location: "Ludhiana",
    CTC: 34
  },
  {
    id: "56762",
    jobName: "Scrum Master",
    location: "Agra",
    CTC: 41
  },
  {
    id: "56763",
    jobName: "Quality Assurance Analyst",
    location: "Nashik",
    CTC: 30
  },
  {
    id: "56764",
    jobName: "Game Developer",
    location: "Faridabad",
    CTC: 44
  },
  {
    id: "56765",
    jobName: "Business Intelligence Analyst",
    location: "Meerut",
    CTC: 46
  },
  {
    id: "56766",
    jobName: "Blockchain Developer",
    location: "Rajkot",
    CTC: 53
  },
  {
    id: "56767",
    jobName: "Cloud Engineer",
    location: "Kochi",
    CTC: 49
  },
  {
    id: "56768",
    jobName: "Mobile UX Designer",
    location: "Mysore",
    CTC: 31
  },
];



  return (
    <>
      {/* Deselect button - only show when rows are selected */}
      <button
        className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${ListSelection?.selectedRows?.length === 0 ? "hidden" : ""}`}
        onClick={() => ListSelection.reset && ListSelection.reset()}
      >
        <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">&minus;</span>
        <span>deselect {ListSelection?.selectedRows?.length ?? 0} rows</span>
      </button>

        <DynamicTable
        columns={columns}
        rows={sortedData ?? []}
        selectedRows={ListSelection?.selectedRows?.map((row: any) => row.id) ?? []}
        enableSelect={false}
        onSortChange={onSortChange}
        pageSize={10}
        setPageSize={() => {}}
        hasPrevPage={false}
        hasNextPage={false}
        handlePreviousPage={() => {}}
        handleNextPage={() => {}}
        />
                
        <AssignJobModal
          dashboardType={"admin"}
          onClose= {() => setIsAssignJobModelOpen(false)}
          isOpen= {isAssignJobModelOpen}
          jobsList={dummyJobData}
        />

        <RemoveJobModal
          dashboardType={"admin"}
          onClose= {() => setIsRemoveJobModelOpen(false)}
          isOpen= {isRemoveJobModelOpen}
          jobsList={dummyJobData}
        />

        <EditAgencyModal
          dashboardType={"admin"}
          onClose= {() => setIsEditAgencyModelOpen(false)}
          isOpen= {isEditAgencyModelOpen}
          data={editProfileData}
        />

        <PauseAgencyModal
          dashboardType={"admin"}
          onClose= {() => setIsPauseAgencyModelOpen(false)}
          isOpen= {isPauseAgencyModelOpen}
          // data={editProfileData}
          //     onClose={() => setShowCompletedModal(false)}
          //     isOpen={showCompletedModal}
          //     referralData={referralData}
          //     onRefresh={onRefresh}
          //     isCandidate={true}
        />

        <DeleteAgencyModal
          dashboardType={"admin"}
          onClose= {() => setIsDeleteAgencyModelOpen(false)}
          isOpen= {isDeleteAgencyModelOpen}
          // data={editProfileData}
          //     onClose={() => setShowCompletedModal(false)}
          //     isOpen={showCompletedModal}
          //     referralData={referralData}
          //     onRefresh={onRefresh}
          //     isCandidate={true}
        />

    </>
  );
}
