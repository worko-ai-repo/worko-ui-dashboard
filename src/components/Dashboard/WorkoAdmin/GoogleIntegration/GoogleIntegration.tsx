import React, { useEffect, useState } from "react";
import { SendIcon } from "lucide-react";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import { useAppContext } from "@Context/App.context";

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
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // 🔹 MOCK: fetch status
  const getStatus = async () => {
    try {
      setIsLoading(true);

      // TODO: replace with real API
      const mockResponse: GoogleStatus = {
        connected: false,
        email: "",
      };

      setStatus(mockResponse);
    } catch (error) {
      toast.error("Failed to fetch Google connection status", getToastOptions({}));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getStatus();
  }, [userDetails?.companyId]);

  // 🔹 Popup handler
  const handleConnect = () => {
    setIsConnecting(true);

    const popup = window.open(
      "/auth/google",
      "googleLogin",
      "width=500,height=600"
    );

    const listener = async (event: MessageEvent) => {
      if (event.data?.success) {
        toast.success("Google account connected", getToastOptions({}));
        await getStatus();
        setIsConnecting(false);
        window.removeEventListener("message", listener);
      }
    };

    window.addEventListener("message", listener);

    // fallback if user closes popup
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setIsConnecting(false);
      }
    }, 500);
  };

  // 🔹 Disconnect
  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);

      // TODO: replace with real API
      await new Promise((res) => setTimeout(res, 800));

      setStatus({ connected: false });
      toast.success("Disconnected successfully", getToastOptions({}));
    } catch (error) {
      toast.error("Failed to disconnect", getToastOptions({}));
    } finally {
      setIsDisconnecting(false);
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
            // 🔴 NOT CONNECTED
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-inner text-center space-y-4">

              <p className="text-sm text-gray-600">
                Securely connect your Google account to enable automatic Google Meet link creation.
              </p>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 text-sm mx-auto"
              >
                <SendIcon className="h-4 w-4" />
                {isConnecting ? "Connecting..." : "Continue with Google"}
              </button>

              <p className="text-xs text-gray-400">
                We will request access to your Google Calendar
              </p>
            </div>
          ) : (
            // 🟢 CONNECTED
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner space-y-4">

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 font-medium">Connected Email:</span>
                <span className="text-gray-900 font-semibold break-all">
                  {status.email}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className="text-green-600 font-semibold">Connected</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition text-sm disabled:opacity-50"
                >
                  {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                </button>

                <button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition text-sm disabled:opacity-50"
                >
                  {isConnecting ? "Switching..." : "Switch Account"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GoogleIntegration;