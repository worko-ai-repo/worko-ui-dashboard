import { Card, CardContent } from "@Components/ui/card";
import { Video, Mic, Monitor } from "lucide-react";

interface RecorderStatusProps {
  isRecording: boolean;
  isTranscribing?: boolean;
}

export const RecorderStatus = ({ isRecording, isTranscribing }: RecorderStatusProps) => {
  if (!isRecording) return null;

  return (
    <Card className="mb-6 border-blue-300 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-blue-600 rounded-full animate-ping" />
            </div>
            <span className="font-semibold text-sm text-black">Recording in Progress</span>
            {isTranscribing && <span className="text-xs text-gray-600 ml-2">(Listening...)</span>}
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Video className="w-4 h-4" />
              <span>Camera</span>
            </div>
            <div className="flex items-center gap-1">
              <Mic className="w-4 h-4" />
              <span>Mic</span>
            </div>
            <div className="flex items-center gap-1">
              <Monitor className="w-4 h-4" />
              <span>Screen</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
