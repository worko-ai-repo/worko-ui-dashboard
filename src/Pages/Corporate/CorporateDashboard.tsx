import { Suspense, lazy } from "react";
import MainLoader from "@Components/Loader/Loader";
import { Navigate, useRoutes } from "react-router-dom";
import PageNotFound from "../errors/404/PageNotFound";
import DashboardLayout from "@Layouts/Dashboard.layout";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import JobSelectorModal from "@Components/Shared/FindJobByDropdown";
import CorporateHome from "@Components/Dashboard/Corporate/Home/CorporateHome";
import ApplicantScreeningTable from "@Components/Shared/BulkCvPage/BulkCvApplicants";
import CorporateReferrals from "@Components/Dashboard/Corporate/Referral/Referral";



// Lazy load components
const Jobs = lazy(() => import("@Components/Dashboard/Corporate/Job/Jobs"));
const Applicants = lazy(() => import("@Components/Dashboard/Corporate/Applicants/Applicants"));
const BulkCVCheck = lazy(() => import("@Components/Dashboard/Corporate/BulkCvCheck/BulkCvCheck"));
const Invites = lazy(() => import("@Components/Dashboard/Corporate/Invites/Invites"));
const Interview = lazy(() => import("@Components/Dashboard/Corporate/Interviews/Interview"));
const ApplicantsModal = lazy(() => import("@Components/Modals/SharedModals/ApplicantsModal"));


const AdminDatabase = lazy(() => import("@Components/Dashboard/Corporate/Database/CorporateDatabase"));
const SearchDB = lazy(() => import ("@Components/Dashboard/Corporate/SearchDB/SearchDB"));
const AgencyCandidateList = lazy(() => import ("@Components/Dashboard/Corporate/Agency/AgencyCandidateList"));
const AgencyList = lazy(() => import ("@Components/Dashboard/Corporate/Agency/AgencyList"));


// const SearchDB = lazy(() => import("@Components/Dashboard/Corporate/SearchDB/SearchDB"));
// const AdminDatabase = lazy(() => import("@Components/Dashboard/WorkoAdmin/Database/AdminDatabase"));
// const AgencyList = lazy(() => import("@Components/Dashboard/WorkoAdmin/Agency/AgencyList"));
// const AgencyCandidateList = lazy(() => import("@Components/Dashboard/WorkoAdmin/Agency/AgencyCandidateList"));

const CorporateDashboard = () => {
  const routes = useRoutes([
    {
      path: "/",
      element: (
        <Suspense fallback={<MainLoader />}>
          <DashboardLayout />
        </Suspense>
      ),
      children: [
        {
          index: true,
          path: "home",
          // element: <Navigate to="jobs" replace />,
          element: (
            <Suspense fallback={<SkeletonLoader showHeaderCards={true} showSearchBar={true} showButtons={true} buttonCount={1} showTabs={true} showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />}>
              <CorporateHome />
            </Suspense>
          ),
        },
        {
          path: "jobs",
          element: (
            <Suspense fallback={<SkeletonLoader showHeaderCards={true} showSearchBar={true} showButtons={true} buttonCount={1} showTabs={true} showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />}>
              <Jobs />
            </Suspense>
          ),
        },
        {
          path: "referral",
          element: (
            <Suspense fallback={<SkeletonLoader showHeaderCards={true} showSearchBar={true} showButtons={true} buttonCount={1} showTabs={true} showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />}>
              <CorporateReferrals />
            </Suspense>
          ),
        },
                {
          path: "aAgency/allCandidates",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AgencyCandidateList />
            </Suspense>
          ),
        },
        {
          path: "aAgency/agencyList",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AgencyList />
            </Suspense>
          ),
        },
        {
          path: "aDatabase",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AdminDatabase />
            </Suspense>
          ),
        },
        {
          path: "aSearchDB/*",
          element: (
            <Suspense fallback={<MainLoader />}>
              <SearchDB />
            </Suspense>
          ),
        },
        {
          path: "cApplicants",
          children: [
            {
              index: true, // this means "/cApplicants"
              element: <Navigate to="noID" replace />,
            },
            {
              path: "noID",
              element: (
                <Suspense fallback={<MainLoader />}>
                  <JobSelectorModal isOpen={true} onClose={() => null} path="APPLICATIONS" />
                </Suspense>
              ),
            },
            {
              path: ":id", // this means "/cApplicants/:id"
              element: (
                <Suspense fallback={<MainLoader />}>
                  <Applicants />
                </Suspense>
              ),
            },
          ],
        },
        {
          path: "bulk-cv-check",
          element: (
            <Suspense fallback={<MainLoader />}>
              <BulkCVCheck />
            </Suspense>
          ),
        },
        {
          path: "bulk-cv-check/listing/:id",  
          element: (
            <Suspense fallback={<MainLoader />}>
              <ApplicantScreeningTable />
            </Suspense>
          ),
        },
        {
          path: "invites",
          element: (
            <Suspense fallback={<MainLoader />}>
              <Invites />
            </Suspense>
          ),
        },
        {
          path: "interviews",
          element: (
            <Suspense fallback={<MainLoader />}>
              <Interview />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "*",
      element: (
        <Suspense fallback={<MainLoader />}>
          <PageNotFound />
        </Suspense>
      ),
    },
  ]);

  return routes;
};

export default CorporateDashboard;
