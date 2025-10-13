import DatabaseDropdown from '@Components/Shared/DropDown/DatabaseDropdown';
import SearchBar from '@Components/Shared/SearchBar';
import SkeletonLoader from '@Components/Shared/SkeletonLoader';
import { DatabaseStatusType, JobApplicationStatusType } from '@TypesAndConstants/JobsAndApplication.type';
import { Ban, Download, Forward, Pencil, Trash2, Upload,Eye } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import AdminDatabaseTable from './AdminDatabaseTable';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';

interface AdminDatabaseProps{

}

{/*
filter is happening from backend api 
pagination is happening from backend api
change the naming convention because mostly its copy pasted
sorting fallbacks needs to be changed as per database data
remove useless codes
icons needs to be changed
*/}
const dummyData = [
  {
    id: "ref-1",
    pk: "REFERRAL#ref-1",
    sk: "CANDIDATE#ref-1",
    referredBy: "Anita Sharma",
    refereeType: "internal",
    date: "2025-09-15",
    profileName: "Product Manager",
    candidateName: "Karan Mehta",
    candidateEmail: "karan.mehta@example.com",
    contactNumber: "+91-9876543210",
    YOE: 7,
    currentCompany: "ZetaTech",
    currentDesignation: "Product Owner",
    currentCTC: "22 LPA",
    expectedCTC: "26 LPA",
    noticePeriod: "45 days",
    locationComfortableWith: "Mumbai, Remote",
    remark: "Strong product background with fintech domain.",
    cv: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    lastRejectionDate: "2025-09-15",
    rejectedBy: "Somesh Dey",
    coolingPeriod: "30 days",
    rejectedReason: "Not aligned with project needs",
  },
  {
    id: "ref-2",
    pk: "REFERRAL#ref-2",
    sk: "CANDIDATE#ref-2",
    referredBy: "Ravi Sinha",
    refereeType: "referral",
    date: "2025-10-02",
    profileName: "Backend Developer",
    candidateName: "Sneha Reddy",
    candidateEmail: "sneha.reddy@example.com",
    contactNumber: "+91-9876543211",
    YOE: 5,
    currentCompany: "CodeCrush",
    currentDesignation: "Java Developer",
    currentCTC: "14 LPA",
    expectedCTC: "17 LPA",
    noticePeriod: "60 days",
    locationComfortableWith: "Hyderabad, Remote",
    remark: "Excellent in Spring Boot and microservices.",
    cv: "https://www.orimi.com/pdf-test.pdf",
    lastRejectionDate: "2025-09-16",
    rejectedBy: "Meera Thomas",
    coolingPeriod: "60 days",
    rejectedReason: "Skills mismatch",
  },
  {
    id: "ref-3",
    pk: "REFERRAL#ref-3",
    sk: "CANDIDATE#ref-3",
    referredBy: "Deepak Nair",
    refereeType: "internal",
    date: "2025-10-01",
    profileName: "QA Engineer",
    candidateName: "Nikita Joshi",
    candidateEmail: "nikita.joshi@example.com",
    contactNumber: "+91-9876543212",
    YOE: 4,
    currentCompany: "TestNova",
    currentDesignation: "QA Analyst",
    currentCTC: "9 LPA",
    expectedCTC: "11 LPA",
    noticePeriod: "30 days",
    locationComfortableWith: "Pune",
    remark: "Automation and manual QA expert.",
    cv: "https://www.africau.edu/images/default/sample.pdf",
    lastRejectionDate: "2025-09-17",
    rejectedBy: "Rakesh Menon",
    coolingPeriod: "45 days",
    rejectedReason: "Failed technical round",
  },
  {
    id: "ref-4",
    pk: "REFERRAL#ref-4",
    sk: "CANDIDATE#ref-4",
    referredBy: "Pooja Rao",
    refereeType: "agency",
    date: "2025-09-30",
    profileName: "UI/UX Designer",
    candidateName: "Arjun Khanna",
    candidateEmail: "arjun.khanna@example.com",
    contactNumber: "+91-9876543213",
    YOE: 6,
    currentCompany: "DesignGurus",
    currentDesignation: "UX Designer",
    currentCTC: "11 LPA",
    expectedCTC: "13 LPA",
    noticePeriod: "15 days",
    locationComfortableWith: "Delhi NCR",
    remark: "Strong portfolio and user-centric approach.",
    cv: "https://www.hq.nasa.gov/alsj/a17/A17_FlightPlan.pdf",
    lastRejectionDate: "2025-09-18",
    rejectedBy: "Priya Narang",
    coolingPeriod: "90 days",
    rejectedReason: "Overqualified for the role",
  },
  {
    id: "ref-5",
    pk: "REFERRAL#ref-5",
    sk: "CANDIDATE#ref-5",
    referredBy: "Maya Kapoor",
    refereeType: "internal",
    date: "2025-10-05",
    profileName: "DevOps Engineer",
    candidateName: "Ramesh Bhat",
    candidateEmail: "ramesh.bhat@example.com",
    contactNumber: "+91-9876543214",
    YOE: 8,
    currentCompany: "Cloudify",
    currentDesignation: "Site Reliability Engineer",
    currentCTC: "18 LPA",
    expectedCTC: "21 LPA",
    noticePeriod: "90 days",
    locationComfortableWith: "Remote",
    remark: "Kubernetes, Docker, CI/CD expert.",
    cv: "https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf",
    lastRejectionDate: "2025-09-19",
    rejectedBy: "Amit Shah",
    coolingPeriod: "30 days",
    rejectedReason: "Communication skills concern",
  },
  {
    id: "ref-6",
    pk: "REFERRAL#ref-6",
    sk: "CANDIDATE#ref-6",
    referredBy: "Nikhil Ghosh",
    refereeType: "worko",
    date: "2025-09-25",
    profileName: "Data Scientist",
    candidateName: "Priya Iyer",
    candidateEmail: "priya.iyer@example.com",
    contactNumber: "+91-9876543215",
    YOE: 5,
    currentCompany: "AIWorks",
    currentDesignation: "Data Analyst",
    currentCTC: "13 LPA",
    expectedCTC: "16 LPA",
    noticePeriod: "30 days",
    locationComfortableWith: "Chennai, Remote",
    remark: "Proficient in ML, Python, SQL.",
    cv: "https://unec.edu.az/application/uploads/2014/12/pdf-sample.pdf",
    lastRejectionDate: "2025-09-20",
    rejectedBy: "Kiran Deshmukh",
    coolingPeriod: "60 days",
    rejectedReason: "Budget constraints",
  },
  {
    id: "ref-7",
    pk: "REFERRAL#ref-7",
    sk: "CANDIDATE#ref-7",
    referredBy: "Aman Saxena",
    refereeType: "agency",
    date: "2025-09-18",
    profileName: "Frontend Developer",
    candidateName: "Tina Fernandes",
    candidateEmail: "tina.fernandes@example.com",
    contactNumber: "+91-9876543216",
    YOE: 4,
    currentCompany: "Frontify",
    currentDesignation: "React Developer",
    currentCTC: "12 LPA",
    expectedCTC: "14 LPA",
    noticePeriod: "15 days",
    locationComfortableWith: "Remote",
    remark: "React + TailwindCSS specialist.",
    cv: "https://www.bu.edu/pcgs/files/2021/10/sample.pdf",
    lastRejectionDate: "2025-09-21",
    rejectedBy: "Divya Patel",
    coolingPeriod: "30 days",
    rejectedReason: "Better internal candidate available",
  },
  {
    id: "ref-8",
    pk: "REFERRAL#ref-8",
    sk: "CANDIDATE#ref-8",
    referredBy: "Siddharth Jain",
    refereeType: "referral",
    date: "2025-10-03",
    profileName: "Project Manager",
    candidateName: "Neha Chatterjee",
    candidateEmail: "neha.chatterjee@example.com",
    contactNumber: "+91-9876543217",
    YOE: 7,
    currentCompany: "AgileBase",
    currentDesignation: "Scrum Master",
    currentCTC: "20 LPA",
    expectedCTC: "23 LPA",
    noticePeriod: "60 days",
    locationComfortableWith: "Bangalore",
    remark: "Certified PMP with 7+ years experience.",
    cv: "https://file-examples.com/wp-content/uploads/2017/10/file-sample_150kB.pdf",
    lastRejectionDate: "2025-09-22",
    rejectedBy: "Anil Kumar",
    coolingPeriod: "45 days",
    rejectedReason: "Role already filled",
  },
  {
    id: "ref-9",
    pk: "REFERRAL#ref-9",
    sk: "CANDIDATE#ref-9",
    referredBy: "Kunal Patil",
    refereeType: "referral",
    date: "2025-09-20",
    profileName: "Mobile Developer",
    candidateName: "Imran Khan",
    candidateEmail: "imran.khan@example.com",
    contactNumber: "+91-9876543218",
    YOE: 3,
    currentCompany: "AppSprint",
    currentDesignation: "Flutter Developer",
    currentCTC: "10 LPA",
    expectedCTC: "12 LPA",
    noticePeriod: "45 days",
    locationComfortableWith: "Mumbai, Remote",
    remark: "Strong cross-platform experience.",
    cv: "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf",
    lastRejectionDate: "2025-09-23",
    rejectedBy: "Rekha Singh",
    coolingPeriod: "60 days",
    rejectedReason: "Insufficient experience",
  },
  {
    id: "ref-10",
    pk: "REFERRAL#ref-10",
    sk: "CANDIDATE#ref-10",
    referredBy: "Shruti Verma",
    refereeType: "worko",
    date: "2025-10-06",
    profileName: "Cloud Engineer",
    candidateName: "Abhay Raj",
    candidateEmail: "abhay.raj@example.com",
    contactNumber: "+91-9876543219",
    YOE: 6,
    currentCompany: "NetCloud",
    currentDesignation: "AWS Engineer",
    currentCTC: "16 LPA",
    expectedCTC: "19 LPA",
    noticePeriod: "30 days",
    locationComfortableWith: "Remote, Hyderabad",
    remark: "Certified AWS Solutions Architect.",
    cv: "https://calibre-ebook.com/downloads/demos/demo.pdf",
    lastRejectionDate: "2025-09-24",
    rejectedBy: "Suresh Rathi",
    coolingPeriod: "90 days",
    rejectedReason: "Did not accept offer",
  },
];


