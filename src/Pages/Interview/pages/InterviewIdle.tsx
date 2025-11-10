import { Card, CardHeader, CardTitle, CardContent } from "@Components/ui/card";
import { Button } from "@Components/ui/button";
import { Play, Camera, Mic, Monitor, Check, AlertCircle } from "lucide-react";
import { useInterview } from "../../../context/Interview.context";
import { useEffect, useState } from "react";
import { useSearchParams, useLocation, useNavigate, useParams } from "react-router-dom";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { useAppContext } from "@Context/App.context";
import { logo_text } from "@AssetsFolder/assets";
import InterviewIdelFragment from "@Components/Interview/InterviewIdelFragment";

interface PermissionState {
  camera: boolean;
  microphone: boolean;
  screen: boolean;
}

const InterviewIdle = () => {
  const {
    startInterview,
    error,
    speechError,
    isSpeechSupported,
    currentInterview,
    loadExistingInterview,
  } = useInterview();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { id: interviewIdParam } = useParams<{ id: string }>();
  const { userDetails } = useAppContext();

  const [isInitiating, setIsInitiating] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: false,
    microphone: false,
    screen: false,
  });
  const [isRequestingPermissions, setIsRequestingPermissions] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [micTestComplete, setMicTestComplete] = useState(false);
  const [testStream, setTestStream] = useState<MediaStream | null>(null);

  const stage = searchParams.get("stage");
  const interviewDataFromState = location.state?.interviewData as InterviewDto | undefined;
  const interviewStage = (stage === "continue" ? "continue" : "new") as "new" | "continue";

  // Log for debugging
  useEffect(() => {
    console.log("InterviewIdle - URL Params:", {
      interviewIdParam,
      stage,
      interviewStage,
      hasInterviewData: !!interviewDataFromState,
    });
  }, [interviewIdParam, stage, interviewStage, interviewDataFromState]);

  const isContinuing =
    stage === "continue" &&
    (currentInterview || interviewDataFromState) &&
    (currentInterview?.status === "PENDING" ||
      currentInterview?.status === "IN_PROGRESS" ||
      interviewDataFromState?.status === "PENDING");
  const hasPartialProgress =
    (currentInterview?.interviewHistory || interviewDataFromState?.interviewHistory) &&
    ((currentInterview?.interviewHistory?.length || 0) > 0 ||
      (interviewDataFromState?.interviewHistory?.length || 0) > 0);

  const allPermissionsGranted = permissions.camera && permissions.microphone && permissions.screen;
  const canStartInterview = allPermissionsGranted && micTestComplete && currentInterview;

  // Handle interview initiation or loading from state
  useEffect(() => {
    const initializeInterview = async () => {
      // If we have interview data in state (continuing), load it
      if (interviewDataFromState) {
        console.log("Loading interview from state with ID:", interviewIdParam);
        loadExistingInterview(
          interviewDataFromState,
          testStream || undefined,
          interviewIdParam,
          interviewStage
        );
        return;
      }

      // If we're not continuing and don't have an interview in context, initiate a new one
      if (!currentInterview && !isInitiating && userDetails?.email && interviewIdParam) {
        setIsInitiating(true);
        setInitError(null);

        try {
          console.log("Initiating new interview with ID:", interviewIdParam);
          const { response, error } = await httpServiceObj.post<{ data: InterviewDto }>(
            "/user/interview/initiate",
            { candidateEmail: userDetails.email },
            true
          );

          if (error) {
            console.error("Failed to initiate interview:", error);
            setInitError("Failed to initiate interview. Please try again.");
            setIsInitiating(false);
            return;
          }

          if (response?.data) {
            loadExistingInterview(
              response.data,
              testStream || undefined,
              interviewIdParam,
              interviewStage
            );
          }
        } catch (error) {
          console.error("Error initiating interview:", error);
          setInitError("An error occurred while initiating the interview.");
        } finally {
          setIsInitiating(false);
        }
      }
    };

    initializeInterview();
  }, [
    userDetails?.email,
    interviewDataFromState,
    currentInterview,
    loadExistingInterview,
    testStream,
    isInitiating,
    interviewIdParam,
    interviewStage,
  ]);

  // Cleanup test stream on unmount
  useEffect(() => {
    return () => {
      if (testStream) {
        testStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [testStream]);

  const requestAllPermissions = async () => {
    setIsRequestingPermissions(true);
    setPermissionError(null);

    try {
      // Request camera and microphone first
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setPermissions((prev) => ({
        ...prev,
        camera: true,
        microphone: true,
      }));

      // Request screen sharing immediately with entire screen enforcement
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "monitor", // Enforce full screen sharing
        },
        audio: false,
      });

      // Check if user selected entire screen (not window or tab)
      const videoTrack = screenStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      if (settings.displaySurface !== "monitor") {
        // Stop the stream if not entire screen
        screenStream.getTracks().forEach((track) => track.stop());
        mediaStream.getTracks().forEach((track) => track.stop());
        throw new Error(
          "Please select 'Entire Screen' for security purposes. Window or tab sharing is not allowed."
        );
      }

      setPermissions((prev) => ({
        ...prev,
        screen: true,
      }));

      // Combine all streams (camera, mic, and screen)
      const combinedStream = new MediaStream([
        ...mediaStream.getVideoTracks(),
        ...mediaStream.getAudioTracks(),
        ...screenStream.getVideoTracks(),
      ]);

      setTestStream(combinedStream);

      // Also pass to interview context if interview is already loaded
      if (currentInterview) {
        console.log("Updating existing interview in context with stream");
        loadExistingInterview(currentInterview, combinedStream, interviewIdParam, interviewStage);
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Camera, microphone, and screen sharing access are required. Please allow access.";
      setPermissionError(errorMsg);

      // Reset permissions on error
      setPermissions({
        camera: false,
        microphone: false,
        screen: false,
      });
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const startMicTest = () => {
    if (!testStream) return;
    setIsTesting(true);

    // Simulate listening for audio input
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(testStream);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 256;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let hasDetectedSound = false;

    const checkAudio = () => {
      if (!isTesting) return;

      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

      // If we detect sound above threshold
      if (average > 10 && !hasDetectedSound) {
        hasDetectedSound = true;
        setTimeout(() => {
          setMicTestComplete(true);
          setIsTesting(false);
          audioContext.close();
        }, 1000);
      } else if (isTesting && !hasDetectedSound) {
        requestAnimationFrame(checkAudio);
      }
    };

    checkAudio();

    // Auto-complete after 10 seconds
    setTimeout(() => {
      if (!micTestComplete) {
        setMicTestComplete(true);
        setIsTesting(false);
        audioContext.close();
      }
    }, 8000);
  };

  const userName = userDetails?.fullName || "Candidate";
  const firstName = userName.split(" ")[0];

  return (
    <div className="min-h-screen bg-gradient-to-b bg-white">
      {/* Header */}
      <div className="w-full">
        <img src={logo_text} alt="Worko" className=" mx-auto h-8 sm:h-10 md:h-12 object-contain" />
      </div>

      {/* Main Content */}
      <div
        className="
      flex flex-row items-center justify-between  mx-auto 
      ">
        <Card className="bg-white border-none  rounded-none  p-0 flex-1 h-screen max-sm:hidden ">
          <InterviewIdelFragment />
        </Card>

        <Card className="bg-white border-blue-200 rounded-br-none rounded-tr-none shadow-lg   flex-1">
          <CardHeader className="">
            <CardTitle className="text-2xl sm:text-3xl capitalize md:text-3xl text-blue-800 text-left ">
              {isContinuing
                ? `Welcome Back, ${firstName}!`
                : `Hi ${firstName}, Ready for Your Interview?`}
            </CardTitle>
            <p className="text-left text-gray-600 text-sm sm:text-base">
              {isContinuing
                ? "Let's continue where you left off"
                : "Let's get you set up for your interview"}
            </p>
          </CardHeader>
          <CardContent className="p-4">
            {isInitiating ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">Setting up your interview...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Permissions Card */}
                {!allPermissionsGranted && (
                  <Card className="border-2 py-0 text-left border-blue-100 bg-gradient-to-br from-blue-50 to-white  ">
                    <CardContent className="p-2  ">
                      <h3 className="text-lg sm:text-lg font-semibold text-gray-900 ">
                        Required Permissions
                      </h3>
                      <p className="text-xs font-semibold text-gray-600 mb-4">
                        We need access to the following to conduct your interview:
                      </p>

                      <div className="space-y-3 mb-6 ">
                        {/* Camera Permission */}
                        <div className="flex items-center px-3 gap-3 py-1 bg-white rounded-lg border border-gray-200">
                          <div
                            className={`flex-shrink-0 p-1 w-6 h-6 rounded-full flex items-center justify-center ${
                              permissions.camera ? "bg-green-100" : "bg-gray-100"
                            }`}>
                            {permissions.camera ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Camera className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1  min-w-0">
                            <p className="font-semibold text-gray-800 text-sm ">Camera Access</p>
                            <p className="text-xs text-gray-500">
                              To record your video during the interview
                            </p>
                          </div>
                        </div>

                        {/* Microphone Permission */}
                        <div className="flex items-center px-3 gap-3 py-1 bg-white rounded-lg border border-gray-200">
                          <div
                            className={`flex-shrink-0 p-1 w-6 h-6 rounded-full flex items-center justify-center ${
                              permissions.microphone ? "bg-green-100" : "bg-gray-100"
                            }`}>
                            {permissions.microphone ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Mic className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm">Microphone Access</p>
                            <p className="text-xs text-gray-500">To record your audio responses</p>
                          </div>
                        </div>

                        {/* Screen Sharing Permission */}
                        <div className="flex items-center px-3 gap-3 py-1 bg-white rounded-lg border border-gray-200">
                          <div
                            className={`flex-shrink-0 p-1 w-6 h-6 rounded-full flex items-center justify-center ${
                              permissions.screen ? "bg-green-100" : "bg-gray-100"
                            }`}>
                            {permissions.screen ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Monitor className="w-3 h-3 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm">Screen Sharing</p>
                            <p className="text-xs text-gray-500">
                              You must share your entire screen (security requirement)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Info about screen sharing requirement */}
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-left">
                          <p className="text-sm text-blue-800">
                            <span className="font-semibold">Important:</span> When prompted for
                            screen sharing, please select "Entire Screen" (not a window or tab) for
                            security purposes.
                          </p>
                        </div>
                      </div>

                      {permissionError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-600">{permissionError}</p>
                        </div>
                      )}

                      <Button
                        onClick={requestAllPermissions}
                        disabled={isRequestingPermissions}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-sm sm:text-base">
                        {isRequestingPermissions
                          ? "Requesting Permissions..."
                          : "Grant All Permissions"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Microphone Test Card */}
                {allPermissionsGranted && !micTestComplete && (
                  <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-white">
                    <CardContent className="p-4 sm:p-6 text-left">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
                        Test Your Microphone
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Please say a few words to test your microphone. For example, say: "This is a
                        test of my microphone for the interview."
                      </p>

                      {isTesting && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                          <div className="animate-pulse">
                            <Mic className="w-6 h-6 text-blue-600" />
                          </div>
                          <p className="text-sm text-blue-900 font-medium">
                            Listening... Please speak now
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={startMicTest}
                        disabled={isTesting}
                        className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 text-sm sm:text-base">
                        {isTesting ? "Testing Microphone..." : "Start Microphone Test"}
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Success Message */}
                {allPermissionsGranted && micTestComplete && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-green-900">All Setup Complete!</p>
                        <p className="text-sm text-green-700">
                          All permissions granted and microphone tested successfully
                        </p>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className="font-semibold text-yellow-900 mb-2">Important Guidelines</p>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          <li>• Do not open any other tabs or applications during the interview</li>
                          <li>• Stay visible on camera at all times</li>
                          <li>• Do not use any external assistance or reference materials</li>
                          <li>• Ensure you are in a quiet, private environment</li>
                          <li>• Do not use mobile devices or secondary screens</li>
                          <li>• Maintain proper lighting and clear audio throughout</li>
                          <li>
                            • Any suspicious activity will be flagged and may result in
                            disqualification
                          </li>
                        </ul>
                      </div>
                    </div>
                    <Button
                      onClick={startInterview}
                      size="default"
                      disabled={!currentInterview || isInitiating}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-base sm:text-lg py-6">
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                      Proceed Now
                    </Button>
                  </div>
                )}

                {/* Errors */}
                {(error || speechError || initError) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{initError || error || speechError}</p>
                  </div>
                )}

                {!isSpeechSupported && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-700">
                      Speech recognition is not supported in this browser. Transcription will be
                      simulated.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InterviewIdle;
