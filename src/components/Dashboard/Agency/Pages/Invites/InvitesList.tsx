import SkeletonLoader from '@Components/Shared/SkeletonLoader'
import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import InvitesListTable from './InvitesListTable'

const InvitesList = () => {
  const [searchBarText,setSearchBarText] = useState<string|null>("")
  const [queryIsJobsLoading,setQueryIsJobsLoading] = useState<boolean>(false)
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const dummyData = [
    {
        id: "ref-01",
        pk: "REFERRAL#ref-01",
        sk: "CANDIDATE#ref-01",
        companyName: "Dolby Sound Solutions",
        senderName: "Dolby Waleya",
        date: "10-02-2025",
    },
    {
        id: "ref-02",
        pk: "REFERRAL#ref-02",
        sk: "CANDIDATE#ref-02",
        companyName: "TechNova Inc.",
        senderName: "Priya Sharma",
        date: "12-02-2025",
    },
    {
        id: "ref-03",
        pk: "REFERRAL#ref-03",
        sk: "CANDIDATE#ref-03",
        companyName: "GreenByte Systems",
        senderName: "Arjun Mehta",
        date: "15-02-2025",
    },
    {
        id: "ref-04",
        pk: "REFERRAL#ref-04",
        sk: "CANDIDATE#ref-04",
        companyName: "NextGen Coders",
        senderName: "Sonal Verma",
        date: "18-02-2025",
    },
    {
        id: "ref-05",
        pk: "REFERRAL#ref-05",
        sk: "CANDIDATE#ref-05",
        companyName: "QuantumEdge Ltd.",
        senderName: "Ravi Kulkarni",
        date: "20-02-2025",
    },
    {
        id: "ref-06",
        pk: "REFERRAL#ref-06",
        sk: "CANDIDATE#ref-06",
        companyName: "PixelCraft Studios",
        senderName: "Neha Rathi",
        date: "22-02-2025",
    },
    {
        id: "ref-07",
        pk: "REFERRAL#ref-07",
        sk: "CANDIDATE#ref-07",
        companyName: "BrightPath AI",
        senderName: "Karan Malhotra",
        date: "24-02-2025",
    },
    {
        id: "ref-08",
        pk: "REFERRAL#ref-08",
        sk: "CANDIDATE#ref-08",
        companyName: "InnovaTech Corp",
        senderName: "Shruti Desai",
        date: "25-02-2025",
    },
    {
        id: "ref-09",
        pk: "REFERRAL#ref-09",
        sk: "CANDIDATE#ref-09",
        companyName: "CloudStride Technologies",
        senderName: "Ankit Bansal",
        date: "26-02-2025",
    },
    {
        id: "ref-10",
        pk: "REFERRAL#ref-10",
        sk: "CANDIDATE#ref-10",
        companyName: "EchoWare Solutions",
        senderName: "Divya Kapoor",
        date: "28-02-2025",
    },
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
        <InvitesListTable
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

export default InvitesList