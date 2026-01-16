import React, { useEffect, useMemo, useState } from "react";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { AgencyAllCandidatesListDetailsDto, AgencyDatabaseApplicantDetailsDto } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { RefreshCcw, LogOut } from "lucide-react";
import { Edit, View } from "@AssetsFolder/assets";
import { DynamicTableAgency } from "@Components/Shared/DynamicTableAgency";
import { DynamicTableTwo } from "@Components/Shared/DynamicTableTwo";
import { NewDynamicTable } from "@Components/Shared/NewDynamicTable";
import ViewFullDetail from "@Components/Dashboard/Candidate/Pages/Guidance/modals/ViewFullDetail";
import { useSearchParams } from "react-router-dom";
import httpServiceObj from "@Services/ApiHandler.service";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import ProgressCircle from "@Components/Shared/CircularBar";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import NoDataPresent from "@Components/Shared/NoDataPresent";
import CVPreviewRaw from "@Components/Shared/CvPreviewRaw";
import Modal from "@Components/Shared/Modal";
import ScorePointsModal from "@Components/Shared/DetailedAnalysis";
import MoveToApplicants from "@Components/Dashboard/Corporate/SearchDB/modals/MoveToApplicants";

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

export default function SearchResultsTable(props: any) {
    const {
    ListSelection,
    data,
    handleUpdate,
    userType,
    currentPage,
    pageSize,
    hasMore,
    onPageChange,
    onPageSizeChange,
    localUpdate,
    handleLocalUpdateForMatchingScore,
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
  const [editProfileData, setEditProfileData] = useState<any>();
  const [isAssignJobModelOpen, setIsAssignJobModelOpen] = useState<boolean>(false);
  const [pdfViewDetails, setPdfViewDetails] = useState<string>();
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState<boolean>(false);
  const [jobsList, setJobsList] = useState([]);
  const [textToDisplay, setTextToDisplay] = useState("");
  const [searchParams] = useSearchParams();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [mode, setMode] = React.useState<"jobs" | "prompt">("prompt");
  const [initialIds, setInitialIds] = useState<any[]>([]);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
  const [viewViewDetailsModal, setViewViewDetailsModal] = useState<boolean>(false);
  const [fullDetails, setFullDetails] = useState<string>("");
  const [displayText, setDisplayText] = useState<string>("");

  // App context
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;

  const matchingScoreUpdate = async (passedJobId: string) => {
    if (!userDetails?.email) return;

    try {
      const url = `${agencyBaseUrl}/candidate-job-matching/${passedJobId}`;
      const { response } = await httpServiceObj.get<AgencyAllCandidatesListDetailsDto>(
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

  const currentId = initialIds[0] ?? null;
  const {
    data: apidata,
    isLoading,
    error,
    isFetched,
  } = useQuery({
    queryKey: ["matching-score-search", currentId],
    queryFn: () => matchingScoreUpdate(currentId!),
    enabled: !!currentId,
    refetchInterval: 50000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!currentId) return;
    if (apidata?.isFindMatchingScoreInProgress === false && apidata?.matchingScore) {
      toast.success(`Score generated for ${apidata?.candidateEmail}`, getToastOptions({}));
      const updatedData = {
        isFindMatchingScoreInProgress: false,
        matchingScore: apidata?.matchingScore,
        scoreDetails: apidata?.scoreDetails,
      };
      handleLocalUpdateForMatchingScore(apidata?.id, updatedData);
      setInitialIds((prev: any) => prev.slice(1));
      return;
    }
    if (apidata?.isFindMatchingScoreInProgress === false && !apidata?.matchingScore) {
      toast.error(`Failed to generate score for ${apidata?.candidateEmail}`, getToastOptions({}));
      const updatedData = { isFindMatchingScoreInProgress: false };
      handleLocalUpdateForMatchingScore(apidata?.id, updatedData);
      setInitialIds((prev: any) => prev.slice(1));
      return;
    }
    if (apidata?.matchingScore) {
      toast.success(`Score generated for ${apidata?.candidateEmail}`, getToastOptions({}));
      const updatedData = {
        isFindMatchingScoreInProgress: false,
        matchingScore: apidata?.matchingScore,
        scoreDetails: apidata?.scoreDetails,
      };
      handleLocalUpdateForMatchingScore(apidata?.id, updatedData);
      setInitialIds((prev: any) => prev.slice(1));
      return;
    }
  }, [apidata, setInitialIds]);

  // Sorting hook (keeps same fallback keys as before)
  const keyFallbacks = {
    candidateName: ["name"],
    currentCompany: ["currentCompany"],
    email: ["email"],
    contactNumber: ["phoneNumberDetails.number"],
    coreSkills: ["coreSkillsSortValue"],
    currentDesignation: ["currentDesignation"],
    relevantYOE: ["relevantYOE"],
    source: ["source"],
    about: ["about"],
    currentCTC: ["currentCTC"],
    expectedCTC: ["expectedCTC"],
  };

  const sortableData = useMemo(() => {
    return (data ?? []).map((row: any) => ({
      ...row,
      coreSkillsSortValue:
        row.coreSkills
          ?.map((s: any) => s.skillName)
          // .sort()
          .join(", ")
          .toLowerCase() || "",
    }));
  }, [data]);

  //below instead of data we used sortableData cause coreskills need to be looped
  const { sortedData, onSortChange } = useSortableData<AgencyDatabaseApplicantDetailsDto>(
    sortableData,
    keyFallbacks,
    {
      tableId: `database`,
      persistInUrl: false,
      persistInLocalStorage: false,
      defaultSort: null,
    }
  );

  // Helpers for status transitions
  // const shouldShowUpdateIcon = (row: any) => {
  //   return row.status !== "REJECTED" && row.status !== "HIRED";
  // };

  // const toggleDropdown = (rowIndex: string) => {
  //   setDropdownVisibleRows((prev) =>
  //     prev.includes(rowIndex) ? prev.filter((id) => id !== rowIndex) : [...prev, rowIndex]
  //   );
  // };

  // const isDropdownVisible = (rowIndex: string) => dropdownVisibleRows.includes(rowIndex);

  // const statusArray = [
  //   "APPLIED",
  //   "CV_DOWNLOADED",
  //   "UNDER_EVALUATION",
  //   "PROCESSING_INTERVIEW",
  //   "INTERVIEW_DONE",
  //   "HIRED",
  //   "REJECTED",
  // ];

  // const isOptionDisabled = (option: string, currentStatus: string) => {
  //   const statusOrder: Record<string, number> = {
  //     APPLIED: 0,
  //     CV_DOWNLOADED: 1,
  //     UNDER_EVALUATION: 2,
  //     PROCESSING_INTERVIEW: 3,
  //     INTERVIEW_DONE: 4,
  //     HIRED: 5,
  //     REJECTED: 6,
  //   };
  //   return option !== "REJECTED" && statusOrder[option] <= statusOrder[currentStatus];
  // };

useEffect(() => {
    const q = searchParams.get("jobs") || searchParams.get("prompt") || "";
    if (!q) return;

    const currentMode = searchParams.has("jobs") ? "jobs" : "prompt";

    setMode(currentMode);

    if (currentMode === "jobs") {
      setSelectedJobId(q);
    }
  }, [searchParams]);

  const findScoreOrApplicantsWithID = async (
    row: any,
    currentText: string,
    jobIdFromChild: string
  ) => {
    if (!userDetails || !row) {
      toast.error("No user details found please login again", getToastOptions({}));
      return;
    }
    const jobIdToUse = mode === "jobs" && selectedJobId ? selectedJobId : jobIdFromChild;

    let payload: any = {
      jobId: jobIdToUse,
      candidateParsedCvId: row.id,
    };

    if (currentText === "Move to applicants") {
      let companyName;
      let jobTitle;
      jobsList?.map((job: any) => {
        if (job.id === jobIdToUse) {
          companyName = job.companyName;
          jobTitle = job.jobTitle;
        }
      });
      payload = {
        ...payload,
        companyName: companyName,
        jobTitle: jobTitle,
      };
    }
    try {
      let url =
        currentText === "Find matching score"
          ? `${agencyBaseUrl}/candidate-parsed-cv/find-matching-score`
          : `${agencyBaseUrl}/candidate-parsed-cv/move-to-applicant`;

      const { response, error } = await httpServiceObj.post<any>(url, payload, true, {}, true);

      if (error) {
        if (error?.message) {
          toast.error(error.message, getToastOptions({}));
          if (error.message == "The application for this job is already present." || error.message == "Candidate already moved to application process without calculating matching score.") {
            const updatedData = {
              candidateMovedToApplicants: true,
            };
            localUpdate(row?.id, updatedData);
          }
          return;
        } else {
          if (currentText === "Find matching score")
            toast.error("Find matching score failed. Please try again.", getToastOptions({}));
          if (currentText === "Move to applicants")
            toast.error(
              "Candidate moving to applicant failed. Please try again.",
              getToastOptions({})
            );
          return;
        }
      }
      if (response) {
        if (currentText === "Find matching score") {
          const updatedData = {
            isFindMatchingScoreInProgress: true,
            candidateJobMatchingId: response?.candidateJobMatchingId || response?.id,
          };
          setInitialIds((prev) => [...prev, response?.candidateJobMatchingId || response?.id]);
          localUpdate(row?.id, updatedData);
          toast.success("Find Score initiated please wait", getToastOptions({}));
          return;
        }
        if (currentText === "Move to applicants") {
          const updatedData = {
            candidateMovedToApplicants: true,
          };
          localUpdate(row?.id, updatedData);
          toast.success("Candidate moved to applicant successfully", getToastOptions({}));
          return;
        }
      }
    } catch (err) {
      console.error("Assignment error:", err);
      toast.error("candidate moving to applicant failed. Please try again.", getToastOptions({}));
    }
  };

  // const transformStatus = (status: string) => {
  //   const statusMap: Record<string, string> = {
  //     APPLIED: "Applied",
  //     CV_DOWNLOADED: "CV Downloaded",
  //     UNDER_EVALUATION: "Under Evaluation",
  //     PROCESSING_INTERVIEW: "Processing Interview",
  //     INTERVIEW_DONE: "Interview Done",
  //     HIRED: "Hired",
  //     REJECTED: "Rejected",
  //     ON_HOLD: "On Hold",
  //   };
  //   return statusMap[status] || status;
  // };

  // const handleStatusUpdate = (status: string, row: any, hasRefetch: boolean = true) => {
  //   const payload = {
  //     applicantName: row.applicantDetails?.name,
  //     emailId: secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL) || "",
  //     status,
  //     userId: userDetails ? userDetails?.id : "",
  //     userType,
  //   };
  //   handleUpdate && handleUpdate(payload, row.id, hasRefetch);
  // };

  // Column definitions (kept same as previous "All" view)
  const columns = [
    {
      key: "candidateName",
      label: "Candidate Name",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.name ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span title={row?.candidateName} className="truncate block w-full">
      //       {row?.candidateName ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "currentCompany",
      label: "Current Company",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.currentCompany ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span>{row?.currentCompany ?? "NA"}</span>
      //   </div>
      // ),
    },
    {
      key: "email",
      label: "Email ID",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.email ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span>{row?.emailId ?? "NA"}</span>
      //   </div>
      // ),
    },
    {
      key: "contactNumber",
      label: "Contact no",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => `+${row?.phoneNumberDetails?.countryCode ?? ""} ${row?.phoneNumberDetails?.number ?? "NA"}`
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span>{row?.contactNumber ?? "NA"}</span>
      //   </div>
      // ),
    },
    {
      key: "coreSkills",
      label: "Core skills",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => {
        const skillsText = (row.coreSkills ?? []).map((skill) => skill?.skillName).join(", ");

        return (
          <div className="w-[150px] truncate" 
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Click to view full details"}
              onClick={() => {
                setViewViewDetailsModal(true);
                setFullDetails(skillsText.length ? skillsText : "NA");
                setDisplayText("Core skills")
              }}>
            {skillsText.length ? skillsText : "NA"}
          </div>
        );
      },
    },
    {
      key: "currentDesignation",
      label: "Current Designation",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.currentDesignation ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span 
      //       title={row?.currentDesignation} 
      //       className="truncate block w-full">
      //       {row?.currentDesignation ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "relevantYOE",
      label: "YOE",
      sortable: true,
      contentWidth: `max-w-none`,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <span>{row?.relevantYOE ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "source",
      label: "Source",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => row?.source ?? "NA"
      // (
      //   <div className="flex justify-center m-auto w-[150px]">
      //     <span title={row?.source} className="truncate block w-full">
      //       {row?.source ?? "NA"}
      //     </span>
      //   </div>
      // ),
    },
    {
      key: "about",
      label: "About",
      sortable: true,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto w-[150px] text-center">
          <span 
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Click to view full details"}
              onClick={() => {
                setViewViewDetailsModal(true);
                setFullDetails(row?.about ?? "NA");
                setDisplayText("About")
              }}
              className="truncate block w-full">
            {row?.about ?? "NA"}
          </span>
        </div>
      ),
    },
    {
      key: "currentCTC",
      label: "CTC",
      sortable: true,
      contentWidth: `max-w-none`,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <span>{row?.currentCTC ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "expectedCTC",
      label: "ECTC",
      sortable: true,
      contentWidth: `max-w-none`,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto">
          <span>{row?.expectedCTC ?? "NA"}</span>
        </div>
      ),
    },
    {
      key: "viewCV",
      label: "CV",
      sortable: false,
      render: (row: AgencyDatabaseApplicantDetailsDto) => (
        <div className="flex justify-center m-auto w-[40px]">
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
      contentWidth: `max-w-none`,
      render: (row: AgencyDatabaseApplicantDetailsDto) => {
        return (
          <div className="flex justify-center items-center m-auto gap-2">
            <div className="flex justify-center items-center m-auto">
              {!row?.isFindMatchingScoreInProgress && !row?.matchingScore ? (
                <div className="flex justify-center items-center m-auto">
                  <button
                    type="button"
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-cyan-300 to-cyan-500 text-white px-3 py-2 text-xs hover:bg-blue-700 transition"
                    onClick={() => {
                      setEditProfileData(row);
                      setTextToDisplay("Find matching score");
                      if (mode === "jobs" && selectedJobId) {
                        findScoreOrApplicantsWithID(row, "Find matching score", selectedJobId);
                        return;
                      }
                      setIsAssignJobModelOpen(true);
                    }}>
                    {!row?.matchingScore && row?.isFindMatchingScoreInProgress ? (
                      <span className="text-left leading-tight text-xs">Fetching score...</span>
                    ) : (
                      <span className="text-left leading-tight text-xs flex items-start gap-1">
                        <RefreshCcw className="w-4 h-4 mt-1" />
                        <span
                          data-tooltip-id="my-tooltip"
                          data-tooltip-content="Find Matching Score"
                          data-tooltip-place="top">
                          Find Matching <br /> Score
                        </span>
                      </span>
                    )}
                  </button>
                </div>
              ) : row?.matchingScore ? (
                <div className="flex justify-center items-center m-auto">
                  <div className="text-xs">
                    <ProgressCircle
                      onClick={() => {
                        setFeedbackModalOpen(true);
                        const application = jobApplicationServiceObj.getScoreDetails(row as any);
                        if (application === null) return;
                        setScorePointsModal({
                          title:
                            application.type === "SCORE"
                              ? "Matching Score Details"
                              : "Rejected Reason",
                          data:
                            row?.matchingScoreDetails?.rejection_feedback ||
                            row?.matchingScoreDetails?.scoreDetails ||
                            row?.scoreDetails,
                          matchingScore: row?.matchingScore ?? 0,
                          candidateName: row?.name,
                          details: false,
                          showCloseButton: false,
                          onClose: () => setFeedbackModalOpen(false),
                        });
                      }}
                      value={row?.matchingScore}
                    />
                  </div>
                </div>
              ) : (
                /* If score is not ready but process started → show temporary text */
                <div className="text-left leading-tight rounded-xl bg-gradient-to-br from-cyan-300 to-cyan-500 text-white px-3 py-2 text-xs">
                  Fetching score...
                </div>
              )}
            </div>
            <div className="max-w-[150px]">
              {row?.candidateMovedToApplicants ? null : (
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white px-3 py-2 text-xs hover:bg-blue-700 transition"
                  onClick={() => {
                    setEditProfileData(row);
                    setTextToDisplay("Move to applicants");
                    if (mode === "jobs" && selectedJobId) {
                      findScoreOrApplicantsWithID(row, "Move to applicants", selectedJobId);
                      return;
                    }
                    setIsAssignJobModelOpen(true);
                  }}>
                  <span className="text-left leading-tight text-xs flex items-start gap-1">
                    <LogOut className="w-4 h-4 mt-1" />
                    <span
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content="Move to applicants"
                      data-tooltip-place="top">
                      Move to
                      <br />
                      applicants
                    </span>
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };

  //   const renderExpandedDetails = (row: any) => {
  // return (
  //     <div className="flex justify-start items-start gap-8 p-4 bg-gray-50 rounded-lg">
  //       <div>
  //         <span className="font-semibold text-black">Last Rejection Date</span>
  //         <p>
  //           {row.lastRejectionDate
  //             ? new Date(row.lastRejectionDate).toLocaleDateString("en-GB", {
  //                 day: "numeric",
  //                 month: "short",
  //                 year: "numeric",
  //               })
  //             : "NA"}
  //         </p>
  //       </div>

  //       <div>
  //         <span className="font-semibold text-black">Rejected By</span>
  //         <p>{row.rejectedBy ?? "NA"}</p>
  //       </div>

  //       <div>
  //         <span className="font-semibold text-black">Cooling Period</span>
  //         <p>{row.coolingPeriod ?? "NA"}</p>
  //       </div>

  //       <div className="max-w-sm">
  //         <span className="font-semibold text-black">Rejection Reason</span>
  //         <p className="break-words">{row.rejectedReason ?? "NA"}</p>
  //       </div>
  //     </div>
  //   );
  // };
  const viewCV = async (row: AgencyDatabaseApplicantDetailsDto) => {
    setEditProfileData(row);
    if (row?.cvAwsS3ResourceType === "USER_RESUME") {
      if (!row?.userDetailId || !row?.cvAwsS3FileName) {
        toast.error("Missing details", getToastOptions({}));
        return;
      }
      try {
        const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(
          `/file/${row?.userDetailId}/${row?.cvAwsS3FileName}/USER_RESUME`,
          true,
          {},
          false,
          "BASE"
        );

        if (error) {
          toast.error(error.message, getToastOptions({}));
          return;
        }
        setPdfViewDetails(response?.objectUrl);
        setIsViewCVModalOpen(true);
      } catch (error) {
        console.log(error);
      }
    } else if (row?.cvAwsS3ResourceType === "BULK_CVS") {
      if (!row?.companyId || !row?.cvAwsS3FileName || !row?.corporateBulkJdId) {
        toast.error("Missing details", getToastOptions({}));
        return;
      }
      try {
        const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(
          `/file/${row?.companyId}/${row?.cvAwsS3FileName}/BULK_CVS`,
          true,
          { corporateBulkJdId: row?.corporateBulkJdId },
          false,
          "BASE"
        );

        if (error) {
          toast.error(error.message, getToastOptions({}));
          return;
        }
        setPdfViewDetails(response?.objectUrl);
        setIsViewCVModalOpen(true);
      } catch (error) {
        console.log(error)
      }      
    } else if (row?.cvAwsS3ResourceType === "CORP_CAND_BULK_CV_UPLOAD") {
      if (
        !row?.cvAwsS3FilePath ||
        !row?.cvAwsS3FileName
      ) {
        toast.error("Missing details", getToastOptions({}));
        return;
      }
      const splittedID = row?.cvAwsS3FilePath.split("/")
      const payload = { 
        companyId: splittedID[1],
        candCvAwsS3FileName: row?.cvAwsS3FileName 
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
    } else{
      if(!row?.companyId 
        || !row?.jobId 
        || !row?.agencyUserId 
        || !row?.cvAwsS3FileName
        || !row?.cvAwsS3FilePath
      ){
        toast.error("Missing details",getToastOptions({}))
        return
      }
      const splittedCvAwsS3FilePath = row?.cvAwsS3FilePath.split("/")
      const jobIdFromCvAwsS3FilePath = splittedCvAwsS3FilePath[splittedCvAwsS3FilePath.length-2]

      const payload = {
        companyId: row?.companyId,
        jobId:jobIdFromCvAwsS3FilePath,
        agencyUserId: row?.agencyUserId,
        candidateCvAwsS3FileName: row?.cvAwsS3FileName,
      };
      try {
        const { response, error } = await httpServiceObj.post<any>(
          `${agencyBaseUrl}/file/gsu2v/AGENCY_SUBMIT_USER_CV`,
          payload,
          true,
          {},
          true
        );

        if (error) {
          toast.error(error.message, getToastOptions({}));
          return;
        }
        setPdfViewDetails(response.objectUrl);
        setIsViewCVModalOpen(true);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchJobs = async () => {
    const params = {
      pageSize: 200,
      sortOrder: "desc",
      dashboard: "ADMIN",
      // userRole: "ADMIN",
      status: "PUBLISHED",
      // companyId,
    };

    try {
      const { response } = await httpServiceObj.get<any>(`/job`, true, params, false, "JOB");
      if (response?.data) {
        setJobsList(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    fetchJobs();
  }, [userDetails]);

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
        // renderExpandedDetails={renderExpandedDetails}
        enableSelect={true}
        onSortChange={onSortChange}
        pageSize={pageSize}
        setPageSize={onPageSizeChange}
        hasPrevPage={currentPage > 1}
        hasNextPage={hasMore}
        handlePreviousPage={() => onPageChange(currentPage - 1)}
        handleNextPage={() => onPageChange(currentPage + 1)}
      />
      {editProfileData && (
        <MoveToApplicants
          dashboardType={"ADMIN"}
          textToDisplay={textToDisplay}
          onClose={() => {
            setIsAssignJobModelOpen(false);
            setEditProfileData(null);
            setTextToDisplay("");
          }}
          isOpen={isAssignJobModelOpen}
          jobsList={jobsList}
          candidateData={editProfileData}
          userDetails={userDetails}
          submitFunction={findScoreOrApplicantsWithID}
          selectedJobId={selectedJobId}
        />
      )}
      {/* {isAssignJobModelOpen && (      
        <AssignJobModal
        dashboardType={"SEARCH_RESULTS"}
        onClose= {() => {
            setIsAssignJobModelOpen(false)
            setEditProfileData(null)
        }}
        isOpen= {isAssignJobModelOpen}
        jobsList={jobsList}
        agencyData={editProfileData}
        userDetails={userDetails}
        />
        )} */}
      <Modal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        className="py-5">
        {scorePointsModal && <ScorePointsModal {...scorePointsModal} />}
      </Modal>
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
