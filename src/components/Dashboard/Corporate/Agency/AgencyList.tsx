import SkeletonLoader from '@Components/Shared/SkeletonLoader'
import React, { useCallback, useEffect, useState } from 'react'
import AgencyListTable from './AgencyListTable'
import { Plus } from 'lucide-react'
import AddNewAgencyModal from './modals/AddNewAgencyModal'
import httpServiceObj from '@Services/ApiHandler.service'
import { CognitoMetaDataDto, useAppContext } from "@Context/App.context";
import { useDashboardContext } from '@Context/Dashboard.context'

const AgencyList = () => {
  const [searchBarText,setSearchBarText] = useState<string|null>("")
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [isAddAgencyModelOpen,setIsAddAgencyModelOpen] = useState<boolean>(false);
  const [fetchData,setFetchData] = useState<any>(null);
  const [isLoading,setIsLoading] = useState<boolean>(false)
  const baseUrl = import.meta.env.APP_PROXY_AGENCY_BASE
  const { userDetails } = useAppContext();
  const { user, isLoadingUser } = useDashboardContext();

  //@TODO use callback maybe to call api
  useEffect(() => {
    const fetchUserData = async () =>{
        if(!userDetails) {
          return
        }
        setIsLoading(true)
        const url = `${baseUrl}/agency-invite/${userDetails?.companyId}`;
        try {
          const { response } = await httpServiceObj.get(url, true, {}, true);
          if(response){
            // const data = response as UserDetails[];
            setFetchData(response)
          }else{
            setFetchData(dummyData)
          }
        } catch (error) {
          console.error("Cannot fetch user details:", error);
          setFetchData(dummyData)
        } finally{
          setIsLoading(false)
        }
    }
    fetchUserData()
  }, [userDetails])

  const dummyData = [
    {
        id: "ref-10",
        pk: "REFERRAL#ref-10",
        sk: "CANDIDATE#ref-10",
        name: "TechHire Solutions",
        email: "abhay.raj@example.com",
        contactName: "Abhay Raj",
        contactNumber: "+91-9876543219",
        dateActivated: "2025-10-05",
        assignedJobs: 8,
        totalCandidateSubmitted: 30,
        totalCandidateRejected: 30,
        totalCandidateHired: 30,
        GSTIN: "29AAACC1206D2ZB",
        contractCopyAwsS3FileName: "https://calibre-ebook.com/downloads/demos/demo.pdf",
        isPaused:true,
    },
    {
        id: "ref-11",
        pk: "REFERRAL#ref-11",
        sk: "CANDIDATE#ref-11",
        name: "NextGen Recruiters",
        email: "sneha.verma@example.com",
        contactName: "Sneha Verma",
        contactNumber: "+91-9876501234",
        dateActivated: "2025-10-01",
        assignedJobs: 5,
        totalCandidateSubmitted: 20,
        totalCandidateRejected: 5,
        totalCandidateHired: 10,
        GSTIN: "07AAACB2234M1ZK",
        contractCopyAwsS3FileName: "https://example.com/contracts/nextgen.pdf",
        isPaused:false,
    },
    {
        id: "ref-12",
        pk: "REFERRAL#ref-12",
        sk: "CANDIDATE#ref-12",
        name: "FuturePlacers",
        email: "rahul.kumar@example.com",
        contactName: "Rahul Kumar",
        contactNumber: "+91-9988776655",
        dateActivated: "2025-09-25",
        assignedJobs: 10,
        totalCandidateSubmitted: 40,
        totalCandidateRejected: 15,
        totalCandidateHired: 20,
        GSTIN: "27AABCU9603R1Z5",
        contractCopyAwsS3FileName: "https://example.com/contracts/futureplacers.pdf",
        isPaused:false,
    },
    {
        id: "ref-13",
        pk: "REFERRAL#ref-13",
        sk: "CANDIDATE#ref-13",
        name: "SkillConnect",
        email: "neha.mishra@example.com",
        contactName: "Neha Mishra",
        contactNumber: "+91-9123456789",
        dateActivated: "2025-09-15",
        assignedJobs: 6,
        totalCandidateSubmitted: 22,
        totalCandidateRejected: 8,
        totalCandidateHired: 11,
        GSTIN: "19AACCM9910C1Z2",
        contractCopyAwsS3FileName: "https://example.com/contracts/skillconnect.pdf",
        isPaused:false,
    },
    {
        id: "ref-14",
        pk: "REFERRAL#ref-14",
        sk: "CANDIDATE#ref-14",
        name: "HireNow Agency",
        email: "amit.shah@example.com",
        contactName: "Amit Shah",
        contactNumber: "+91-9090909090",
        dateActivated: "2025-09-10",
        assignedJobs: 7,
        totalCandidateSubmitted: 35,
        totalCandidateRejected: 20,
        totalCandidateHired: 10,
        GSTIN: "33AAACN1234F1Z3",
        contractCopyAwsS3FileName: "https://example.com/contracts/hirenow.pdf",
        isPaused:false,
    },
    {
        id: "ref-15",
        pk: "REFERRAL#ref-15",
        sk: "CANDIDATE#ref-15",
        name: "WorkForce India",
        email: "karan.jain@example.com",
        contactName: "Karan Jain",
        contactNumber: "+91-8888888888",
        dateActivated: "2025-10-02",
        assignedJobs: 4,
        totalCandidateSubmitted: 18,
        totalCandidateRejected: 6,
        totalCandidateHired: 7,
        GSTIN: "24AAACL4567Q1Z1",
        contractCopyAwsS3FileName: "https://example.com/contracts/workforce.pdf",
        isPaused:false,
    },
    {
        id: "ref-16",
        pk: "REFERRAL#ref-16",
        sk: "CANDIDATE#ref-16",
        name: "SmartHire Solutions",
        email: "deepa.mehta@example.com",
        contactName: "Deepa Mehta",
        contactNumber: "+91-9000000001",
        dateActivated: "2025-09-28",
        assignedJobs: 9,
        totalCandidateSubmitted: 28,
        totalCandidateRejected: 12,
        totalCandidateHired: 14,
        GSTIN: "21AABCS1234L1Z9",
        contractCopyAwsS3FileName: "https://example.com/contracts/smarthire.pdf",
        isPaused:false,
    },
    {
        id: "ref-17",
        pk: "REFERRAL#ref-17",
        sk: "CANDIDATE#ref-17",
        name: "TalentSpring",
        email: "arjun.rana@example.com",
        contactName: "Arjun Rana",
        contactNumber: "+91-9101010101",
        dateActivated: "2025-09-20",
        assignedJobs: 3,
        totalCandidateSubmitted: 10,
        totalCandidateRejected: 3,
        totalCandidateHired: 5,
        GSTIN: "08AACCR1234B1Z6",
        contractCopyAwsS3FileName: "https://example.com/contracts/talentspring.pdf",
        isPaused:false,
    },
    {
        id: "ref-18",
        pk: "REFERRAL#ref-18",
        sk: "CANDIDATE#ref-18",
        name: "Recruitly",
        email: "priya.singh@example.com",
        contactName: "Priya Singh",
        contactNumber: "+91-9012345678",
        dateActivated: "2025-10-08",
        assignedJobs: 2,
        totalCandidateSubmitted: 12,
        totalCandidateRejected: 2,
        totalCandidateHired: 8,
        GSTIN: "04AACCP1234E1Z5",
        contractCopyAwsS3FileName: "https://example.com/contracts/recruitly.pdf",
        isPaused:false,
    },
    {
        id: "ref-19",
        pk: "REFERRAL#ref-19",
        sk: "CANDIDATE#ref-19",
        name: "JobBridge",
        email: "manoj.das@example.com",
        contactName: "Manoj Das",
        contactNumber: "+91-9321654987",
        dateActivated: "2025-10-09",
        assignedJobs: 12,
        totalCandidateSubmitted: 50,
        totalCandidateRejected: 25,
        totalCandidateHired: 15,
        GSTIN: "10AAACX1234K1Z7",
        contractCopyAwsS3FileName: "https://example.com/contracts/jobbridge.pdf",
        isPaused:false,
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

      const handleLocalUpdate = useCallback((jobId: string, updatedData: any) => {
        setFetchData((prevData:any) => {
        if (!prevData || !Array.isArray(prevData)) return prevData;

        return prevData.map(job =>
          job.id === jobId ? { ...job, ...updatedData } : job
        );
      });

  // setFetchData((prevData:any) => {
  //         if (!prevData) return prevData;
          
  //         return {
  //           ...prevData,
  //           data: prevData.data.map((job:any) => 
  //             job.id === jobId 
  //               ? { ...job, ...updatedData }
  //               : job
  //           )
  //         };
  //       });
    }, []);
  // if (isLoadingUser || !user) {
  //   return (
  //     <div className="w-full h-[50vh] flex items-center justify-center">
  //       <div className="flex flex-col items-center">
  //         <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
  //         <p className="mt-4 text-gray-600 font-medium">Loading user data...</p>
  //       </div>
  //     </div>
  //   );
  // }

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
      {isLoading ? (
              <SkeletonLoader
                  showTableHeader={true}
                  showTableRows={true}
                  tableColumns={5}
                  rowCount={5}
              />
              ) : (
              <AgencyListTable
                data={fetchData}
                userType="CORPORATE"
                refetch={refetch}
                ListSelection={ListSelection}
                handleUpdate={handleJobApplicationStatusUpdate}
                sendApplicationToRecruiter={handleSendToRecruiter}
                isBulkEvaluation={!!selectedRows.length}
                onBulkUpdate={onBulkUpdate}
                localUpdate={handleLocalUpdate}
              />
      )}
        <AddNewAgencyModal
          dashboardType={"corporate"}
          onClose= {() => setIsAddAgencyModelOpen(false)}
          isOpen= {isAddAgencyModelOpen}
          companyId={userDetails?.companyId}
        />
    </div>
  )
}

export default AgencyList
