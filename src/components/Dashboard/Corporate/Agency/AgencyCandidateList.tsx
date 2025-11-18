import SearchBar from '@Components/Shared/SearchBar'
import SkeletonLoader from '@Components/Shared/SkeletonLoader'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import AgencyCandidateListTable from './AgencyCandidateListTable'
import GenericDropdownAgency from '@Components/Shared/DropDown/GenericDropdownAgency'
import SearchBarAgency from '@Components/Shared/SearchBarAgency'
import httpServiceObj from '@Services/ApiHandler.service'
import { AgencyAllCandidatesListDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto'
import { Check, RefreshCcw, Send, X } from 'lucide-react'
import RejectCandidateModal from './modals/RejectCandidateModal'
import { toast } from 'react-toastify'
import { getToastOptions } from 'lib-worko-ui'
import { useQuery } from '@tanstack/react-query';
import EvaluatorForm from '@Components/Shared/ApplicantsPage/EvaluatorForm'
import Modal from '@Components/Shared/Modal'
import { useAppContext } from '@Context/App.context'
interface UserDetails {
  id: string;
  // add any other fields you expect
}

  const dummyData = [
    {
    id: "ref-10",
    pk: "REFERRAL#ref-10",
    sk: "CANDIDATE#ref-10",
    jobProfile: "Cloud Engineer",
    agencyName: "TechHire Solutions",
    dateSubmitted: "2025-10-05",
    applicantName: "Abhay Raj",
    emailId: "abhay.raj@example.com",
    contactNumber: "+91-9876543219",
    currentCompany: "NetCloud",
    currentDesignation: "AWS Engineer",
    totalYOE: 6,
    relevantYOE: 4,
    currentCTC: "16 LPA",
    expectedCTC: "19 LPA",
    noticePeriod: "30 days",
    location: "Hyderabad",
    readyToRelocate: true,
    comments: "Certified AWS Solutions Architect.",
    cvLink: "https://calibre-ebook.com/downloads/demos/demo.pdf",
    score:null,
    currentStatus: "APPLIED",
    achievements: "Successfully led a small team to develop a cross-platform app that gained over 10,000 downloads within three months, while optimizing performance by 35% through efficient API integration. Automated multiple workflows, saving more than 20 hours per week and improving overall productivity. Recognized as “Developer of the Month” for outstanding innovation, leadership, and consistent delivery of high-quality results.",
    educationHistory: [
      {
        degree: "Bachelor of Technology (B.Tech)",
        fieldOfStudy: "Computer Science and Engineering",
        institution: "Indian Institute of Technology, Hyderabad",
        yearOfCompletion: 2018,
        grade: "8.4 CGPA"
      },
      {
        degree: "AWS Certified Solutions Architect – Associate",
        fieldOfStudy: "Cloud Architecture",
        institution: "Amazon Web Services",
        yearOfCompletion: 2020,
        grade: "Certified"
      },
      {
        degree: "Post Graduate Program in Cloud Computing",
        fieldOfStudy: "Cloud Infrastructure & DevOps",
        institution: "Great Lakes Institute of Management",
        yearOfCompletion: 2022,
        grade: "Distinction"
      }
    ],
    careerHistory: [
      {
        companyName: "NetCloud",
        designation: "AWS Engineer",
        duration: "2022-03 to Present",
        responsibilities: [
          "Designed and implemented AWS infrastructure using EC2, Lambda, and RDS.",
          "Automated deployments with Terraform and Jenkins pipelines.",
          "Optimized cloud cost by 18% through resource right-sizing and automation."
        ]
      },
      {
        companyName: "CloudAxis Technologies",
        designation: "DevOps Engineer",
        duration: "2020-02 to 2022-02",
        responsibilities: [
          "Deployed CI/CD pipelines across AWS and Azure platforms.",
          "Monitored system performance using Prometheus and Grafana.",
          "Reduced deployment time from 45 to 15 minutes through containerization."
        ]
      },
      {
        companyName: "SkyNet Digital",
        designation: "Cloud Support Engineer",
        duration: "2018-08 to 2020-01",
        responsibilities: [
          "Provided L2/L3 support for AWS environments.",
          "Managed IAM policies and S3 storage configurations.",
          "Developed scripts in Python for log automation and monitoring alerts."
        ]
      },
      {
        companyName: "TechVerse Solutions",
        designation: "Intern - Cloud Engineering",
        duration: "2018-01 to 2018-07",
        responsibilities: [
          "Assisted in deployment and maintenance of cloud environments.",
          "Worked on Linux server setup and performance optimization.",
          "Created internal documentation for AWS service configurations."
        ]
      },
      {
        companyName: "Freelance Projects",
        designation: "Cloud Consultant (Part-time)",
        duration: "2019-2021",
        responsibilities: [
          "Helped startups migrate to AWS infrastructure.",
          "Configured CI/CD pipelines using GitHub Actions and Docker.",
          "Provided consultation on cloud security best practices."
        ]
      }
    ]
    },
    {
      id: "ref-11",
      pk: "REFERRAL#ref-11",
      sk: "CANDIDATE#ref-11",
      jobProfile: "Frontend Developer",
      agencyName: "PixelRecruit",
      dateSubmitted: "2025-10-06",
      applicantName: "Neha Sharma",
      emailId: "neha.sharma@example.com",
      contactNumber: "+91-9823123456",
      currentCompany: "Designify",
      currentDesignation: "React Developer",
      totalYOE: 4,
      relevantYOE: 3,
      currentCTC: "10 LPA",
      expectedCTC: "12 LPA",
      noticePeriod: "15 days",
      location: "Bangalore",
      readyToRelocate: false,
      comments: "Strong in UI/UX integration.",
      cvLink: "https://example.com/cv/neha-sharma.pdf",
      score: null,
      currentStatus: "PROCESSING_INTERVIEW"
    },
    {
      id: "ref-12",
      pk: "REFERRAL#ref-12",
      sk: "CANDIDATE#ref-12",
      jobProfile: "Data Analyst",
      agencyName: "Insight Partners",
      dateSubmitted: "2025-10-07",
      applicantName: "Rohan Mehta",
      emailId: "rohan.mehta@example.com",
      contactNumber: "+91-9811122233",
      currentCompany: "DataWise",
      currentDesignation: "Junior Data Analyst",
      totalYOE: 3,
      relevantYOE: 2,
      currentCTC: "7 LPA",
      expectedCTC: "9 LPA",
      noticePeriod: "60 days",
      location: "Pune",
      readyToRelocate: true,
      comments: "Hands-on with Power BI and SQL.",
      cvLink: "https://example.com/cv/rohan-mehta.pdf",
      score:undefined,
      currentStatus: "HIRING_IN_PROCESS"
    },
    {
      id: "ref-13",
      pk: "REFERRAL#ref-13",
      sk: "CANDIDATE#ref-13",
      jobProfile: "DevOps Engineer",
      agencyName: "CloudBridge",
      dateSubmitted: "2025-10-07",
      applicantName: "Sana Ali",
      emailId: "sana.ali@example.com",
      contactNumber: "+91-9876543210",
      currentCompany: "InfraEdge",
      currentDesignation: "DevOps Specialist",
      totalYOE: 5,
      relevantYOE: 4,
      currentCTC: "13 LPA",
      expectedCTC: "15.5 LPA",
      noticePeriod: "45 days",
      location: "Chennai",
      readyToRelocate: false,
      comments: "Expert in CI/CD pipelines and Docker.",
      cvLink: "https://example.com/cv/sana-ali.pdf",
      score:50.1,
      currentStatus: "REJECTED"
    },
    {
      id: "ref-14",
      pk: "REFERRAL#ref-14",
      sk: "CANDIDATE#ref-14",
      jobProfile: "Backend Developer",
      agencyName: "CodeSearch",
      dateSubmitted: "2025-10-08",
      applicantName: "Manish Kumar",
      emailId: "manish.kumar@example.com",
      contactNumber: "+91-9900887766",
      currentCompany: "StackCore",
      currentDesignation: "Node.js Developer",
      totalYOE: 4,
      relevantYOE: 3,
      currentCTC: "11 LPA",
      expectedCTC: "13.5 LPA",
      noticePeriod: "30 days",
      location: "Gurgaon",
      readyToRelocate: true,
      comments: "Strong API development experience.",
      cvLink: "https://example.com/cv/manish-kumar.pdf",
      score: 40.0,
      currentStatus: "HIRED"
    },
    {
      id: "ref-15",
      pk: "REFERRAL#ref-15",
      sk: "CANDIDATE#ref-15",
      jobProfile: "Full Stack Developer",
      agencyName: "NextHire",
      dateSubmitted: "2025-10-08",
      applicantName: "Priya Sen",
      emailId: "priya.sen@example.com",
      contactNumber: "+91-9922334455",
      currentCompany: "TechNova",
      currentDesignation: "Software Engineer",
      totalYOE: 5,
      relevantYOE: 3.5,
      currentCTC: "12.5 LPA",
      expectedCTC: "15 LPA",
      noticePeriod: "20 days",
      location: "Mumbai",
      readyToRelocate: true,
      comments: "Experienced in MERN stack and Agile.",
      cvLink: "https://example.com/cv/priya-sen.pdf",
      score: undefined,
      currentStatus: "JOINED"
    },
    {
      id: "ref-16",
      pk: "REFERRAL#ref-16",
      sk: "CANDIDATE#ref-16",
      jobProfile: "QA Engineer",
      agencyName: "TestLab",
      dateSubmitted: "2025-10-09",
      applicantName: "Ankit Jha",
      emailId: "ankit.jha@example.com",
      contactNumber: "+91-9812233445",
      currentCompany: "QualitySoft",
      currentDesignation: "QA Analyst",
      totalYOE: 3,
      relevantYOE: 2,
      currentCTC: "8 LPA",
      expectedCTC: "10 LPA",
      noticePeriod: "15 days",
      location: "Noida",
      readyToRelocate: false,
      comments: "Good in manual and automation testing.",
      cvLink: "https://example.com/cv/ankit-jha.pdf",
      score: 20.5,
      currentStatus: "OFFER_SENT"
    },
    {
      id: "ref-17",
      pk: "REFERRAL#ref-17",
      sk: "CANDIDATE#ref-17",
      jobProfile: "UI/UX Designer",
      agencyName: "DesignCrew",
      dateSubmitted: "2025-10-09",
      applicantName: "Tanvi Kapoor",
      emailId: "tanvi.kapoor@example.com",
      contactNumber: "+91-9800011223",
      currentCompany: "VisualMint",
      currentDesignation: "Product Designer",
      totalYOE: 4,
      relevantYOE: 4,
      currentCTC: "9.5 LPA",
      expectedCTC: "11.5 LPA",
      noticePeriod: "25 days",
      location: "Delhi",
      readyToRelocate: true,
      comments: "Strong portfolio and Figma skills.",
      cvLink: "https://example.com/cv/tanvi-kapoor.pdf",
      score: 10.3,
      currentStatus: "DOCUMENT_REQUESTED",
    },
    {
      id: "ref-18",
      pk: "REFERRAL#ref-18",
      sk: "CANDIDATE#ref-18",
      jobProfile: "Product Manager",
      agencyName: "PMConnect",
      dateSubmitted: "2025-10-10",
      applicantName: "Arjun Desai",
      emailId: "arjun.desai@example.com",
      contactNumber: "+91-9876501234",
      currentCompany: "Innovix",
      currentDesignation: "Associate Product Manager",
      totalYOE: 6,
      relevantYOE: 4,
      currentCTC: "18 LPA",
      expectedCTC: "22 LPA",
      noticePeriod: "60 days",
      location: "Remote",
      readyToRelocate: false,
      comments: "Led cross-functional product teams.",
      cvLink: "https://example.com/cv/arjun-desai.pdf",
      score: 9.0,
      currentStatus: "INTERVIEW_DONE"
    },
    {
      id: "ref-19",
      pk: "REFERRAL#ref-19",
      sk: "CANDIDATE#ref-19",
      jobProfile: "Cybersecurity Analyst",
      agencyName: "SecurePath",
      dateSubmitted: "2025-10-10",
      applicantName: "Divya Iyer",
      emailId: "divya.iyer@example.com",
      contactNumber: "+91-9988776655",
      currentCompany: "SafeNet",
      currentDesignation: "Security Analyst",
      totalYOE: 5,
      relevantYOE: 4,
      currentCTC: "14 LPA",
      expectedCTC: "17 LPA",
      noticePeriod: "30 days",
      location: "Kochi",
      readyToRelocate: true,
      comments: "CEH certified, SOC experience.",
      cvLink: "https://example.com/cv/divya-iyer.pdf",
      score: 8.6,
      currentStatus: "DOCUMENT_VERIFIED"
    }
  ]

export interface AgencyAllCandidatesListFilters {
  searchText?: string;
  companyId?: string;
  sortOrder?: "ascending" | "descending";
  userType?: string;
}

export interface AgencyAllCandidatesListApiResponse {
  data: AgencyAllCandidatesListDetailsDto[];
  pagination: PaginationInfo;
  totalReferrals?: number;
  currentPage?: number;
  totalPages?: number;
  matchingScore?: number;
}

export interface PaginationInfo {
  count: number;
  pageSize: number;
  sortOrder: string;
  timesQueried: number;
  queriedCount: number;
  lastKey: string;
}

const initialPaginationState: PaginationInfo = {
  count: 0,
  pageSize: 10,
  sortOrder: "descending",
  timesQueried: 0,
  queriedCount: 0,
  lastKey: "",
};

const AgencyCandidateList = () => {
  const [searchBarText,setSearchBarText] = useState<string|null>("")
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isRejecting,setIsRejecting] = useState<boolean>(false);
  const [fetchData, setFetchData] = useState<any[]>([]);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [acceptingCandidate, setAcceptingCandidate] = useState(false);
  const [rejectingCandidate, setRejectingCandidate] = useState(false);
  const [dataFromParent, setDataFromParent] = useState<any[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingStartTime, setPollingStartTime] = useState<number | null>(null);
  const [isEvaluatorForm,setIsEvaluatorForm] = useState<boolean>(false);
  const [jobFilter,setJobFilter] = useState<any>([]);
  const [agencyFilter,setAgencyFilter] = useState<any>([]);
  const [pageSize,setPageSize] = useState<number>(10);
  const [filters, setFilters] = useState<AgencyAllCandidatesListFilters>({});
  const [isLoading,setIsLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
  const paginationKeysRef = useRef<Record<number, string>>({1: "",});

  const { userDetails } = useAppContext();
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE


  // useEffect(() => {
  //   const fetchingAllCandidate = async () => {
  //     try {
  //       const { response } = await httpServiceObj.get(`${baseUrl}/callingapi`, true, {}, true);

  //       if (response) {
  //         setFetchData(response as any);
  //       } else {
  //         setFetchData(dummyData);
  //       }
  //       const data = response as any || dummyData;

  //       const agencyFilters = data.map((item: any) => ({
  //         label: item.agencyName,
  //         onClick: () => setAgencyFilter(item.agencyName),
  //       }));
  //       setAgencyFilter(agencyFilters);

  //       const jobFilters = data.map((item: any) => ({
  //         label: item.jobProfile,
  //         onClick: () => setJobFilter(item.jobProfile),
  //       }));
  //       setJobFilter(jobFilters);

  //       setAgencyFilter(agencyFilters);
  //     } catch (error) {
  //       console.log("Error fetching data:", error);
  //       setFetchData(dummyData);
  //     }
  //   };

  //   fetchingAllCandidate();
  // }, []);

    const fetchAllCandidatesData = useCallback(
      async (
        page: number = 1,
        size: number = pageSize,
        lastKey: string = "",
        searchFilters = filters,
        isSearch = false,
        sortOrder = "desc"
      ) => {
  
        if (!userDetails?.email) return;
    
        setIsLoading(true);
        try {
          console.log(userDetails)
        const url = `${agencyBaseUrl}/agency-user-submission/`;
        const params = {
          companyId:userDetails?.companyId,
          agencyJobAssignedByCorporateUserId:userDetails?.id,
          includeJobDetails: true,
          includeCandidateParsedCvDetails: true,
          //  agencyName:NELLSYS,
          // jobId: string,
          // candidateEmail: string,
          pageSize:size,
          lastKey,
          sortOrder,
        }
          const { response } = await httpServiceObj.get<AgencyAllCandidatesListApiResponse>(url, true, params, true);
    
          if (response) {
            setFetchData(response.data);
            console.log(response)
            if (response.pagination) {
              setPaginationInfo(response.pagination);
    
              if (isSearch || page === 1) {
                paginationKeysRef.current = { 1: "" };
                if (response.pagination.lastKey) {
                  paginationKeysRef.current[2] = response.pagination.lastKey;
                }
              } else if (response.pagination.lastKey) {
                paginationKeysRef.current[page + 1] = response.pagination.lastKey;
              }
            }
          } else {
            console.error("Cannot fetch user details");
          }
        } catch (err) {
          console.error("Exception in fetchReferrals:", err);
        } finally {
          setIsLoading(false);
          // setFetchData(agencyDetailsList.data)
          // setPaginationInfo(agencyDetailsList.pagination)
        }
      },
      [userDetails, pageSize, filters]
    );

  const StatusFilterDropdown = [
    { label: "All", onClick: () => { setStatusFilter("")}},
    { label: "Applied", onClick: () => { setStatusFilter("APPLIED")}},
    { label: "Accepted", onClick: () => { setStatusFilter("ACCEPTED")}},
    { label: "Under Evaluation", onClick: () => { setStatusFilter("UNDER_EVALUATION")} },
    { label: "Processing Interview", onClick: () => { setStatusFilter("PROCESSING_INTERVIEW")} },
    { label: "Interview Done", onClick: () => { setStatusFilter("INTERVIEW_DONE")}},
    { label: "Hiring In Process", onClick: () => { setStatusFilter("HIRING_IN_PROCESS")}},
    { label: "Hired", onClick: () => { setStatusFilter("HIRED")}},
    { label: "Joined", onClick: () => { setStatusFilter("JOINED")}},
    { label: "Rejected", onClick: () => { setStatusFilter("REJECTED")}},
  ];

    useEffect(() => {
    console.log(userDetails)
      if (userDetails?.email) {
        setCurrentPage(1);
        setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
        paginationKeysRef.current = { 1: "" };
        fetchAllCandidatesData(1, pageSize, "");
        // fetchJobs()
      }
    }, [userDetails, fetchAllCandidatesData, pageSize]);
  
  const searchInputRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBarText(e.target.value);
  };

  const handlePageChange = useCallback((page: number) => {
      const lastKey = paginationKeysRef.current[page] || "";
      
      setCurrentPage(page);
      fetchAllCandidatesData(page, pageSize, lastKey);
    },
    [fetchAllCandidatesData, pageSize]
  );

    const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" };
      fetchAllCandidatesData(1, size, "");
    },
    [fetchAllCandidatesData]
  );
      
  const removeAgencyLocally = (id: string) => {
    setFetchData((prev:any) => prev?.filter((item:any) => item.id !== id));
  };

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

      const acceptAndMoveToApplicants = async() =>{
        setAcceptingCandidate(true);
        const payload = {
          candidates: selectedRows,
        };
        try {
          const {response} = await httpServiceObj.post("/someapi/fetch", payload, true, {}, true);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setFetchData((prevData) =>
            prevData.filter((candidate) =>
              !selectedRows.some((sel) => sel.id === candidate.id)
            )
          );
          toast.success("Candidate accepted and moved to applicants",getToastOptions({}))
          // console.log("Matching scores updated successfully!");
        } catch (error) {
          console.error("Error finding matching score:", error);
        } finally {
            setAcceptingCandidate(false);
            setSelectedRows([])
        }
      }
      
      // const rejectCandidate = async() =>{
      //   setRejectingCandidate(true);
      //   const payload = {
      //     candidates: selectedRows,
      //   };
      //   try {
      //     const {response} = await httpServiceObj.post("/someapi/fetch", payload, true, {}, true);
      //     await new Promise((resolve) => setTimeout(resolve, 2000));
      //     setFetchData((prevData) =>
      //       prevData.filter((candidate) =>
      //         !selectedRows.some((sel) => sel.id === candidate.id)
      //       )
      //     );
      //     toast.success("Candidate rejected successfully",getToastOptions({}))
      //     // console.log("Matching scores updated successfully!");
      //   } catch (error) {
      //     console.error("Error finding matching score:", error);
      //   } finally {
      //       setRejectingCandidate(false);
      //       setSelectedRows([])
      //   }
      // }
      
      //old findmatchingscore
      // const findMatchingScore = async () =>{
      //   setScoreLoading(true);

      //   const candidatesToSend = selectedRows.filter(candidate => !candidate.score);
      //   console.log("Candidates to send:", candidatesToSend);
      //   const payload = {
      //     candidates: candidatesToSend,
      //   };

      //   try {
      //     const {response} = await httpServiceObj.post("/someapi/fetch", payload, true, {}, true);
      //     await new Promise((resolve) => setTimeout(resolve, 2000));
      //     setFetchData((prevData) =>
      //       prevData.map((candidate) =>
      //         selectedRows.some((sel) => sel.id === candidate.id)
      //           ? { ...candidate, score: 80 }
      //           : candidate
      //       )
      //     );

      //     console.log("Matching scores updated successfully!");
      //   } catch (error) {
      //     console.error("Error finding matching score:", error);
      //   } finally {
      //       setScoreLoading(false);
      //   }
      // }
      


      const findMatchingScore = async () => {
        setScoreLoading(true);

        // Step 1: Copy selectedRows → dataFromParent (snapshot)
        const candidatesToSend = selectedRows.filter(c => !c.score);
        
        if (candidatesToSend.length === 0) {
          console.log("No candidates need scoring.");
          setScoreLoading(false);
          return;
        }

        console.log("Candidates to send:", candidatesToSend);
        const payload = { candidates: candidatesToSend };
        
        try {
          // Step 2: Start the scoring process once
          await httpServiceObj.post("/someapi/start-scoring", payload, true, {}, true);
          console.log("✅ Scoring started, now polling for updates...");

          const startTime = Date.now();
          const pollingInterval = 5000;
          let remainingCandidates = [...candidatesToSend]; // Track locally

          const poll = async () => {
            try {
              const { response } = await httpServiceObj.get("/someapi/fetch", true, {}, true);

              if (response && Array.isArray(response)) {
                // Update fetchedData and track what's left
                const updatedIds = new Set<string>();

                setFetchData(prev =>
                  prev.map(candidate => {
                    const updated = response.find(
                      (r: any) => r.id === candidate.id && r.score != null
                    );
                    if (updated) {
                      updatedIds.add(candidate.id);
                      return { ...candidate, score: updated.score };
                    }
                    return candidate;
                  })
                );

                // Remove scored candidates from tracking
                remainingCandidates = remainingCandidates.filter(
                  item => !updatedIds.has(item.id)
                );

                // Stop if all scored
                if (remainingCandidates.length === 0) {
                  console.log("✅ All scores received, stopping polling.");
                  clearInterval(intervalId);
                  setDataFromParent([]);
                  setScoreLoading(false);
                  return;
                }
              }
            } catch (pollError) {
              console.error("Polling error:", pollError);
            }

            // Check timeout
            const elapsed = Date.now() - startTime;
            if (elapsed > 30000) {
              console.warn("⏰ Polling timed out after 30 seconds. Assigning default score 80.");
              clearInterval(intervalId);

              // Assign default score 80 to remaining candidates
              setFetchData(prev =>
                prev.map(candidate => {
                  const isRemaining = remainingCandidates.some(r => r.id === candidate.id);
                  if (isRemaining && (candidate.score == null || candidate.score === undefined)) {
                    return { ...candidate, score: 80 };
                  }
                  return candidate;
                })
              );

              setDataFromParent([]);
              setScoreLoading(false);
            }
          };

          // Start polling
          const intervalId = setInterval(poll, pollingInterval);
          poll(); // Run immediately

        } catch (error) {
          console.error("Error finding matching score:", error);
          setScoreLoading(false);
        }
      };


      const sendForEvaluation = () =>{

      }
      const handleLocalUpdate = useCallback((jobId: string, updatedData: any) => {
        setFetchData((prevData) =>
            prevData.map((candidate) =>
              selectedRows.some((sel) => sel.id === candidate.id)
                ? { ...candidate, score: 80 }
                : candidate
            )
          );
      }, []);

      const isMatchingScore = (selectedRows: any[]): boolean => {
        for (const row of selectedRows) {
          if (row.score !== undefined && row.score !== null) {
            return false;
          }
        }
        return true;
      };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 my-2 items-stretch sm:items-center justify-center">
        {/* Dropdown 1 */}
        <div className="flex w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
          <GenericDropdownAgency
            selectTitle="Select job"
            tooltipMessage="Select Status to filter applications"
            disabled={false}
            options={jobFilter}
          />
        </div>

        {/* Dropdown 2 */}
        <div className="flex w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
          <GenericDropdownAgency
            selectTitle="Select agency"
            tooltipMessage="Select Status to filter applications"
            disabled={false}
            options={agencyFilter}
          />
        </div>
      </div>


      <div className="flex flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col gap-4">
          {/* <div className="flex flex-wrap gap-4">
          </div> */}
            <div
              className="
                flex flex-row
                flex-wrap lg:flex-nowrap
                justify-start items-stretch lg:items-center
                gap-2 lg:gap-3
                [&>*]:min-w-0

                /* SearchBar rules */
                [&>*:first-child]:basis-full [&>*:first-child]:w-full
                lg:[&>*:first-child]:basis-auto lg:[&>*:first-child]:w-auto lg:[&>*:first-child]:flex-1

                /* Buttons rules */
                [&>button]:flex-1 [&>button]:min-w-[140px] [&>button]:whitespace-normal
                lg:[&>button]:flex-none lg:[&>button]:min-w-0 lg:[&>button]:whitespace-nowrap
              "
            >
            {/* Search Bar */}
            <SearchBarAgency
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
              handleClick={() => console.log("as")}
            />

          <button
            type="button"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={"Move to applicants"}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs transition whitespace-nowrap
              ${
                selectedRows.length < 1 || acceptingCandidate
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-700"
              }
            `}
            disabled={selectedRows.length < 1 || acceptingCandidate}
            onClick={acceptAndMoveToApplicants}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Accept & move to applicant</span>
          </button>

            <button
              type="button"
              onClick={() => setIsRejecting(true)}
              disabled={selectedRows.length < 1 || rejectingCandidate}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Reject"}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 sm:px-1 py-2 sm:py-1 text-xs transition border
                ${
                  selectedRows.length < 1 || rejectingCandidate
                    ? "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
                    : "bg-white text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                }
              `}
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
            </button>

            <button 
              type="button"
              disabled={selectedRows.length < 1 || scoreLoading || !isMatchingScore(selectedRows)}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Find matching score"}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs transition whitespace-nowrap
                ${
                  selectedRows.length < 1 || scoreLoading || !isMatchingScore(selectedRows)
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-br from-cyan-300 to-cyan-500 text-white hover:to-cyan-700"
                }
              `}
              onClick={findMatchingScore}
            >
              <RefreshCcw className="w-4 h-4" />
              <span>{scoreLoading ? "Finding Score..." : "Find Matching Score"}</span>
            </button>

          <button 
            type="button"
            disabled={selectedRows.length < 1}
            data-tooltip-id="my-tooltip"
            data-tooltip-content={"Send to evaluator"}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs transition whitespace-nowrap
              ${
                selectedRows.length < 1
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-500 text-white hover:bg-blue-700"
              }
            `}
            onClick={()=>setIsEvaluatorForm(true)}
          >
            <Send className="w-4 h-4" />
            <span>Send for Evaluation</span>
          </button>

          </div>
        </div>
      </div>
      <br />
      {isLoading? (
              <SkeletonLoader
                  showTableHeader={true}
                  showTableRows={true}
                  tableColumns={5}
                  rowCount={5}
              />
              ) : (
              <AgencyCandidateListTable
                data={fetchData}
                userType="CORPORATE"
                refetch={refetch}
                ListSelection={ListSelection}
                handleUpdate={handleJobApplicationStatusUpdate}
                sendApplicationToRecruiter={handleSendToRecruiter}
                isBulkEvaluation={!!selectedRows.length}
                onBulkUpdate={onBulkUpdate}
                scoreLoading={scoreLoading}
                localUpdate={handleLocalUpdate}
                setFetchData={setFetchData}
                setSelectedRows={setSelectedRows}
              />
      )}
        <RejectCandidateModal
        onClose={()=>setIsRejecting(false)}
        isOpen={isRejecting}
        data={selectedRows}
        // onRefresh={()=>alert("closed")}
        // rejectCandidate={rejectCandidate}
        type={"multiple"}
        setFetchData={setFetchData}
        setSelectedRows={setSelectedRows}/>

      <Modal
        isOpen={isEvaluatorForm}
        onClose={() => setIsEvaluatorForm(false)}
        className="w-[90vw] sm:w-[455px] h-auto">
        {isEvaluatorForm &&
          <EvaluatorForm
          Defaultvalues={selectedRows as any}
          isBulk={true}
          onClose = {()=>setIsEvaluatorForm(false)}
          formLimit={10}/>
        }
      </Modal>
    </div>
  )
}

export default AgencyCandidateList
