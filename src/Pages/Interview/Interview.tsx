import { useRoutes, Navigate, useLocation } from "react-router-dom";
import { Suspense, useEffect } from "react";
import MainLoader from "@Components/Loader/Loader";
import { InterviewProvider } from "../../context/Interview.context";
import InterviewIdle from "./pages/InterviewIdle";
import InterviewIntro from "./pages/InterviewIntro";
import InterviewActive from "./pages/InterviewActive";
import InterviewCompleted from "./pages/InterviewCompleted";

function Interview() {
  const location = useLocation();
  const interviewData = location.state?.interviewData;

  useEffect(() => {
    if (!interviewData) {
      console.warn("No interview data found in navigation state.");
    }
  }, [interviewData]);

  const routes = useRoutes([
    {
      index: true,
      element: <InterviewIdle />,
    },
    {
      path: "intro",
      element: <InterviewIntro />,
    },
    {
      path: "active",
      element: <InterviewActive />,
    },
    {
      path: "completed",
      element: <InterviewCompleted />,
    },
    {
      path: "*",
      element: <Navigate to="/interview" replace />,
    },
  ]);

  return (
    <InterviewProvider>
      <Suspense fallback={<MainLoader />}>{routes}</Suspense>
    </InterviewProvider>
  );
}

export default Interview;