const AdminDatabase:React.FC<AdminDatabaseProps> = () => {
    const [searchBarText, setSearchBarText] = useState<string|null>("")
    const [apiStatus, setApiStatus] = useState<DatabaseStatusType>();
    const [queryIsJobsLoading,setQueryIsJobsLoading] = useState<boolean>(false)
    const [selectedRows, setSelectedRows] = useState<any[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isActionSelected,setIsActionSelected] = useState<boolean>(false);
    const [actionName,setactionName] = useState<string>("");
    const dropdownRef = useRef<HTMLDivElement | null>(null);
  
    useEffect(() => {
      function handleClickOutside(event:any) {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowDropdown(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // useEffect(()=>{
    //     console.log(selectedRows,"selectedrows")
    // },[selectedRows])

    const SourceFilterDropdown = [
        { label: "All", onClick: () => setApiStatus(undefined) },
        { label: "Blacklisted", onClick: () => setApiStatus("BLACKLISTED") },
        { label: "Under cooling period", onClick: () => setApiStatus("UNDER_COOLING_PERIOD") },
        { label: "Under processing", onClick: () => setApiStatus("UNDER_PROCESSING") },
    ];

    const StatusFilterDropdown = [
        { label: "All", onClick: () => setApiStatus(undefined) },
        { label: "Referral", onClick: () => setApiStatus("REFERRAL") },
        { label: "Internal", onClick: () => setApiStatus("INTERNAL") },
        { label: "Agency", onClick: () => setApiStatus("AGENCY") },
        { label: "Worko", onClick: () => setApiStatus("WORKO") },
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

    const handleBulkBan = () =>{
        console.log(selectedRows)
    }

    const handleBulkDelete = () =>{
        console.log(selectedRows)
    }

    const handleBulkCVDownload = async() =>{
        if (selectedRows.length === 0) {
            toast.error("Please select at least one candidate to download CVs",getToastOptions({}));
            return;
        }
        for (const row of selectedRows) {
            if (row.cv) {
            try {
                const response = await fetch(row.cv, { mode: "cors" });
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `${row.candidateName || "CV"}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Failed to download CV:", error);
            }
            }
        }
};

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col ">
          <div className="flex flex-wrap  gap-4">
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            {/* Search Bar */}
            <SearchBar
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
              handleClick={() => console.log("as")}
            />
            <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">   
               <button 
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 transition whitespace-nowrap"
                    >
                    <Upload className="w-4 h-4" />
                    <span>Bulk CV upload</span>
                </button>

                    <DatabaseDropdown
                    selectTitle="Source"
                    tooltipMessage="Filter by source"
                    options={StatusFilterDropdown}
                    />
                
                    <DatabaseDropdown
                    selectTitle="Status"
                    tooltipMessage="Filter by status"
                    options={SourceFilterDropdown}
                    />

                <button 
                    onClick={handleBulkBan}
                    disabled={selectedRows.length<1}
                    type="button"
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content={"Ban"}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition whitespace-nowrap
                    ${selectedRows.length < 1 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-white text-blue-700 hover:bg-blue-700 hover:text-white"}`}
                    >
                    <Ban className="w-4 h-4"/>
                </button>
                
                <button 
                    onClick={handleBulkDelete}
                    disabled={selectedRows.length<1}
                    type="button"
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content={"Delete"}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition whitespace-nowrap
                        ${selectedRows.length < 1 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-white text-red-500 hover:bg-red-500 hover:text-white"}`}
                    >
                    <Trash2 className="w-4 h-4" />
                </button>

                <div className="relative inline-block" ref={dropdownRef}>
                  <button 
                    onClick={() => {
                      if (selectedRows.length >= 1) setShowDropdown((prev) => !prev);
                    }}                  
                    disabled={selectedRows.length < 1}
                    type="button"
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content={"Action"}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition whitespace-nowrap
                      ${selectedRows.length < 1 
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                        : "bg-white text-blue-700 hover:bg-blue-700 hover:text-white"}`}
                  >
                    <Forward className="w-5 h-6" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <button 
                        onClick={() => {
                          setIsActionSelected(true)
                          setactionName("Move to applicants")
                          setShowDropdown(false);
                        }} 
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Move to applicants
                      </button>
                      <button 
                        onClick={() => {
                          setIsActionSelected(true)
                          setactionName("Move to bulk")
                          setShowDropdown(false);
                        }} 
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        Move for bulk matching
                      </button>
                    </div>
                  )}
                </div>

                <button 
                    onClick={handleBulkCVDownload}
                    disabled={selectedRows.length<1}
                    type="button"
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content={"Download cv"}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition whitespace-nowrap
                    ${selectedRows.length < 1 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                    : "bg-white text-blue-700 hover:bg-blue-700 hover:text-white"}`}
                    >
                    <Download className="w-4 h-4" />
                </button>
            </div>
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
        <AdminDatabaseTable
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

export default AdminDatabase