import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchBar from '@Components/Shared/SearchBar';
import SkeletonLoader from '@Components/Shared/SkeletonLoader';
import { DatabaseStatusType } from '@TypesAndConstants/JobsAndApplication.type';
import { RefreshCcw, LogOut, Sparkles, ArrowRight, MicOff, Mic, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';
import SearchResultsTable from "./SearchResultsTable";
import JobDropdown from "./JobDropdown";
import Dropdown from "./Dropdown";
import { useSpeechRecognition } from "@Hooks/useSpeechSynthesis.hook";
import httpServiceObj from "@Services/ApiHandler.service";
import { useAppContext } from "@Context/App.context";

const dummyData = [
  {
    id: 1,
    candidateName: "Aarav Mehta",
    currentCompany: "Infosys",
    coreSkills: "Java, Spring Boot, Microservices",
    currentDesignation: "Backend Developer",
    YOE: "3",
    source: "LinkedIn",
    about: "A passionate backend developer with strong experience in building scalable APIs.",
    CTC: "8 LPA",
    ECTC: "10 LPA",
    cvLink: "https://example.com/cv/aarav-mehta",
    emailId:"asad@gmail.com",
    contactNumber:"+91 8899006655"
  },
  {
    id: 2,
    candidateName: "Sanya Kapoor",
    currentCompany: "TCS",
    coreSkills: "React, Redux, TypeScript",
    currentDesignation: "Frontend Engineer",
    YOE: "4",
    source: "Naukri",
    about: "Frontend specialist with a strong eye for design and usability.",
    CTC: "9.5 LPA",
    ECTC: "12 LPA",
    cvLink: "https://example.com/cv/sanya-kapoor",
    emailId:"asad@gmail.com",
    contactNumber:"+91 8899006655"
  },
  {
    id: 3,
    candidateName: "Rohan Iyer",
    currentCompany: "Wipro",
    coreSkills: "Python, Django, REST APIs",
    currentDesignation: "Software Engineer",
    YOE: "2",
    source: "Referral",
    about: "Full-stack developer with a focus on Python and backend services.",
    CTC: "6.2 LPA",
    ECTC: "8.5 LPA",
    cvLink: "https://example.com/cv/rohan-iyer",
    emailId:"asad@gmail.com",
    contactNumber:"+91 8899006655"
  },
  {
    id: 4,
    candidateName: "Megha Sharma",
    currentCompany: "Cognizant",
    coreSkills: "Angular, HTML, SCSS, RxJS",
    currentDesignation: "UI Developer",
    YOE: "5",
    source: "Job Portal",
    about: "UI/UX enthusiast with over 5 years of experience in building responsive web applications.",
    CTC: "11 LPA",
    ECTC: "13 LPA",
    cvLink: "https://example.com/cv/megha-sharma",
    emailId:"asad@gmail.com",
    contactNumber:"+91 8899006655"
  },
  {
    id: 5,
    candidateName: "Nikhil Verma",
    currentCompany: "HCL Technologies",
    coreSkills: "Node.js, MongoDB, AWS",
    currentDesignation: "Full Stack Developer",
    YOE: "6",
    source: "Company Career Page",
    about: "Experienced full-stack developer with a knack for building cloud-native applications.",
    CTC: "14 LPA",
    ECTC: "16.5 LPA",
    cvLink: "https://example.com/cv/nikhil-verma",
    emailId:"asad@gmail.com",
    contactNumber:"+91 8899006655"
  }
];

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
    const [apiStatus, setApiStatus] = useState<DatabaseStatusType>();
    const [isLoading,setIsLoading] = useState<boolean>(false)
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [input, setInput] = React.useState("");
    const [mode, setMode] = React.useState<"jobs" | "prompt">("jobs");
    const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
    const suggestRef = useRef<HTMLDivElement>(null);
    const baseUrl = import.meta.env.APP_PROXY_AGENCY_BASE
    const [fetchData,setFetchData] = useState<any>([])
    const { userDetails } = useAppContext();
    const [jobsList,setJobsList] = useState([]);
    
      useEffect(()=>{
      const fetchJobs = async() =>{
      const params = {
        pageSize: 200,
        sortOrder: "desc",
        dashboard: "CORPORATE",
        userRole: "corporate-recruiter",
        status: "PUBLISHED",
        companyId: userDetails?.companyId,
        corporateRecruiterUserId: userDetails?.id,
      }

      try {
        const {response} = await httpServiceObj.get<any>(`/job`,true,params,false,"JOB")
        console.log(response)
        if(response?.data){
          setJobsList(response.data)
        }
      } catch (error) {
        console.log(error)
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

    const { transcript, interimTranscript, isListening, isSupported, error, startListening, stopListening,resetTranscript,} = useSpeechRecognition();

  const fetchCandidates = async () => {
    const q = input.trim();
    if (!q) return;

    setIsLoading(true);
    try {
      const params = { mode, query: q };
      const { response } = await httpServiceObj.get<any>(`${baseUrl}/fetch-candidate`,true,params,true);
      setFetchData(response?.data ?? dummyData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch candidates.", getToastOptions());
      setFetchData(dummyData);
    } finally {
      setIsLoading(false);
    }
  };

    useEffect(() => {
      const q = searchParams.get("jobs") || searchParams.get("prompt") || "";
      if (searchParams.has("jobs")) {
        setMode("jobs");
        setInput(q);
      } else if (searchParams.has("prompt")) {
        setMode("prompt");
        setInput(q);
      }
      if(q && mode){
        fetchCandidates()
      }
    }, [searchParams]);
    
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
    
        const handleSubmit = () => {
          if (!input.trim()) return;
          setIsSuggestionsOpen(false);
          fetchCandidates();
        };

        const handleMicToggle = () => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
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
      onFocus={() => setIsSuggestionsOpen(true)}   // ← add this
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
              <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">  
                <button 
                      type="button"
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-300 to-cyan-500 text-white px-4 py-2 text-sm hover:bg-blue-700 transition whitespace-nowrap"
                      >
                      <RefreshCcw className="w-4 h-4" />
                      <span>Find Matching Score</span>
                  </button>
                  <button 
                      type="button"
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 transition whitespace-nowrap"
                      >
                      <LogOut className="w-4 h-4" />
                      <span>Move to applicants</span>
                  </button>
            </div>
          </div>
        </div>
        <br />
          {isLoading ? (
          <SkeletonLoader
              showTableHeader={true}
              showTableRows={true}
              tableColumns={5}
              rowCount={5}
          />
          ) : (
          <SearchResultsTable
            data={dummyData}
            userType="CORPORATE"
            refetch={refetch}
            ListSelection={ListSelection}
            handleUpdate={handleJobApplicationStatusUpdate}
            sendApplicationToRecruiter={handleSendToRecruiter}
            isBulkEvaluation={!!selectedRows.length}
            onBulkUpdate={onBulkUpdate}
          />
          )}
      </div>
    );
  };

export default SearchResults;
