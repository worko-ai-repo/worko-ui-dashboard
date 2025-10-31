import { Suspense, lazy } from "react";
import MainLoader from "@Components/Loader/Loader";
import { Navigate, useRoutes } from "react-router-dom";
import PageNotFound from "../errors/404/PageNotFound";
import ApplicantScreeningTable from "@Components/Shared/BulkCvPage/BulkCvApplicants";
import AdminCorporateInvites from "@Components/Dashboard/WorkoAdmin/Invite/AdminCorporateUsers";



const DashboardLayout = lazy(() => import("@Layouts/Dashboard.layout"));
const SkeletonLoader = lazy(() => import("@Components/Shared/SkeletonLoader"));
const JobSelectorModal = lazy(() => import("@Components/Shared/FindJobByDropdown"));
const AdminGuidance = lazy(() => import("@Components/Dashboard/WorkoAdmin/Guidance/AdminGuidance"));
const AdminCompany = lazy(() => import("@Components/Dashboard/WorkoAdmin/Company/AdminCompany"));
const AdminReferAndEarn = lazy(
  () => import("@Components/Dashboard/WorkoAdmin/ReferAndEarn/ReferAndEarn")
);
const BulkCVCheck = lazy(() => import("@Components/Dashboard/WorkoAdmin/BulkCvCheck/BulkCvCheck"));
const ScreeningListView = lazy(() => import("@Components/Shared/BulkCvPage/BulkScreeningListView"));

// Lazy load components
const Employee = lazy(() => import("@Components/Dashboard/WorkoAdmin/Employee/AdminEmployee"));
const AdminReferrals = lazy(
  () => import("@Components/Dashboard/WorkoAdmin/Referrals/AdminReferrals")
);
const AdminJobs = lazy(() => import("@Components/Dashboard/WorkoAdmin/Job/AdminJobs"));
const Applicants = lazy(() => import("@Components/Dashboard/WorkoAdmin/Applicants/Applicants"));
const AdminCandidate = lazy(() => import("@Components/Dashboard/WorkoAdmin/Candidate/AdminCandidate"));
const AdminDatabase = lazy(() => import("@Components/Dashboard/WorkoAdmin/Database/AdminDatabase"));
const SearchDB = lazy(() => import ("@Components/Dashboard/WorkoAdmin/SearchDB/SearchDB"));
const AgencyCandidateList = lazy(() => import ("@Components/Dashboard/WorkoAdmin/Agency/AgencyCandidateList"));
const AgencyList = lazy(() => import ("@Components/Dashboard/WorkoAdmin/Agency/AgencyList"));

const AdminDashboard = () => {
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
          path: "ajobs",
          element: (
            <Suspense
              fallback={
                <SkeletonLoader
                  showHeaderCards={true}
                  showSearchBar={true}
                  showButtons={true}
                  buttonCount={1}
                  showTabs={true}
                  showTableHeader={true}
                  showTableRows={true}
                  tableColumns={5}
                  rowCount={5}
                />
              }>
              <AdminJobs />
            </Suspense>
          ),
        },
        {
          path: "aApplicants",
          children: [
            {
              index: true, // this means "/cApplicants"
              element: <Navigate to="noID" replace />,
            },
            {
              path: "noID",
              element: (
                <Suspense fallback={<MainLoader />}>
                  <JobSelectorModal
                    isOpen={true}
                    onClose={() => null}
                    path="APPLICATIONS"
                    dashboard="ADMIN"
                  />
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
          path: "aAllApplicants",
          element: (
            <Suspense fallback={<MainLoader />}>
              <Applicants isAllApplicants={true} />
            </Suspense>
          ),
        },
        {
          path: "aEmployee",
          element: (
            <Suspense
              fallback={
                <SkeletonLoader
                  showHeaderCards={true}
                  showSearchBar={true}
                  showButtons={true}
                  buttonCount={1}
                  showTabs={true}
                  showTableHeader={true}
                  showTableRows={true}
                  tableColumns={5}
                  rowCount={5}
                />
              }>
              <Employee />
            </Suspense>
          ),
        },
        {
          path: "aCandidate",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AdminCandidate />
            </Suspense>
          ),
        },
        {
          path: "aReferrals",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AdminReferrals />
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
          path: "aInvites",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AdminCorporateInvites />
            </Suspense>
          ),
        },
        {
          path: "aBulkCVCheck",
          element: (
            <Suspense fallback={<MainLoader />}>
              <BulkCVCheck />
            </Suspense>
          ),
        },
        {
          path: "aBulkCVCheck/listing/:id",  
          element: (
            <Suspense fallback={<MainLoader />}>
              <ApplicantScreeningTable />
            </Suspense>
          ),
        },
        {
          path: "Refer-n-Earn",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AdminReferAndEarn />
            </Suspense>
          ),
        },
        {
          path: "aCompanies",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AdminCompany />
            </Suspense>
          ),
        },

        {
          path: "aGuidance",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AdminGuidance />
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

export default AdminDashboard;
