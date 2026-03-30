import React, { useEffect, useState } from "react";
import { CheckCircle2Icon, SendIcon } from "lucide-react";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import { useAppContext } from "@Context/App.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { useQuery } from "@tanstack/react-query";

interface GoogleStatus {
  connected: boolean;
  email?: string;
}

const GoogleIntegration: React.FC = () => {
  const { userDetails } = useAppContext();

  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<GoogleStatus>({
    connected: false,
  });
  const [isConnecting, setIsConnecting] = useState(false);

  const CLIENT_ID = "214937809065-1nht31gbbqi3s409ussf2ah14il6e869.apps.googleusercontent.com"; // Replace with your Google Client ID

  /* useEffect(() => {
    const initializeGoogleSignIn = () => {
      
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handlepostLogin,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv")!,
          { theme: "outline", size: "large" }
        );
        setIsLoading(false);
      }

    if (document.readyState === "complete") {
      initializeGoogleSignIn();
    } else {
      window.addEventListener("load", initializeGoogleSignIn);
      return () => window.removeEventListener("load", initializeGoogleSignIn);
    }
  }, []);

  const handlepostLogin = (response: any) => {
    console.log("Google Sign-In response:", response);
    // Here you would typically send the response.credential (JWT) to your backend for verification and to create a session
  }; */
   useEffect(() => {
    const loadGoogleIdentityServices = () => {
      console.log("Loading Google Identity Services...");
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => {
        console.log("Google Identity Services loaded.");
        setIsLoading(false);
      };
      script.onerror = () => {
        console.error("Failed to load Google Identity Services.");
        toast.error("Failed to load Google Identity Services", getToastOptions({}));
      };
      document.body.appendChild(script);
    };

    loadGoogleIdentityServices();
  }, []);

  const {
    data: hasToken,
    isLoading: apiLoading,
    error,
    isFetched,
  } = useQuery({
    queryKey: ["matching-score"],
    queryFn: () => checkExistingToken(),
    refetchInterval: 50000,
    refetchOnWindowFocus: false,
  });

  async function checkExistingToken(): Promise<any> {
   const {response , error} =  await httpServiceObj.get("/user/token", true, {})
    if (error) {
      console.error("Error checking existing token:", error);
      toast.error("Failed to check existing token", getToastOptions({}));
      return null;
    }
    return response
  }
  
  const handleConnect = (saveToBackend: (code: string) => Promise<void>) => {
    try {
      setIsConnecting(true);
      console.log("Attempting to sign in with Google...");

      const codeClient = (window as any).google.accounts.oauth2.initCodeClient({
        client_id: CLIENT_ID,
        scope: "https://www.googleapis.com/auth/gmail.readonly",
        ux_mode: "popup",
        callback: (response:any) => {
          if (response.error) {
            console.error("Error during code retrieval:", response);
            toast.error("Failed to connect Google account", getToastOptions({}));
            setIsConnecting(false);
            return;
          }
          console.log("Authorization code received:", response);
          console.log("Authorization Code:", response.code);

          // Send the authorization code to the backend
           saveToBackend(response.code);
         
            
             setIsConnecting(false)
        },
      });

      codeClient.requestCode();
    } catch (error) {
      console.error("Failed to connect Google account:", error);
      toast.error("Failed to connect Google account", getToastOptions({}));
      setIsConnecting(false);
    }
  }; 

  const saveToBackend = async (code: string) => {
    try {
      const res = await httpServiceObj.post("/user/token", {code}, true, {});
      console.log("Authorization code saved to backend:", res);
    } catch (error) {
      console.error("Failed to save authorization code to backend:", error);
      toast.error("Failed to save authorization code to backend", getToastOptions({}));
    }
  };

  return (
    <div className="w-full min-h-screen text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <p className="text-blue-500 mb-4">
            Connect your Google account to create Google Meet links
          </p>

          <h3 className="text-lg font-semibold mb-4 text-left">
            {status.connected ? "Connected Google Account" : "Connect Google Account"}
          </h3>

          {isLoading ? (
            <div className="flex items-center justify-center max-h-screen">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : !status.connected ? (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-inner text-center space-y-4">
             {hasToken ? (<div className="text-sm text-green-600 font-medium"
             ><CheckCircle2Icon className="inline-block mr-1 fill-sky-500 text-white"/>Account already Connected</div>):  (<p className="text-sm text-gray-600">
                Securely connect your Google account to enable automatic Google Meet link creation.
              </p>)}

              <button
                id="googleSignInDiv"
                onClick={() => handleConnect(saveToBackend)}
                disabled={isConnecting || hasToken}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 text-sm mx-auto">
                <SendIcon className="h-4 w-4" />
                {isConnecting ? "Connecting..." : "Continue with Google"}
              </button>

              <p className="text-xs text-gray-400">We will request access to your Gmail account</p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className="text-green-600 font-semibold">Connected</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleIntegration;