import SearchBar from '@Components/Shared/SearchBar'
import SkeletonLoader from '@Components/Shared/SkeletonLoader'
import React, { useCallback, useEffect, useState } from 'react'
import AgencyCandidateListTable from './AgencyCandidateListTable'
import GenericDropdownAgency from '@Components/Shared/DropDown/GenericDropdownAgency'
import SearchBarAgency from '@Components/Shared/SearchBarAgency'
import httpServiceObj from '@Services/ApiHandler.service'
import { AgencyDatabaseApplicantDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto'
import { Check, RefreshCcw, Send, X } from 'lucide-react'
import RejectCandidateModal from './modals/RejectCandidateModal'
import { toast } from 'react-toastify'
import { getToastOptions } from 'lib-worko-ui'

interface UserDetails {
  id: string;
  // add any other fields you expect
}

const AgencyCandidateList = () => {
  const [searchBarText,setSearchBarText] = useState<string|null>("")
  const [queryIsJobsLoading,setQueryIsJobsLoading] = useState<boolean>(false)
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isRejecting,setIsRejecting] = useState<boolean>(false);
  const [fetchData, setFetchData] = useState<any[]>([]);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [acceptingCandidate, setAcceptingCandidate] = useState(false);
  const [rejectingCandidate, setRejectingCandidate] = useState(false);

  const [jobFilter,setJobFilter] = useState<any>([]);
  const [agencyFilter,setAgencyFilter] = useState<any>([]);

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

  useEffect(() => {
    const fetchingAllCandidate = async () => {
      try {
        const { response } = await httpServiceObj.get("callingapi", true, {}, true);

        if (response) {
          setFetchData(response as any);
        } else {
          setFetchData(dummyData);
        }
        const data = response as any || dummyData;

        const agencyFilters = data.map((item: any) => ({
          label: item.agencyName,
          onClick: () => setAgencyFilter(item.agencyName),
        }));
        setAgencyFilter(agencyFilters);

        const jobFilters = data.map((item: any) => ({
          label: item.jobProfile,
          onClick: () => setJobFilter(item.jobProfile),
        }));
        setJobFilter(jobFilters);

        setAgencyFilter(agencyFilters);
      } catch (error) {
        console.log("Error fetching data:", error);
        setFetchData(dummyData);
      }
    };

    fetchingAllCandidate();
  }, []);


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
      
      const rejectCandidate = async() =>{
        setRejectingCandidate(true);
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
          toast.success("Candidate rejected successfully",getToastOptions({}))
          // console.log("Matching scores updated successfully!");
        } catch (error) {
          console.error("Error finding matching score:", error);
        } finally {
            setRejectingCandidate(false);
            setSelectedRows([])
        }
      }
      
      const findMatchingScore = async () =>{
        setScoreLoading(true);

        const candidatesToSend = selectedRows.filter(candidate => !candidate.score);
        console.log("Candidates to send:", candidatesToSend);
        const payload = {
          candidates: candidatesToSend,
        };

        try {
          const {response} = await httpServiceObj.post("/someapi/fetch", payload, true, {}, true);
          await new Promise((resolve) => setTimeout(resolve, 2000));
          setFetchData((prevData) =>
            prevData.map((candidate) =>
              selectedRows.some((sel) => sel.id === candidate.id)
                ? { ...candidate, score: 80 }
                : candidate
            )
          );

          console.log("Matching scores updated successfully!");
        } catch (error) {
          console.error("Error finding matching score:", error);
        } finally {
            setScoreLoading(false);
        }
      }
      
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 justify-center items-center m-2">
        {/* Dropdown 1 */}
        <div className="flex justify-center w-full sm:w-auto">
          <GenericDropdownAgency
            selectTitle="Select job"
            tooltipMessage="Select Status to filter applications"
            disabled={false}
            options={jobFilter}
          />
        </div>

        {/* Dropdown 2 */}
        <div className="flex justify-center w-full sm:w-auto">
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
          <div className="flex flex-wrap gap-4">
          </div>
          <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-end gap-3">
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
              disabled={selectedRows.length < 1 || scoreLoading}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Find matching score"}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs transition whitespace-nowrap
                ${
                  selectedRows.length < 1 || scoreLoading
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
          >
            <Send className="w-4 h-4" />
            <span>Send for Evaluation</span>
          </button>

          </div>
        </div>
      </div>
      <br />
      {queryIsJobsLoading ? (
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
              />
      )}
        <RejectCandidateModal
        onClose={()=>setIsRejecting(false)}
        isOpen={isRejecting}
        data={selectedRows}
        onRefresh={()=>alert("closed")}
        rejectCandidate={rejectCandidate}/>
    </div>
  )
}

export default AgencyCandidateList
