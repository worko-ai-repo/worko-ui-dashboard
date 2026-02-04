import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchBar from '@Components/Shared/SearchBar';
import SkeletonLoader from '@Components/Shared/SkeletonLoader';
import { RefreshCcw, LogOut, Sparkles, ArrowRight, MicOff, Mic, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';
import SearchResultsTable from "./SearchResultsTable";
import { PaginationInfo } from "../Agency/AgencyCandidateList";
import { useAppContext } from "@Context/App.context";
import JobDropdown, { JobOption } from "./JobDropdown";
import httpServiceObj from "@Services/ApiHandler.service";
import { useSpeechRecognition } from "@Hooks/useSpeechSynthesis.hook";
import Dropdown from "./Dropdown";
import FinalReviewModal from "@Components/Dashboard/Corporate/Database/modals/FinalReviewModal";
import MoveToApplicantsBulk from "@Components/Dashboard/Corporate/Database/modals/MoveToApplicantsBulk";
import EditCTCETCAndNoticePeriodModalForSearchInDB from "@Components/Dashboard/Corporate/SearchDB/modals/EditCTCETCAndNoticePeriodModalForSearchInDB";
import { FailedCandidateDetails } from "@Components/Dashboard/Corporate/SearchDB/SearchResults";

export const initialPaginationState: PaginationInfo = {
  count: 0,
  pageSize: 10,
  sortOrder: "descending",
  timesQueried: 0,
  queriedCount: 0,
  lastKey: "",
  hasMore: false,
};

  const suggestions = [
    "Show candidates with 3+ years of experience available to join in less than 30 days",
    "Find frontend developers skilled in React and TypeScript with immediate availability",
    "Search for candidates with strong communication and client-facing experience",
    "List backend engineers from product-based companies with 5+ years of experience",
    "Give me profiles of DevOps or cloud engineers who can relocate within India",
  ];

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("jobs") || searchParams.get("prompt");
const [searchBarText, setSearchBarText] = useState<string|null>("")
    const [isLoading,setIsLoading] = useState<boolean>(false)
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [input, setInput] = React.useState("");
    const [mode, setMode] = React.useState<"jobs" | "prompt">("prompt");
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const suggestRef = useRef<HTMLDivElement>(null);
    const baseUrl = import.meta.env.APP_PROXY_AGENCY_BASE
    const [fetchData,setFetchData] = useState<any>([])
    const { userDetails } = useAppContext();
    const [jobsList,setJobsList] = useState<JobOption[]>([]);
    const [pageSize,setPageSize] = useState<number>(200);
    const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
    const [hasMore, setHasMore] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedJobId, setSelectedJobId] = useState<string>("");
    const [isJobsLoading, setIsJobsLoading] = useState<boolean>(false);
    const [isAssignJobModelOpen, setIsAssignJobModelOpen] = useState<boolean>(false);
    const [repeatedCandidatesList, setRepeatedCandidatesList] = useState<string>("");
    const [selectedCompany,setSelectedCompany]  = useState<any | null>(null);
    const [editProfileView, setEditProfileView] = useState<boolean>(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [candidateList, setCandidateList] = useState<any[]>([]);
    const [skippableCandidates, setSkippableCandidates] = useState<any[]>([]);
    const [isFinalReviewModalOpen,setIsFinalReviewModalOpen]  = useState<boolean>(false);
    const [successfullySentCandidateList,setSuccessfullySentCandidateList]  = useState<string>("");
    const [incompleteSentCandidateList,setIncompleteSentCandidateList]  = useState<string>("");
    const [textToDisplay,setTextToDisplay]  = useState<string>("");
    const [initialIds, setInitialIds] = useState<any[]>([]);
    const [failedCandidateDetails, setFailedCandidateDetails] = useState<FailedCandidateDetails[]>([]);

    const navigate = useNavigate();
    const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
      useEffect(()=>{
        setIsJobsLoading(true)
        const fetchJobs = async() =>{
        const params = {
          pageSize: 200,
          sortOrder: "desc",
          dashboard: "ADMIN",
          // userRole: "ADMIN",
          status: "PUBLISHED",
          // companyId,
        };

        try {
          const {response} = await httpServiceObj.get<any>(`/job`,true,params,false,"JOB")
          if(response?.data){
            setJobsList(response.data)
          }
        } catch (error) {
          console.log(error)
        } finally{
          setIsJobsLoading(false)
        }
    }
    fetchJobs()
    },[])

    // close on outside click or Esc
    useEffect(() => {
      const onDown = (e: MouseEvent) => {
        if (suggestRef.current && !suggestRef.current.contains(e.target as Node)) {
          setIsSuggestionsOpen(false);
        }
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsSuggestionsOpen(false);
      };
      document.addEventListener("mousedown", onDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onDown);
        document.removeEventListener("keydown", onKey);
      };
    }, []);

    const {
      transcript,
      interimTranscript,
      isListening,
      isSupported,
      error,
      startListening,
      stopListening,
      resetTranscript,
    } = useSpeechRecognition();

    useEffect(() => {
      if (transcript && transcript.trim()) {
        setInput(transcript);
      }
    }, [transcript]);

  const fetchCandidates = useCallback(
    async (
    q: string,
    currentMode: "jobs" | "prompt",
    page = 1,
    size = pageSize
  ) => {
    if (!q.trim()) return;

    setIsLoading(true);
    try {
      const params =
        currentMode === "prompt"
          ? { searchByPrompt: q, pageNumber: page, pageSize: size }
          : { searchByJobId: q, pageNumber: page, pageSize: size };

      const { response } = await httpServiceObj.get<any>(`${baseUrl}/candidate-parsed-cv/search-in-db/admin-action`,true,params,true);

      setFetchData(response?.data);
      setHasMore(response?.pagination?.hasMore || false);
    } catch (err) {
      toast.error("Failed to fetch candidates.", getToastOptions());
    } finally {
      setIsLoading(false);
    }
  },
  []
);

  useEffect(() => {
    const q = searchParams.get("jobs") || searchParams.get("prompt") || "";
    if (!q) return;

    const currentMode = searchParams.has("jobs") ? "jobs" : "prompt";

    setMode(currentMode);

    if (currentMode === "jobs") {
      setSelectedJobId(q);
    } else {
      setInput(q);
    }

    fetchCandidates(q, currentMode, 1, pageSize);
  }, [searchParams]);

  // to populate the first search
  useEffect(() => {
    if (mode === "jobs" && selectedJobId && jobsList.length) {
      const job = jobsList.find(j => j.id === selectedJobId);
      if (job) {
        setInput(job.jobTitle);
      }
    }
  }, [mode, selectedJobId, jobsList]);

