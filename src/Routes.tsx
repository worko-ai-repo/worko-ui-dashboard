import { Suspense } from "react";
import MainLoader from "@Components/Loader/Loader";
import { createBrowserRouter } from "react-router-dom";
import ErrorFallback from "./Pages/errors/base-error/ErrorFallback";
import CorporateDashboard from "./Pages/Corporate/CorporateDashboard";

// Lazy Load Components

// Route Configuration
const AppRoutes = createBrowserRouter([
  {
    path: "/dashboard",
    errorElement: <ErrorFallback />,
    element: <MainLayout />,
    children: [
      {
        element: (
          <Suspense fallback={<MainLoader />}>
            <CorporateDashboard />
          </Suspense>
        ),
      },
    ],
  },
]);

export default AppRoutes;
