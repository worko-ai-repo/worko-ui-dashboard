import SkeletonLoader from '@Components/Shared/SkeletonLoader'
import React, { useState } from 'react'
import AgencyListTable from './AgencyListTable'
import { Plus } from 'lucide-react'
import AddNewAgencyModal from './modals/AddNewAgencyModal'

const AgencyList = () => {
  const [searchBarText,setSearchBarText] = useState<string|null>("")
  const [queryIsJobsLoading,setQueryIsJobsLoading] = useState<boolean>(false)
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [isAddAgencyModelOpen,setIsAddAgencyModelOpen] = useState<boolean>(false);
  const dummyData = [
    {
        id: "ref-10",
        pk: "REFERRAL#ref-10",
        sk: "CANDIDATE#ref-10",
        agencyName: "TechHire Solutions",
        emailId: "abhay.raj@example.com",
        contactName: "Abhay Raj",
        contactNumber: "+91-9876543219",
        dateActivated: "2025-10-05",
        assignedJobs: 8,
        totalCandidateSubmitted: 30,
        totalCandidateRejected: 30,
        totalCandidateHired: 30,
        GSTIN: "29AAACC1206D2ZB",
        contractLink: "https://calibre-ebook.com/downloads/demos/demo.pdf",
    },
    {
        id: "ref-11",
        pk: "REFERRAL#ref-11",
        sk: "CANDIDATE#ref-11",
        agencyName: "NextGen Recruiters",
        emailId: "sneha.verma@example.com",
        contactName: "Sneha Verma",
        contactNumber: "+91-9876501234",
        dateActivated: "2025-10-01",
        assignedJobs: 5,
        totalCandidateSubmitted: 20,
        totalCandidateRejected: 5,
        totalCandidateHired: 10,
        GSTIN: "07AAACB2234M1ZK",
        contractLink: "https://example.com/contracts/nextgen.pdf",
    },
    {
        id: "ref-12",
        pk: "REFERRAL#ref-12",
        sk: "CANDIDATE#ref-12",
        agencyName: "FuturePlacers",
        emailId: "rahul.kumar@example.com",
        contactName: "Rahul Kumar",
        contactNumber: "+91-9988776655",
        dateActivated: "2025-09-25",
        assignedJobs: 10,
        totalCandidateSubmitted: 40,
        totalCandidateRejected: 15,
        totalCandidateHired: 20,
        GSTIN: "27AABCU9603R1Z5",
        contractLink: "https://example.com/contracts/futureplacers.pdf",
    },
    {
        id: "ref-13",
        pk: "REFERRAL#ref-13",
        sk: "CANDIDATE#ref-13",
        agencyName: "SkillConnect",
        emailId: "neha.mishra@example.com",
        contactName: "Neha Mishra",
        contactNumber: "+91-9123456789",
        dateActivated: "2025-09-15",
        assignedJobs: 6,
        totalCandidateSubmitted: 22,
        totalCandidateRejected: 8,
        totalCandidateHired: 11,
        GSTIN: "19AACCM9910C1Z2",
        contractLink: "https://example.com/contracts/skillconnect.pdf",
    },
    {
        id: "ref-14",
        pk: "REFERRAL#ref-14",
        sk: "CANDIDATE#ref-14",
        agencyName: "HireNow Agency",
        emailId: "amit.shah@example.com",
        contactName: "Amit Shah",
        contactNumber: "+91-9090909090",
        dateActivated: "2025-09-10",
        assignedJobs: 7,
        totalCandidateSubmitted: 35,
        totalCandidateRejected: 20,
        totalCandidateHired: 10,
        GSTIN: "33AAACN1234F1Z3",
        contractLink: "https://example.com/contracts/hirenow.pdf",
    },
    {
        id: "ref-15",
        pk: "REFERRAL#ref-15",
        sk: "CANDIDATE#ref-15",
        agencyName: "WorkForce India",
        emailId: "karan.jain@example.com",
        contactName: "Karan Jain",
        contactNumber: "+91-8888888888",
        dateActivated: "2025-10-02",
        assignedJobs: 4,
        totalCandidateSubmitted: 18,
        totalCandidateRejected: 6,
        totalCandidateHired: 7,
        GSTIN: "24AAACL4567Q1Z1",
        contractLink: "https://example.com/contracts/workforce.pdf",
    },
    {
        id: "ref-16",
        pk: "REFERRAL#ref-16",
        sk: "CANDIDATE#ref-16",
        agencyName: "SmartHire Solutions",
        emailId: "deepa.mehta@example.com",
        contactName: "Deepa Mehta",
        contactNumber: "+91-9000000001",
        dateActivated: "2025-09-28",
        assignedJobs: 9,
        totalCandidateSubmitted: 28,
        totalCandidateRejected: 12,
        totalCandidateHired: 14,
        GSTIN: "21AABCS1234L1Z9",
        contractLink: "https://example.com/contracts/smarthire.pdf",
    },
    {
        id: "ref-17",
        pk: "REFERRAL#ref-17",
        sk: "CANDIDATE#ref-17",
        agencyName: "TalentSpring",
        emailId: "arjun.rana@example.com",
        contactName: "Arjun Rana",
        contactNumber: "+91-9101010101",
        dateActivated: "2025-09-20",
        assignedJobs: 3,
        totalCandidateSubmitted: 10,
        totalCandidateRejected: 3,
        totalCandidateHired: 5,
        GSTIN: "08AACCR1234B1Z6",
        contractLink: "https://example.com/contracts/talentspring.pdf",
    },
    {
        id: "ref-18",
        pk: "REFERRAL#ref-18",
        sk: "CANDIDATE#ref-18",
        agencyName: "Recruitly",
        emailId: "priya.singh@example.com",
        contactName: "Priya Singh",
        contactNumber: "+91-9012345678",
        dateActivated: "2025-10-08",
        assignedJobs: 2,
        totalCandidateSubmitted: 12,
        totalCandidateRejected: 2,
        totalCandidateHired: 8,
        GSTIN: "04AACCP1234E1Z5",
        contractLink: "https://example.com/contracts/recruitly.pdf",
    },
    {
        id: "ref-19",
        pk: "REFERRAL#ref-19",
        sk: "CANDIDATE#ref-19",
        agencyName: "JobBridge",
        emailId: "manoj.das@example.com",
        contactName: "Manoj Das",
        contactNumber: "+91-9321654987",
        dateActivated: "2025-10-09",
        assignedJobs: 12,
        totalCandidateSubmitted: 50,
        totalCandidateRejected: 25,
        totalCandidateHired: 15,
        GSTIN: "10AAACX1234K1Z7",
        contractLink: "https://example.com/contracts/jobbridge.pdf",
    }
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
    <div className='flex flex-row gap-2 justify-center items-center'>
    </div>

      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-row justify-end items-center">
          <div className="flex flex-wrap gap-4">
          </div>
           {/* Search Bar */}
            {/* <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <SearchBar
                searchBarText={searchBarText}
                setSearchBarText={setSearchBarText}
                handleClick={() => console.log("as")}
                />
            </div> */}
            <div className='flex flex-col mt-4'>         
              <button 
              onClick={()=>setIsAddAgencyModelOpen(!isAddAgencyModelOpen)}
              className='border rounded-lg px-4 py-3 text-xs flex flex-row justify-center items-center gap-1 text-white bg-gradient-to-t from-blue-500 to-cyan-300 font-semibold'>
                <Plus className='h-4 w-auto font-semibold'/>
                Add Agency
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
              <AgencyListTable
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
        <AddNewAgencyModal
          dashboardType={"admin"}
          onClose= {() => setIsAddAgencyModelOpen(false)}
          isOpen= {isAddAgencyModelOpen}
          userID={"12345"}
        />
    </div>
  )
}

export default AgencyList
