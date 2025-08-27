import { Suspense, lazy } from "react";
import MainLoader from "@Components/Loader/Loader";
import { Navigate, useRoutes } from "react-router-dom";
import PageNotFound from "../errors/404/PageNotFound";
import DashboardLayout from "@Layouts/Dashboard.layout";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import JobSelectorModal from "@Components/Shared/FindJobByDropdown";
import CorporateHome from "@Components/Dashboard/Corporate/Home/CorporateHome";
import Employee from "@Components/Dashboard/WorkoAdmin/Employee/AdminEmployee";

// Lazy load components

const AdminJobs = lazy(() => import("@Components/Dashboard/WorkoAdmin/Job/AdminJobs"));
const Applicants = lazy(() => import("@Components/Dashboard/WorkoAdmin/Applicants/Applicants"));
const AdminCandidate = lazy(
  () => import("@Components/Dashboard/WorkoAdmin/Candidate/AdminCandidate")
);

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
              <AdminCandidate />
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
          path: "aCandidate",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AdminCandidate />
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
          path: "aCandidate",
          element: (
            <Suspense fallback={<MainLoader />}>
              <AdminCandidate />
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