const handlePageChange = useCallback(
  (page: number) => {
    const queryValue = mode === "jobs" ? selectedJobId : input;
    setCurrentPage(page);
    fetchCandidates(queryValue, mode, page, pageSize);
  },
  [input, selectedJobId, mode, pageSize]
);



  const handlePageSizeChange = useCallback(
    (size: number) => {
      const queryValue = mode === "jobs" ? selectedJobId : input;
      setPageSize(size);
      setCurrentPage(1);
      fetchCandidates(queryValue, mode, 1, size);
    },
    [input, mode]
  );

  const toggleRow = (row: any) => {
    setSelectedRows((prev) =>
      prev.some((r) => r.id === row.id)
        ? prev.filter((r) => r.id !== row.id)
        : [...prev, row]
    );
  };

  const toggleSelectAll = (rows: any[]) => {
      if (selectedRows.length === rows.length) setSelectedRows([]);
      else setSelectedRows(rows);
  };
    
  const getAllSelected = (rows: any[]) => selectedRows.length === rows.length;
  const reset = () => setSelectedRows([]);
  
  const refetch = () => {};
  const handleJobApplicationStatusUpdate = () => {};
  const handleSendToRecruiter = () => {};
  const onBulkUpdate = () => {};

  const ListSelection = {
  selectedRows,
  toggleSelectAll,
  toggleRow,
  getAllSelected,
  reset,
  };
  
//       const handleBulkBan = () =>{
//           console.log(selectedRows)
//       }
  
//       const handleBulkDelete = () =>{
//           console.log(selectedRows)
//       }
  
