import React, { useEffect, useMemo, useState } from "react";
import { Eye, Pencil, RefreshCcw, User } from "lucide-react";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { NormalizedUser } from "@Utils/NormalizeUser";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import CreatedByDisplay from "@Components/Shared/PostJob/CreatedByDisplay";
import { AgencyDatabaseApplicantDetailsDto, CandidateParsedCvDetails } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { Edit, View } from "@AssetsFolder/assets";
// import EditProfileModal from "./modals/EditProfileModal";
import { DynamicTableAgency } from "@Components/Shared/DynamicTableAgency";
import { DynamicTableTwo } from "@Components/Shared/DynamicTableTwo";
import httpServiceObj from "@Services/ApiHandler.service";
import NoDataPresent from "@Components/Shared/NoDataPresent";
import CVPreviewRaw from "@Components/Shared/CvPreviewRaw";
import Modal from "@Components/Shared/Modal";
import { getToastOptions } from "lib-worko-ui";
import { toast } from "react-toastify";
import { NewDynamicTable } from "@Components/Shared/NewDynamicTable";
import EditProfileModal from "@Components/Dashboard/Corporate/Database/modals/EditProfileModal";
import ViewFullDetail from "@Components/Dashboard/Candidate/Pages/Guidance/modals/ViewFullDetail";
import { useQuery } from "@tanstack/react-query";

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
  const cvDownloadedEntry = row.statusTracker?.find(
    (entry: any) => entry.newStatus === "CV_DOWNLOADED"
  );
  const isUserIdTypeULID =
    cvDownloadedEntry?.userId?.length === 26 || cvDownloadedEntry?.userId?.includes("-");
  return isUserIdTypeULID
    ? { updatedByUserId: cvDownloadedEntry?.userId || "" }
    : { updatedByCorporateUserId: cvDownloadedEntry?.userId || "" };
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

