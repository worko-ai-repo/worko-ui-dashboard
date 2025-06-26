import { Suspense, lazy } from "react";
import MainLoader from "@Components/Loader/Loader";
import { Navigate, useRoutes } from "react-router-dom";
import PageNotFound from "../errors/404/PageNotFound";
import DashboardLayout from "@Layouts/Dashboard.layout";
import SkeletonLoader from "@Components/Dashboard/Corporate/SkeletonLoader";
import JobSelectorModal from "@Components/Shared/FindJobByDropdown";

// Lazy load components
const Jobs = lazy(() => import("@Components/Dashboard/Corporate/Job/Jobs"));
const Applicants = lazy(() => import("@Components/Dashboard/Corporate/Applicants/Applicants"));
const BulkCVCheck = lazy(() => import("@Components/Dashboard/Corporate/BulkCvCheck/BulkCvCheck"));
const Invites = lazy(() => import("@Components/Dashboard/Corporate/Invites/Invites"));
const Interview = lazy(() => import("@Components/Dashboard/Corporate/Interviews/Interview"));
const ApplicantsModal = lazy(() => import("@Components/Modals/SharedModals/ApplicantsModal"));

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
          element: <Navigate to="jobs" replace />,
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
                  <JobSelectorModal isOpen={true} onClose={() =>null} path="APPLICATIONS" />
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
