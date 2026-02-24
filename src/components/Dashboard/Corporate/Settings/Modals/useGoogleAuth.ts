import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";

declare global {
  interface Window {
    google: any;
  }
}

export const useGoogleAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);

  const signInWithGoogle = useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      toast.error("Google Auth SDK not loaded", getToastOptions({}));
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: "715828611869-9539dd1im71bp3uhbqonr908a66ude14.apps.googleusercontent.com",
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (resp: any) => {
        if (resp.access_token) {
          localStorage.setItem("google_access_token", resp.access_token);

          setIsSignedIn(true);
          toast.success("Google login successful", getToastOptions({}));
        } else {
          toast.error("Failed to retrieve Google token", getToastOptions({}));
        }
      },
    });

    // Opens consent screen
    tokenClient.requestAccessToken();
  }, []);

  return {
    isSignedIn,
    signInWithGoogle,
  };
};
