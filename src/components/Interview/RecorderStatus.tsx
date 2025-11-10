import { Card, CardContent } from "@Components/ui/card";
import { Video, Mic, Monitor } from "lucide-react";

interface RecorderStatusProps {
  isRecording: boolean;
  isTranscribing?: boolean;
}

export const RecorderStatus = ({ isRecording, isTranscribing }: RecorderStatusProps) => {

  return (
    <div className="">
      <>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 p-2 rounded-lg border">
            <div className="relative">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-red-600 rounded-full animate-ping" />
            </div>
            <span className="font-semibold text-xs text-black">Recording in Progress</span>
            {isTranscribing && <span className="text-xs text-gray-600 ml-2">(Listening...)</span>}
          </div>
          <div className="flex items-center gap-1 text-xs  text-white">
            <div className="flex items-center gap-1 border rounded-lg py-1 px-2 bg-green-500 ">
              <Video className="w-3 h-3 " />
              <span>Camera</span>
            </div>
            <div className="flex items-center gap-1 border rounded-lg py-1 px-2 bg-blue-500">
              <Mic className="w-3 h-3" />
              <span>Mic</span>
            </div>
            <div className="flex items-center gap-1 border rounded-lg py-1 px-2 bg-yellow-500">
              <Monitor className="w-3 h-3" />
              <span>Screen</span>
            </div>
          </div>
        </div>
      </>
    </div>
  );
};
