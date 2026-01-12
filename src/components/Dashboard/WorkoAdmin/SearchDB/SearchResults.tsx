import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import SearchBar from '@Components/Shared/SearchBar';
import SkeletonLoader from '@Components/Shared/SkeletonLoader';
import { DatabaseStatusType } from '@TypesAndConstants/JobsAndApplication.type';
import { RefreshCcw, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';
import SearchResultsTable from "./SearchResultsTable";

const SearchResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query") || "";
  const [searchBarText, setSearchBarText] = useState<string|null>("")
  const [apiStatus, setApiStatus] = useState<DatabaseStatusType>();
  const [queryIsJobsLoading,setQueryIsJobsLoading] = useState<boolean>(false)
  const [selectedRows, setSelectedRows] = useState<any[]>([]);

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


  useEffect(() => {
    console.log("Search query:", query);
  }, [query]);
  
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
          </div>
          <br />
            <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end mb-2">   
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
      {/* <br /> */}
        {queryIsJobsLoading ? (
        <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
        />
        ) : (
        <SearchResultsTable
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
  );
};

export default SearchResults;
