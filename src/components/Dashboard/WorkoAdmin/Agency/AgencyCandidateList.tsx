import SearchBar from '@Components/Shared/SearchBar'
import SkeletonLoader from '@Components/Shared/SkeletonLoader'
import React, { useState } from 'react'
import AgencyCandidateListTable from './AgencyCandidateListTable'
import GenericDropdownAgency from '@Components/Shared/DropDown/GenericDropdownAgency'
import SearchBarAgency from '@Components/Shared/SearchBarAgency'
import { LogOut } from 'lucide-react'

const AgencyCandidateList = () => {
  const [searchBarText,setSearchBarText] = useState<string|null>("")
  const [queryIsJobsLoading,setQueryIsJobsLoading] = useState<boolean>(false)
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
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
    score: 80.5,
    currentStatus: "APPLIED",
    achievements:"Successfully led a small team to develop a cross-platform app that gained over 10,000 downloads within three months, while optimizing performance by 35% through efficient API integration. Automated multiple workflows, saving more than 20 hours per week and improving overall productivity. Recognized as “Developer of the Month” for outstanding innovation, leadership, and consistent delivery of high-quality results.",
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
    score: 70.8,
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
    score:60.2,
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
    score: 30.7,
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
    achievements:"Successfully led a small team to develop a cross-platform app that gained over 10,000 downloads within three months, while optimizing performance by 35% through efficient API integration. Automated multiple workflows, saving more than 20 hours per week and improving overall productivity. Recognized as “Developer of the Month” for outstanding innovation, leadership, and consistent delivery of high-quality results.",
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
];

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

  return (
    <div>
    <div className='flex flex-row gap-2 justify-center items-center m-2'>
            {/* Dropdown 1 */}
              <div className="flex gap-3 font-semibold w-full sm:w-auto">
                <GenericDropdownAgency
                  selectTitle={"Select job"}
                  tooltipMessage="Select Status to filter applications"
                  disabled={false}
                  options={StatusFilterDropdown}
                />
              </div>

            {/* Dropdown 2 */}
              <div className="flex gap-3 font-semibold w-full sm:w-auto">
                <GenericDropdownAgency
                  selectTitle={"Select agency"}
                  tooltipMessage="Select Status to filter applications"
                  disabled={false}
                  options={StatusFilterDropdown}
                />
              </div>

            {/* Dropdown 3 */}
              <div className="flex gap-3 font-semibold w-full sm:w-auto">
                <GenericDropdownAgency
                  selectTitle={"Company name"}
                  tooltipMessage="Select Status to filter applications"
                  disabled={false}
                  options={StatusFilterDropdown}
                />
              </div>
    </div>

      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col ">
          <div className="flex flex-wrap  gap-4">
          </div>
          <div className="flex flex-col sm:flex-row justify-end items-end gap-3">
            {/* Search Bar */}
            <SearchBarAgency
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
              handleClick={() => console.log("as")}
            />
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
                data={dummyData}
                userType="ADMIN"
                refetch={refetch}
                ListSelection={ListSelection}
                handleUpdate={handleJobApplicationStatusUpdate}
                sendApplicationToRecruiter={handleSendToRecruiter}
                isBulkEvaluation={!!selectedRows.length}
                onBulkUpdate={onBulkUpdate}
              />
      )}
    </div>
  )
}

export default AgencyCandidateList
