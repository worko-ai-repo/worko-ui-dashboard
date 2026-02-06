import { useRoutes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLoader from "@Components/Loader/Loader";
import DashboardLayout from "@Layouts/Dashboard.layout";
import ReferAndEarn from "@Components/Dashboard/Candidate/Pages/ReferAndEarn/ReferAndEarn";
import Support from "@Components/Dashboard/Candidate/Pages/Support/Support";
import PageNotFound from "@Pages/errors/404/PageNotFound";
import Referrals from "@Components/Dashboard/Employee/Pages/Referral/Referral";
import Guidance from "@Components/Dashboard/Employee/Pages/Guidance/Guidance";

const Profile = lazy(() => import("@Components/Dashboard/Employee/Pages/Profile/Profile"));

const EmployeeDashboard = () => {
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
          element: <Navigate to="profile" replace />,
        },
        {
          path: "profile",
          element: (
            <Suspense fallback={<MainLoader />}>
              <Profile />
            </Suspense>
          ),
        },
        // {
        //   path: "referral",
        //   element: <Referrals />,
        // },
        {
          path: "guidance",
          element: <Guidance />,
        },
        {
          path: "refer-and-earn",
          element: <ReferAndEarn />,
        },
        {
          path: "support",
          element: <Support />,
        },
        // {
        //   path: "*",
        //   element: <PageNotFound />,
        // },
      ],
    },
    {
      path: "*",
      element: <PageNotFound />,
    },
  ]);

  return routes;
};

export default EmployeeDashboard;