//       const handleBulkCVDownload = async() =>{
//           if (selectedRows.length === 0) {
//               toast.error("Please select at least one candidate to download CVs",getToastOptions({}));
//               return;
//           }
//           for (const row of selectedRows) {
//               if (row.cv) {
//               try {
//                   const response = await fetch(row.cv, { mode: "cors" });
//                   const blob = await response.blob();
//                   const url = window.URL.createObjectURL(blob);
//                   const link = document.createElement("a");
//                   link.href = url;
//                   link.setAttribute("download", `${row.candidateName || "CV"}.pdf`);
//                   document.body.appendChild(link);
//                   link.click();
//                   link.remove();
//                   window.URL.revokeObjectURL(url);
//               } catch (error) {
//                   console.error("Failed to download CV:", error);
//               }
//               }
//           }
//   };
  
const handleSubmit = () => {
    const queryValue = mode === "jobs" ? selectedJobId : input;
  if (!queryValue.trim()) return;

  setIsSuggestionsOpen(false);
  setCurrentPage(1);

  navigate(
    `/admin/aSearchDB/results?${mode}=${encodeURIComponent(queryValue)}`
  );
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleLocalUpdate = useCallback((jobId: string, updatedData: any) => {
    setFetchData((prevData:any) => {
    if (!prevData || !Array.isArray(prevData)) return prevData;

    return prevData.map(job =>
      job.id === jobId ? { ...job, ...updatedData } : job
    );
    });
  }, []);

  const handleLocalUpdateForMatchingScore = useCallback((jobId: string, updatedData: any) => {
  setFetchData((prevData:any) => {
  if (!prevData || !Array.isArray(prevData)) return prevData;

  return prevData.map(job =>
    job.candidateJobMatchingId === jobId ? { ...job, ...updatedData } : job
  );
  });
}, []);

  const selectFirstByIdOrPromptForFindMatchingScore = async () => {
    if(mode === "jobs"){
      const fullJobDetails = jobsList.filter(job=>{
        return job.id === selectedJobId
      })
      setSelectedCompany(fullJobDetails[0])
      handleBulkFindMatchingScore(fullJobDetails[0])
    }else{
      setIsAssignJobModelOpen(true)
    }
  }

  const handleBulkFindMatchingScore = async (job:any) =>{
    const filterAlreadyInProgress = selectedRows.filter(candidate=>{
      return !candidate.isFindMatchingScoreInProgress || candidate.isFindMatchingScoreInProgress === null || candidate.isFindMatchingScoreInProgress === undefined 
    })
    if(!filterAlreadyInProgress.length){
      toast.error("All the selected candidates are already fetching score",getToastOptions({}))
      setSelectedRows([])
      return
    }
    const filterAlreadyHavingScore = filterAlreadyInProgress.filter(candidate=>{
      return !candidate.matchingScore || candidate.matchingScore === null || candidate.matchingScore === undefined
    })
    if(!filterAlreadyHavingScore.length){
      toast.error("All the selected candidates are already having score",getToastOptions({}))
      setSelectedRows([])
      return
    }
    const onlyId = filterAlreadyHavingScore.map((candidates:any) =>{
      return candidates.id
    })
    let payload: any = {
      jobId: job?.id,
      candidateParsedCvIds: onlyId,
    };

    try {
      const { response, error } = await httpServiceObj.post<any>(`${agencyBaseUrl}/candidate-parsed-cv/find-matching-score/bulk`, payload, true, {}, true);

      if (error) {
        toast.error(error.message, getToastOptions({}));
        return
      }
      
    if(response && response.existingCandidateJobMatchingScores.length > 0){
      for(let i=0;i<response.existingCandidateJobMatchingScores.length;i++){
        for(let j=0;j<filterAlreadyHavingScore.length;j++){
          if(response.existingCandidateJobMatchingScores[i].candidateParsedCvId === filterAlreadyHavingScore[j].id){
            const updatedDetails = {
              ...filterAlreadyHavingScore[j],
              matchingScore : response.existingCandidateJobMatchingScores[i].matchingScore,
              scoreDetails : response.existingCandidateJobMatchingScores[i].scoreDetails
            }
            handleLocalUpdate(filterAlreadyHavingScore[j].id,updatedDetails)
          }
        }
      }
    }

    let length = false
    if(response && response.failedCandidateJobMatchingScores.length > 0){
      length = true
      for(let i=0;i<response.failedCandidateJobMatchingScores.length;i++){
        for(let j=0;j<filterAlreadyHavingScore.length;j++){
          if(response.failedCandidateJobMatchingScores[i].candidateParsedCvId === filterAlreadyHavingScore[j].id){
            setFailedCandidateDetails(prev => [
              ...prev,
              {
              name:filterAlreadyHavingScore[j].name,
              error:response.failedCandidateJobMatchingScores[i].error
              }
          ])
          break
          }
        }
      }
    }
    
    if(response && response.initiatedCandidateJobMatchingScores.length > 0){
      const onlyInitiadtedIds = response?.initiatedCandidateJobMatchingScores.map((ids: { candidateJobMatchingId: string; candidateParsedCvId: string })=>{
      return ids.candidateJobMatchingId
      })

      setInitialIds((prev) => [...prev, ...onlyInitiadtedIds]);

      response.initiatedCandidateJobMatchingScores.map((responseDetails:any) =>{
        handleLocalUpdate(responseDetails.candidateParsedCvId, {
            isFindMatchingScoreInProgress: true,
            candidateJobMatchingId: responseDetails.candidateJobMatchingId,
          })
      })
    }
    toast.success("Find Score initiated please wait", getToastOptions({}));
    setSelectedRows([])
    console.log(failedCandidateDetails)
    if(length){
      setIsFinalReviewModalOpen(true)
    }
    } catch (err) {
      console.error("Assignment error:", err);
      toast.error("candidate moving to applicant failed. Please try again.", getToastOptions({}));
    } finally {
      setIsAssignJobModelOpen(false)
    }
  }

  const selectFirstByIdOrPromptForMoveToApplicant = async () => {
    if(mode === "jobs"){
      const fullJobDetails = jobsList.filter(job=>{
        return job.id === selectedJobId
      })
      setSelectedCompany(fullJobDetails[0])
      handleBulkMoveToApplicants(fullJobDetails[0])
    }else{
      setIsAssignJobModelOpen(true)
    }
  }
  
  const handleBulkMoveToApplicants = async (job:any) =>{
    if(!job){
      toast.error("No job found please select a job",getToastOptions({}))
      return
    }

    const candidateEmails = selectedRows.map(row =>{
      return row?.email
    })

    try {
      const payload = {
        jobId: job?.id,
        applicantEmails: candidateEmails
      }
      const {response, error} = await httpServiceObj.post<any>(`${agencyBaseUrl}/candidate-parsed-cv/duplicate-job-appl/bulk`,payload,true,{},true)
      if(error){
        toast.error(error.message,getToastOptions({}))
        return
      }
      let finalCandidates = [...selectedRows]
      if(response.data.length > 0 && response.count > 0){
        const repeatedEmails = response.data.map((item: any) => {
          const parts = item.PK.split("USR#EML#");
          return parts[1];
        });
        
        finalCandidates = selectedRows.filter(candidate =>
          !repeatedEmails.includes(candidate.email)
        );
        setSelectedRows(finalCandidates)
        if(finalCandidates.length === 0){
          toast.error(`All selected candidates are already moved to applicant`,getToastOptions({}));
          return;
        }
        const namesOfRepeatedEmail = selectedRows
        .filter(candidate => repeatedEmails.includes(candidate.email))
        .map(c => c.name);

        const repeatedNamesString = namesOfRepeatedEmail.join(", ");
        setRepeatedCandidatesList(repeatedNamesString)     
      }
      setSelectedCompany(job)
      handleUpdateDetails(finalCandidates)
    } catch (error) {
      console.log(error)
    } finally {
      setIsAssignJobModelOpen(false)
    }
  }

  const days90 = 90 * 24 * 60 * 60 * 1000;

  const isSkippable = (row:any) => {
    if (!row) return false;

    const details = row;

    const { currentCTC, expectedCTC, noticePeriod, updatedAt } = details;

    // All 3 fields must be non-zero
    const allNonZero =
      currentCTC !== 0 &&
      expectedCTC !== 0 &&
      noticePeriod !== 0;

    // updatedAt must be within last 90 days
    const updatedDate:any = new Date(updatedAt);
    const today:any = new Date();
    const isRecent = today - updatedDate <= days90;
    return allNonZero && isRecent;
  };

  const handleUpdateDetails = (selectedRows:any) => {
    if (selectedRows.length === 0) return;

    const unskippableList = selectedRows.filter((row:any) => !isSkippable(row));
    const skippableList = selectedRows.filter((row:any) => isSkippable(row));
    setSkippableCandidates(skippableList);

    // if (unskippableList.length === 0) return;

    setCandidateList(unskippableList);
    setCurrentIndex(0);
    setEditProfileView(true);
  };
  return (
      <div>
        <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
          <div className="flex flex-col ">
            <div className="flex flex-wrap gap-4">
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
            <div className="relative z-[70] w-full max-w-3xl" ref={suggestRef}>
              <div className="relative flex">
                <div className="relative top-4 inline-flex items-start gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-t-xl text-xs font-medium h-12 z-0">
                  <Sparkles className="w-4 h-4" />
                  <span>Who are you looking for</span>
                </div>
              </div>

              <div className="relative isolate z-[60] border border-border rounded-2xl shadow-sm bg-white">
              <div className={`relative border border-border ${mode === "prompt" && isSuggestionsOpen ? "rounded-t-2xl" : "rounded-2xl"} shadow-sm bg-white`}>
        {mode === "prompt" ? (
          <textarea
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      }}
      onFocus={() => setIsSuggestionsOpen(true)}
      placeholder="Write your prompt here..."
      className="w-full h-36 resize-none px-4 py-3 pr-24 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none rounded-2xl"
    />
        ) : (
        <div className="flex items-center gap-2 px-4 py-3 w-full">
          <div className="flex-1">
            <JobDropdown
              jobsList={jobsList}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              setSelectedJobId={setSelectedJobId}
              isJobsLoading={isJobsLoading}
            />
          </div>
          <button
            onClick={handleSubmit}
            className="p-2 rounded-md bg-blue-600 hover:bg-blue-700"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
            <Dropdown
              mode={mode}
              setMode={setMode}
              onSubmit={handleSubmit}
              setInput={setInput}
            />
        </div>
        )}

        {/* Mic + Arrow buttons (only in prompt mode) */}
        {mode !== "jobs" && (
          <div className="absolute top-3 right-3 flex gap-2 items-center">
            {isSupported && (
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={!!error}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition duration-300 text-white shadow-md hover:shadow-lg ${
                  isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
                } ${error ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="p-2 rounded-md bg-blue-600 hover:bg-blue-700"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>
          </div>
        )}

        {/* Listening indicator */}
        {isSupported && isListening && (
          <div className="mt-2 text-sm text-blue-600 flex justify-center items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Listening... Speak now
          </div>
        )}

            {/* Dropdown placement for prompt mode (bottom right) */}
            {mode === "prompt" && (
              <div className="absolute bottom-3 right-3">
                <Dropdown
                  mode={mode}
                  setMode={setMode}
                  onSubmit={handleSubmit}
                  // jobsList={jobsList}
                  setInput={setInput}
                />
              </div>
            )}
          </div>

              {mode === "prompt" && isSuggestionsOpen && suggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-0 border-t border-border divide-y divide-border bg-white rounded-b-2xl shadow-lg z-[80]"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInput(suggestion)
                      setIsSuggestionsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-left text-xs text-foreground hover:bg-gray-50 transition"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </button>
                ))}
                </div>
              )}

              </div>
            </div>

            </div>
            <br />
              <div className="border-b mb-2 border-gray-300">
                <p className="block text-left text-gray-500 text-xs">Your search results</p> 
              </div>
              <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end mb-2">  
                <button 
                      onClick={()=>{
                        if(selectedRows.length > 10){
                          toast.error("Maximum 10 applicants are at allowed for this action",getToastOptions({}))
                          return
                        }
                        setTextToDisplay("Find Matching Score :")
                        selectFirstByIdOrPromptForFindMatchingScore()
                      }}
                      disabled={selectedRows.length < 1}
                      type="button"
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content={"Find Matching Score"}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-300 to-cyan-500 text-white px-4 py-2 text-sm hover:bg-blue-700 transition whitespace-normal sm:whitespace-nowrap"
                      >
                      <RefreshCcw className="w-7 h-7 sm:w-4 sm:h-4" />
                      <span>Find Matching Score</span>
                  </button>
                  <button                       
                       onClick={()=>{
                        if(selectedRows.length > 10){
                          toast.error("Maximum 10 applicants are at allowed for this action",getToastOptions({}))
                          return
                        }
                        setTextToDisplay("Move to applicant :")
                        selectFirstByIdOrPromptForMoveToApplicant()
                      }}
                      disabled={selectedRows.length < 1}
                      type="button"
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content={"Move to applicants"}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 transition whitespace-normal sm:whitespace-nowrap"
                      >
                      <LogOut className="w-7 h-7 sm:w-4 sm:h-4" />
                      <span>Move to applicants</span>
                  </button>
            </div>
          </div>
        </div>
        {/* <br /> */}
          {isLoading ? (
          <SkeletonLoader
              showTableHeader={true}
              showTableRows={true}
              tableColumns={5}
              rowCount={5}
          />
          ) : (
          <SearchResultsTable
            data={fetchData}
            userType="ADMIN"
            refetch={refetch}
            ListSelection={ListSelection}
            handleUpdate={handleJobApplicationStatusUpdate}
            sendApplicationToRecruiter={handleSendToRecruiter}
            isBulkEvaluation={!!selectedRows.length}
            onBulkUpdate={onBulkUpdate}
            currentPage={currentPage}
            pageSize={pageSize}
            hasMore={hasMore}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            mode={mode}
            selectedJobId={selectedJobId}
            localUpdate={handleLocalUpdate}
            handleLocalUpdateForMatchingScore={handleLocalUpdateForMatchingScore}
            initialIds={initialIds}
            setInitialIds={setInitialIds}
          />
          )}

      {isAssignJobModelOpen && 
        <MoveToApplicantsBulk
          dashboardType={"ADMIN"}
          pageType={"ATLAS"}
          textToDisplay={textToDisplay}
          onClose={() => {
            setIsAssignJobModelOpen(false);
            setTextToDisplay("")
          }}
          isOpen={isAssignJobModelOpen}
          candidateData={selectedRows[0]}
          userDetails={userDetails}
          submitFunction={textToDisplay === "Move to applicant :" ? handleBulkMoveToApplicants: handleBulkFindMatchingScore}
      />}

      {editProfileView &&
        <EditCTCETCAndNoticePeriodModalForSearchInDB
        dashboardType={"ADMIN"}
        dashboardPage={"ATLAS"}
        onClose={()=>{
          setEditProfileView(false)
          setCandidateList([])
          setSkippableCandidates([])
          setCurrentIndex(0)
          setSelectedCompany(null)
          setTextToDisplay("")
        }}
        isOpen={editProfileView}    
        setCandidateList={setCandidateList}
        candidateList={candidateList}
        skippableCandidates={skippableCandidates}
        currentIndex={currentIndex}
        setCurrentIndex={setCurrentIndex}
        selectedCompany={selectedCompany}
        localUpdate={handleLocalUpdate}
        setIsFinalReviewModalOpen={setIsFinalReviewModalOpen}
        setSuccessfullySentCandidateList={setSuccessfullySentCandidateList}
        setIncompleteSentCandidateList={setIncompleteSentCandidateList}
      />}

      {isFinalReviewModalOpen && (
        <FinalReviewModal
            isOpen={isFinalReviewModalOpen}
            onClose={() => {
                setIsFinalReviewModalOpen(false)
                setSuccessfullySentCandidateList("")
                setIncompleteSentCandidateList("")
                setRepeatedCandidatesList("")
                setFailedCandidateDetails([])
            }}
            successfullySentCandidateList={successfullySentCandidateList}
            incompleteSentCandidateList={incompleteSentCandidateList}
            repeatedCandidatesList={repeatedCandidatesList}
            failedCandidateDetails={failedCandidateDetails}
        />
      )}
      </div>
  );
};

export default SearchResults;