export default function AdminDatabaseTable(props: any) {
  const {
    ListSelection,
    data,
    handleUpdate,
    userType,
    localUpdate,
    removeAgencyLocally,
    pagination,
    currentPage,
    onPageChange,
    onPageSizeChange,
    initialIds,
    setInitialIds,
  } = props as any;

  // State required for table interactions
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [dropdownVisibleRows, setDropdownVisibleRows] = useState<string[]>([]);
  const [selectedStatusDropdown, setSelectedStatusDropdown] = useState<string>("");
  const [scorePointsModal, setScorePointsModal] = useState<any>();
  const [pdfViewDetailsID, setPdfViewDetailsID] = useState<string | null>(null);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState({
    isOpen: false,
    applicant: {} as any,
    action: "EDIT" as "EDIT" | "VIEW",
  });
  const [editProfileView, setEditProfileView] = useState<boolean>(false);
  const [editProfileData, setEditProfileData] = useState<
    AgencyDatabaseApplicantDetailsDto | undefined
  >();
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState<boolean>(false);
  const [pdfViewDetails, setPdfViewDetails] = useState<string>();
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  const [viewViewDetailsModal, setViewViewDetailsModal] = useState<boolean>(false);
  const [fullDetails, setFullDetails] = useState<string>("");
  const [displayText, setDisplayText] = useState<string>("");
  const currentId = initialIds?.[0] ?? null;
  // App context
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;

  const {
      data: apidata,
      isLoading,
      error,
      isFetched,
    } = useQuery({
      queryKey: ["refetch-details", currentId],
      queryFn: () => refetchingCVUpdate(currentId!),
      enabled: !!currentId,
      refetchInterval: 20000,
      refetchOnWindowFocus: false,
    });
  
    useEffect(() => {
      if (!currentId || !apidata) return;
      if (apidata?.isCandidateCvRefreshInProgress === false) {
        toast.success(`Details Re-fetch completed for ${apidata?.email}`, getToastOptions({}));
        console.log(apidata)
        const updatedData = {
          candidateParsedCvDetails:{
            ...apidata,
            isCandidateCvRefreshInProgress:false
          }
        }
        localUpdate(apidata?.id, updatedData);
        setInitialIds((prev: any) => prev.slice(1));
        return;
      }
    }, [apidata, setInitialIds]);

    const refetchingCVUpdate = async (passedJobId: string) => {
    if (!userDetails?.email) return;

    try {
      const url = `${agencyBaseUrl}/candidate-parsed-cv/${passedJobId}`;
      const { response } = await httpServiceObj.get<CandidateParsedCvDetails>(
        url,
        true,
        {},
        true
      );

      if (response) {
        return response;
      } else {
        console.error("Cannot fetch user details");
      }
    } catch (err) {
      console.error("Exception in Agency all candidates list", err);
    }
    };

  // Sorting hook (keeps same fallback keys as before)
const keyFallbacks = {
  candidateName: ["candidateParsedCvDetails.name"],
  email: ["candidateParsedCvDetails.email"],
  contact: ["phoneNumberDetails.number"],
  date: ["createdAt"],
  currentCompany: ["candidateParsedCvDetails.currentCompany",],
  currentDesignation: ["candidateParsedCvDetails.currentDesignation",],
  currentLocation: ["candidateParsedCvDetails.location"],
  noticePeriod: ["candidateParsedCvDetails.noticePeriod"],
  YOE: ["candidateParsedCvDetails.totalYOE",],
  currentCTC: ["candidateParsedCvDetails.currentCTC",],
  expectedCTC: ["candidateParsedCvDetails.expectedCTC",],
  appliedCompany: [ "appliedCompaniesSortValue",],
  addedBy: ["addedBy"],
  addedFor: ["addedFor"],
  coolingPeriodCompanies: ["coolingPeriodCompaniesSortValue"],
  lastActive: ["lastActive"],
};

  const sortableData = useMemo(() => {
    return (data ?? []).map((row:any) => ({
        ...row,
        appliedCompaniesSortValue: row.candidateProfileInCompanies
        ?.map((s:any) => s.companyName)
        // .sort()
        .join(", ")
        .toLowerCase() || "",
        coolingPeriodCompaniesSortValue: row?.coolingPeriodCompanies
        ?.map((s:any) => s.companyName)
        // .sort()
        .join(", ")
        .toLowerCase() || "",
    }));
  }, [data]);

  //below instead of data we used sortableData cause applied companies need to be looped 
  const { sortedData, onSortChange } = useSortableData<AgencyDatabaseApplicantDetailsDto>(sortableData, keyFallbacks, {
  tableId: `database`,
  persistInUrl: true,
  persistInLocalStorage: false,
  defaultSort: null,
  });

  // Helpers for status transitions
  const shouldShowUpdateIcon = (row: any) => {
    return row.status !== "REJECTED" && row.status !== "HIRED";
  };

  const toggleDropdown = (rowIndex: string) => {
    setDropdownVisibleRows((prev) =>
      prev.includes(rowIndex) ? prev.filter((id) => id !== rowIndex) : [...prev, rowIndex]
    );
  };

  const isDropdownVisible = (rowIndex: string) => dropdownVisibleRows.includes(rowIndex);

  const statusArray = [
    "APPLIED",
    "CV_DOWNLOADED",
    "UNDER_EVALUATION",
    "PROCESSING_INTERVIEW",
    "INTERVIEW_DONE",
    "HIRED",
    "REJECTED",
  ];

  const isOptionDisabled = (option: string, currentStatus: string) => {
    const statusOrder: Record<string, number> = {
      APPLIED: 0,
      CV_DOWNLOADED: 1,
      UNDER_EVALUATION: 2,
      PROCESSING_INTERVIEW: 3,
      INTERVIEW_DONE: 4,
      HIRED: 5,
      REJECTED: 6,
    };
    return option !== "REJECTED" && statusOrder[option] <= statusOrder[currentStatus];
  };

  const transformStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      APPLIED: "Applied",
      CV_DOWNLOADED: "CV Downloaded",
      UNDER_EVALUATION: "Under Evaluation",
      PROCESSING_INTERVIEW: "Processing Interview",
      INTERVIEW_DONE: "Interview Done",
      HIRED: "Hired",
      REJECTED: "Rejected",
      ON_HOLD: "On Hold",
    };
    return statusMap[status] || status;
  };

  const handleStatusUpdate = (status: string, row: any, hasRefetch: boolean = true) => {
    const payload = {
      applicantName: row.applicantDetails?.name,
      emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
      status,
      userId: userDetails ? userDetails?.id : "",
      userType,
    };
    handleUpdate && handleUpdate(payload, row.id, hasRefetch);
  };

  const handlePageSizeChange: React.Dispatch<React.SetStateAction<number>> = (value) => {
    if (typeof value === "number") {
      setPageSize(value);
      onPageSizeChange(value);
    } else {
      setPageSize((prev: any) => {
        const newValue = value(prev);
        onPageSizeChange(newValue);
        return newValue;
      });
    }
  };

  const reparseCV = async(row:any) =>{
    if(!row?.latestCandidateParsedCvId){
      toast.error("No candidate id found please re-upload CV",getToastOptions({}))
      return
    }
    try {
      const payload = {
        candidateParsedCvId: row?.latestCandidateParsedCvId,
      }
      const {response, error} = await httpServiceObj.post(`${agencyBaseUrl}/candidate-parsed-cv/refresh`,payload,true,{},true)
      if(error){
        toast.error(error.message,getToastOptions({}))
        return
      }
      const updatedData = {
        ...row,
        candidateParsedCvDetails:{
          ...row.candidateParsedCvDetails,
          isCandidateCvRefreshInProgress:true
        }
      }
      localUpdate(row?.id,updatedData)
      setInitialIds((prev: string[]) => [...prev, row?.latestCandidateParsedCvId]);
      toast.success("Refetching details from cv initiated",getToastOptions({}))
    } catch (error) {
      console.error("error in reparsing cv",error)
    }
  }

  const shouldShowRefreshButton = (row: any): boolean => {
    const details = row?.candidateParsedCvDetails;
    if (!details) return false;

    // Check 7-day rule
    const refreshedAt = details.candidateParsedCvRefreshedAt;

    if (refreshedAt) {
      const refreshedDate = new Date(refreshedAt);
      const now = new Date();

      const diffInMs = now.getTime() - refreshedDate.getTime();
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (diffInDays <= 7) {
        return false;
      }
    }

    // Validate required fields
    const isEmptyString = (val: any) =>
      !val || (typeof val === "string" && val.trim().length === 0);

    const isEmptyArray = (arr: any) =>
      !Array.isArray(arr) || arr.length === 0;

    const isMissing =
      isEmptyString(details.name) ||
      isEmptyString(row?.candidateEmail) ||
      isEmptyString(row?.phoneNumberDetails?.number) ||
      isEmptyString(details.currentCompany) ||
      isEmptyString(details.currentDesignation) || details.totalYOE == null ||
      isEmptyString(details.location) ||
      isEmptyArray(details.multipleCandidateExperience) ||
      isEmptyArray(details.education) ||
      isEmptyString(details.about) ||
      isEmptyArray(details.coreSkills);

    return isMissing;
  };

  // Column definitions (kept same as previous "All" view)
  const columns = [
    {
      key: "candidateName",
      label: "Candidate Name",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.candidateParsedCvDetails?.name ?? "NA"
      //   (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span title={row?.candidateParsedCvDetails?.name} className="truncate block w-full">
      //       {row?.candidateParsedCvDetails?.name ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    // {
    //   key: "refereeType",
    //   label: "Referee type",
    //   sortable: true,
    //   render: (row: AgencyDatabaseApplicantDetailsDto) => row?.refereeType ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px] text-center">
      //     <span title={row?.refereeType} className="truncate block w-full">
      //       {row?.refereeType ?? "NA"}
      //     </span>
      //   </div>
      // ),
    // },
    {
      key: "email",
      label: "Candidate Email",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => 
        row?.candidateParsedCvDetails?.email ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px] text-center">
      //     <span title={row?.candidateParsedCvDetails?.email} className="truncate block w-full">
      //       {row?.candidateParsedCvDetails?.email ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "contact",
      label: "Contact Number",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => 
        `+${row?.phoneNumberDetails?.countryCode} ${row?.phoneNumberDetails?.number ?? "NA"}`
      //   (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     {row?.phoneNumberDetails?.countryCode && row?.phoneNumberDetails?.number ? (
      //       <span>
      //         +{row?.phoneNumberDetails?.countryCode} {row?.phoneNumberDetails?.number}
      //       </span>
      //     ) : (
      //       <span>{"NA"}</span>
      //     )}
      //   </div>
      // ),
    },
    {
      key: "currentCompany",
      label: "Current company",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.candidateParsedCvDetails?.currentCompany ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span
      //       title={row?.candidateParsedCvDetails?.currentCompany}
      //       className="truncate block w-full">
      //       {row?.candidateParsedCvDetails?.currentCompany ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "currentDesignation",
      label: "Current Designation",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.candidateParsedCvDetails?.currentDesignation ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span
      //       title={row?.candidateParsedCvDetails?.currentDesignation}
      //       className="truncate block w-full">
      //       {row?.candidateParsedCvDetails?.currentDesignation ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    // {
    //   key: "appliedCompany",
    //   label: "Applied Companies",
    //   sortable: true,
    //   render: (row: AgencyDatabaseApplicantDetailsDto) => {
    //     const companyList = (row?.candidateProfileInCompanies?? [])
    //     .map(company => company.companyName)
    //     .join(", ");
    //     return (
    //       <div>
    //           <span 
    //             data-tooltip-id="my-tooltip"
    //             data-tooltip-content={companyList}
    //             data-tooltip-place="top"
    //             className="truncate block w-full">
    //             {companyList.length ? companyList: "NA"}
    //           </span>
    //       </div>)
    //       }
    // },
    {
      key: "YOE",
      label: "YOE",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <span>{row?.candidateParsedCvDetails?.totalYOE ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "currentCTC",
      label: "CTC",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <span>{row?.candidateParsedCvDetails?.currentCTC ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "expectedCTC",
      label: "ECTC",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <span>{row?.candidateParsedCvDetails?.expectedCTC ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "noticePeriod",
      label: "Notice period",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
            {row?.candidateParsedCvDetails?.noticePeriod ?? "NA"}
        </div>
      ),
    },
    {
      key: "currentLocation",
      label: "Current location",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.candidateParsedCvDetails?.location ?? "NA"
      // (
      //   <div className="flex justify-center m-auto">
      //     <span title={row?.candidateParsedCvDetails?.location} className="truncate block w-full">
      //       {row?.candidateParsedCvDetails?.location ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    // {
    //   key: "addedBy",
    //   label: "Added by",
    //   sortable: true,
    //   render: (row: AgencyDatabaseApplicantDetailsDto) => row?.addedBy ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span title={row?.addedBy} className="truncate block w-full">
      //       {row?.addedBy ?? "NA"}
      //     </span>
      //   </div>
      // ),
    // },
    // {
    //   key: "addedFor",
    //   label: "Added for",
    //   sortable: true,
    //   render: (row: AgencyDatabaseApplicantDetailsDto) => row?.addedFor ?? "NA"
    //   (
    //     <div className="flex justify-center m-auto w-[150px]">
    //       <span title={row?.addedFor} className="truncate block w-full">
    //         {row?.addedFor ?? "NA"}
    //       </span>
    //     </div>
    //   ),
    // },
    // {
    //   key: "coolingPeriodCompanies",
    //   label: "Cooling period companies",
    //   sortable: true,
    //   contentWidth: `max-w-none`,
    //   render: (row: AgencyDatabaseApplicantDetailsDto) => {
    //     const companiesArray = (row?.coolingPeriodCompanies?? [])
    //     .map(company => company.companyName)
    //     .join(", ");
    //     return (
    //     <div className="flex justify-center m-auto">
    //       <span>{companiesArray.length? companiesArray: "NA"}</span>
    //     </div>
    //     )
    //   },
    // },
    // {
    //   key: "lastActive",
    //   label: "Last active",
    //   sortable: true,
    //   render: (row: AgencyDatabaseApplicantDetailsDto) => row?.lastActive ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span>{row?.lastActive ?? "NA"}</span>
      //   </div>
      // ),
    // },
    {
      key: "date",
      label: "Added Date",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.createdAt ? new Date(row.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "NA"
      //   (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span>
      //       {row?.createdAt
      //         ? new Date(row.createdAt).toLocaleDateString("en-GB", {
      //             day: "2-digit",
      //             month: "2-digit",
      //             year: "numeric",
      //           })
      //         : "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "viewCV",
      label: "CV",
      sortable: false,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <button
            data-tooltip-id="my-tooltip"
            data-tooltip-content="View CV"
            data-tooltip-place="top"
            className="flex flex-row justify-center items-center"
            onClick={() => {
              viewCV(row);
            }}>
            <img src={View} alt="View" className="w-8 h-8 btn-sky shrink-0 " />
          </button>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      sortable: false,
      contentWidth:`max-w-none`,
      render: (row: AgencyDatabaseApplicantDetailsDto) => {
        return (
          <div className="flex gap-1 justify-center items-center">
            <button
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Edit details"
              data-tooltip-place="top"
              className="flex flex-row justify-center items-center"
              onClick={() => {
                setEditProfileView(true);
                setEditProfileData(row);
              }}>
              {/* <Pencil/> */}
              <img src={Edit} className="w-8 h-8 btn-sky shrink-0" />
            </button>
            {row?.candidateParsedCvDetails?.isCandidateCvRefreshInProgress 
              ? <span 
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Generating details"
                  data-tooltip-place="top"
                  className="cursor-default flex items-center justify-center gap-2 rounded-xl bg-blue-500 p-2 text-white">
                <RefreshCcw size={14} className="shrink-0 w-4 h-4 animate-[spin_1.5s_linear_infinite_reverse]" />
                </span>
              : shouldShowRefreshButton(row) ? (
                <button
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Refetch cv details"
                  data-tooltip-place="top"
                  className="flex flex-row justify-center items-center"
                  onClick={() => reparseCV(row)}
                >
                  <RefreshCcw size={14} className="btn-sky shrink-0 w-8 h-8" />
                </button>
              ) : null}
          </div>
        );
      },
    },
  ];

  const viewCV = async (row:AgencyDatabaseApplicantDetailsDto) =>{
    setEditProfileData(row)
    if(row?.candidateParsedCvDetails?.cvAwsS3ResourceType === "USER_RESUME"){
        if(!row?.candidateParsedCvDetails?.userDetailId 
          || !row?.candidateParsedCvDetails?.cvAwsS3FileName
        ){
          toast.error("Missing details",getToastOptions({}))
          return
        }
        try {
          const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(`/file/${row?.candidateParsedCvDetails?.userDetailId}/${row?.candidateParsedCvDetails?.cvAwsS3FileName}/USER_RESUME`, true, {}, false, "BASE")

          if(error){
            toast.error(error.message,getToastOptions({}))
            return
          }
          setPdfViewDetails(response?.objectUrl)
          setIsViewCVModalOpen(true)
        } catch (error) {
          console.log(error)
        }
      }else if(row?.candidateParsedCvDetails?.cvAwsS3ResourceType  === "BULK_CVS"){
            if(!row?.candidateParsedCvDetails?.companyId 
              || !row?.candidateParsedCvDetails?.cvAwsS3FileName
              || !row?.candidateParsedCvDetails?.corporateBulkJdId 
            ){
              toast.error("Missing details",getToastOptions({}))
              return
            }
            try {
              const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(`/file/${row?.candidateParsedCvDetails?.companyId}/${row?.candidateParsedCvDetails?.cvAwsS3FileName}/BULK_CVS`, true, { corporateBulkJdId:row?.candidateParsedCvDetails?.corporateBulkJdId }, false, "BASE")

              if(error){
                toast.error(error.message,getToastOptions({}))
                return
              }
              setPdfViewDetails(response?.objectUrl)
              setIsViewCVModalOpen(true)
            } catch (error) {
              console.log(error)
            }      
      }else if (row?.candidateParsedCvDetails?.cvAwsS3ResourceType === "ADMIN_CAND_BULK_CV_UPLOAD") {
      if (
        !row?.candidateParsedCvDetails?.cvAwsS3FileName
      ) {
        toast.error("Missing details", getToastOptions({}));
        return;
      }
      const payload = { 
        candCvAwsS3FileName: row?.candidateParsedCvDetails?.cvAwsS3FileName 
      }
      try {
        const { response, error } = await httpServiceObj.post<{ objectUrl: string }>( `${agencyBaseUrl}/file/gsu2v/ADMIN_CAND_BULK_CV_UPLOAD`, payload, true, {}, true );

        if (error) {
          toast.error(error.message, getToastOptions({}));
          return;
        }

        setPdfViewDetails(response?.objectUrl);
        setIsViewCVModalOpen(true);
      } catch (error) {
        console.log(error)
      }      
    }else if (row?.candidateParsedCvDetails?.cvAwsS3ResourceType === "CORP_CAND_BULK_CV_UPLOAD") {
      if (
        !row?.candidateParsedCvDetails?.cvAwsS3FilePath ||
        !row?.candidateParsedCvDetails?.cvAwsS3FileName
      ) {
        toast.error("Missing details", getToastOptions({}));
        return;
      }
      const splittedID = row?.candidateParsedCvDetails?.cvAwsS3FilePath.split("/")
      
      const payload = { 
        companyId: splittedID[1],
        candCvAwsS3FileName: row?.candidateParsedCvDetails?.cvAwsS3FileName 
      }
      try {
        const { response, error } = await httpServiceObj.post<{ objectUrl: string }>( `${agencyBaseUrl}/file/gsu2v/CORP_CAND_BULK_CV_UPLOAD`, payload, true, {}, true );

        if (error) {
          toast.error(error.message, getToastOptions({}));
          return;
        }

        setPdfViewDetails(response?.objectUrl);
        setIsViewCVModalOpen(true);
      } catch (error) {
        console.log(error)
      }      
    }else if (row?.candidateParsedCvDetails?.cvAwsS3ResourceType === "CORP_CAND_REFERRAL_CV") {
      if (
        !row?.candidateParsedCvDetails?.cvAwsS3FilePath ||
        !row?.candidateParsedCvDetails?.cvAwsS3FileName
      ) {
        toast.error("Missing details", getToastOptions({}));
        return;
      }
      const splittedID = row?.candidateParsedCvDetails?.cvAwsS3FilePath.split("/")
      
      const payload = { 
        companyId: splittedID[1],
        candCvAwsS3FileName: row?.candidateParsedCvDetails?.cvAwsS3FileName 
      }
      try {
        const { response, error } = await httpServiceObj.post<{ objectUrl: string }>( `${agencyBaseUrl}/file/gsu2v/CORP_CAND_REFERRAL_CV`, payload, true, {}, true );

        if (error) {
          toast.error(error.message, getToastOptions({}));
          return;
        }

        setPdfViewDetails(response?.objectUrl);
        setIsViewCVModalOpen(true);
      } catch (error) {
        console.log(error)
      }      
    }else if (row?.candidateParsedCvDetails?.cvAwsS3ResourceType === "CAND_SUBMIT_CV_JOB") {
      if (
        !row?.candidateParsedCvDetails?.cvAwsS3FilePath ||
        !row?.candidateParsedCvDetails?.cvAwsS3FileName ||
        !row?.candidateParsedCvDetails?.jobId
      ) {
        toast.error("Missing details", getToastOptions({}));
        return;
      }
      const splittedID = row?.candidateParsedCvDetails?.cvAwsS3FilePath.split("/")

      const payload = { 
        companyId: splittedID[2],
        candCvAwsS3FileName: row?.candidateParsedCvDetails?.cvAwsS3FileName,
        jobId:row?.candidateParsedCvDetails?.jobId
      }
      try {
        const { response, error } = await httpServiceObj.post<{ objectUrl: string }>( `${agencyBaseUrl}/file/gsu2v/CAND_SUBMIT_CV_JOB`, payload, true, {}, true );

        if (error) {
          toast.error(error.message, getToastOptions({}));
          return;
        }

        setPdfViewDetails(response?.objectUrl);
        setIsViewCVModalOpen(true);
      } catch (error) {
        console.log(error)
      }      
    }else{
        if(!row?.candidateParsedCvDetails?.companyId 
          || !row?.candidateParsedCvDetails?.jobId 
          || !row?.candidateParsedCvDetails?.agencyUserId 
          || !row?.candidateParsedCvDetails?.cvAwsS3FileName
          || !row?.candidateParsedCvDetails?.cvAwsS3FilePath
        ){
          toast.error("Missing details",getToastOptions({}))
          return
        }
        const splittedCvAwsS3FilePath = row?.candidateParsedCvDetails?.cvAwsS3FilePath.split("/")
        const jobIdFromCvAwsS3FilePath = splittedCvAwsS3FilePath[splittedCvAwsS3FilePath.length-2]
        
        const payload = {
          companyId: row?.candidateParsedCvDetails?.companyId,
          jobId:jobIdFromCvAwsS3FilePath,
          agencyUserId: row?.candidateParsedCvDetails?.agencyUserId,
          candidateCvAwsS3FileName: row?.candidateParsedCvDetails?.cvAwsS3FileName,
        }
        try {
          const {response,error} = await httpServiceObj.post<any>(`${agencyBaseUrl}/file/gsu2v/AGENCY_SUBMIT_USER_CV`,payload,true,{},true,)
          
          if(error){
            toast.error(error.message,getToastOptions({}))
            return
          }
          setPdfViewDetails(response.objectUrl)
          setIsViewCVModalOpen(true)
        } catch (error) {
          console.log(error)
        }
      }
  }
  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  const renderExpandedDetails = (row: any) => {
  const skillsText = (row?.candidateParsedCvDetails?.coreSkills ?? []).map((skill:any) => skill?.skillName).join(", ");
  const companiesArrayInCooling = (row?.coolingPeriodCompanies?? []).map((company:any) => company.companyName).join(", ");
  const companyList = (row?.candidateProfileInCompanies?? []).map((company:any) => company.companyName).join(", ");
  return (
    <div className="flex flex-col justify-start items-start gap-8 p-4 bg-gray-50 rounded-lg text-left">
      {/* Work Experience */}
      <div className="flex gap-20">
        <div>
          <span className="font-semibold text-black">Work Experience</span>
          {Array.isArray(row?.candidateParsedCvDetails?.multipleCandidateExperience) &&
          row.candidateParsedCvDetails.multipleCandidateExperience.length > 0 ? (
            row.candidateParsedCvDetails.multipleCandidateExperience.map((exp:{designation:String, companyName:String, YOE:number,startDate:string,endDate:string}, index:number) => {
              const start = exp?.startDate
                ? new Date(exp.startDate).getFullYear()
                : "-";

              const end = exp?.endDate
                ? new Date(exp.endDate).getFullYear()
                : exp?.endDate === "" 
                  ? "Present"
                  : "-";

              return (
                <p key={index} className="mt-2 min-w-[300px] max-w-[300px]">
                  {index + 1}. {exp?.designation || ""} at {exp?.companyName || ""} • {start} – {end}
                </p>
              );
            })
          ) : (
            <p>No experience found</p>
          )}
        </div>

        {/* Education */}
        <div>
          <span className="font-semibold text-black">Education</span>
          {Array.isArray(row?.candidateParsedCvDetails?.education) &&
          row.candidateParsedCvDetails.education.length > 0 ? (
            row.candidateParsedCvDetails.education.map((edu:{degree:String, 
                collage:String, 
                YOE:number,
                passingYear:number,
                // startDate:string,
                // endDate:string
              }, index:number) => {
              // const start = edu?.startDate
              //   ? new Date(edu.startDate).getFullYear()
              //   : "-";

              // const end = edu?.endDate
              //   ? new Date(edu.endDate).getFullYear()
              //   : edu?.endDate === "" 
              //     ? "Present"
              //     : "-";

              return (
                <p key={index} className="mt-2 min-w-[300px] max-w-[300px]">
                  {index + 1}. {edu?.degree || ""} at {edu?.collage || ""} {edu?.passingYear ? `• Passing Year - ${edu.passingYear}` : null}
                </p>
              );
            })
          ) : (
            <p>No Education found</p>
          )}
        </div>

        {/* About */}
          <div>
            <span className="font-semibold text-black">About</span>
            {/* <p className="w-[200px] truncate cursor-pointer">{row?.about || "-"}</p> */}
            <div className="w-[200px] truncate cursor-pointer">
              <span 
                data-tooltip-id="my-tooltip"
                data-tooltip-content={"Click to view full details"}
                onClick={() => {
                  setViewViewDetailsModal(true);
                  setFullDetails(row?.candidateParsedCvDetails?.about ?? "-");
                  setDisplayText("About")
                }}
                className="truncate block w-full">
                {row?.candidateParsedCvDetails?.about ?? "-"}
              </span>
            </div>
          </div>

          {/* Core skills */}
          <div>
            <span className="font-semibold text-black">Core skills</span>
            <div className="w-[200px] truncate cursor-pointer" 
                data-tooltip-id="my-tooltip"
                data-tooltip-content={"Click to view full details"}
                onClick={() => {
                  setViewViewDetailsModal(true);
                  setFullDetails(skillsText.length ? skillsText : "-");
                  setDisplayText("Core skills")
                }}>
              {skillsText.length ? skillsText : "-"}
            </div>
          </div>

          {/* Source type worko, internal, external, agency etc*/}
          <div>
            <span className="font-semibold text-black">Source type</span>
            <p>{row?.source || "-"}</p>
          </div>
          
          {/* Source type agency name, referral email*/}
          <div>
            <span className="font-semibold text-black">Source name</span>
            <p>{row?.source || "-"}</p>
          </div>

          {/* Under cooling period */}
          <div>
            <span className="font-semibold text-black">Under cooling period companies</span>
            <div 
              className="w-[200px] truncate cursor-pointer"
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Click to view full details"}
              onClick={() => {
                setViewViewDetailsModal(true);
                setFullDetails(companiesArrayInCooling.length? companiesArrayInCooling: "-");
                setDisplayText("Under cooling period companies")}}
              >
              <span>{companiesArrayInCooling.length? companiesArrayInCooling: "-"}</span>
            </div>
          </div>

          {/* Under process */}
          <div>
            <span className="font-semibold text-black">Under Process</span>         
            <div className="w-[200px] truncate cursor-pointer" 
            data-tooltip-id="my-tooltip"
            data-tooltip-content={"Click to view full details"}
            onClick={() => {
              setViewViewDetailsModal(true);
              setFullDetails(companyList.length ? companyList: "-");
              setDisplayText("Under process companies")
            }}>
              <span 
                data-tooltip-id="my-tooltip"
                data-tooltip-content={companyList}
                data-tooltip-place="top"
                className="truncate block w-full">
                {companyList.length ? companyList: "-"}
              </span>
          </div>
          </div>
      </div>
    </div>
  );

  };

  return (
    <>
      {/* Deselect button - only show when rows are selected */}
      <button
        className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${
          ListSelection?.selectedRows?.length === 0 ? "hidden" : ""
        }`}
        onClick={() => ListSelection.reset && ListSelection.reset()}>
        <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">
          &minus;
        </span>
        <span>deselect {ListSelection?.selectedRows?.length ?? 0} rows</span>
      </button>

      <NewDynamicTable
        columns={columns}
        rows={sortedData ?? []}
        selectedRows={ListSelection?.selectedRows?.map((row: any) => row.id) ?? []}
        expandedRows={expandedRows}
        toggleSelectAll={() => ListSelection.toggleSelectAll && ListSelection.toggleSelectAll(data)}
        toggleRow={(id: string) => {
          const row = data.find((r: any) => r.id === id);
          ListSelection.toggleRow && row && ListSelection.toggleRow(row);
        }}
        toggleExpand={toggleExpand}
        allSelected={ListSelection.getAllSelected && ListSelection.getAllSelected(sortedData)}
        renderExpandedDetails={renderExpandedDetails}
        enableExpand={true}
        enableSelect={true}
        onSortChange={onSortChange}
        pageSize={pageSize}
        setPageSize={handlePageSizeChange}
        handlePreviousPage={() => onPageChange(currentPage - 1)}
        handleNextPage={() => onPageChange(currentPage + 1)}
        hasPrevPage={currentPage > 1}
        hasNextPage={!!pagination?.lastKey}
      />
      <EditProfileModal
        onClose={() => {
          setEditProfileView(false);
          setEditProfileData(undefined);
        }}
        isOpen={editProfileView}
        candidateFullDetails={editProfileData}
        localUpdate={localUpdate}
      />
      <Modal
        isOpen={isViewCVModalOpen}
        onClose={() => {
          setIsViewCVModalOpen(false);
        }}
        className="w-[90vw] sm:max-w-4xl h-full">
        {!pdfViewDetails ? (
          <NoDataPresent />
        ) : (
          <CVPreviewRaw
            pdfUrl={pdfViewDetails}
            onClose={() => {
              setIsViewCVModalOpen(false);
              setEditProfileData(undefined);
            }}
            candidateFullDetails={editProfileData}
            showDownload={true}
          />
        )}
      </Modal>
      <ViewFullDetail
      onClose={() => {
        setViewViewDetailsModal(false);
        setFullDetails("");
        setDisplayText("");
      }}
      isOpen={viewViewDetailsModal}
      fullDetails={fullDetails}
      displayText={displayText}
    />
    </>
  );
}
