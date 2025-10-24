import { Card, CardHeader, CardTitle, CardContent } from "@Components/ui/card";
import { Button } from "@Components/ui/button";
import { CheckCircle2, Download } from "lucide-react";

interface EndMessageProps {
  message: string;
  onDownload?: () => void;
  isProcessing?: boolean;
}

export const EndMessage = ({ message, onDownload, isProcessing }: EndMessageProps) => {
  return (
    <Card className="border-green-300 bg-green-50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
          <CardTitle className="text-black">Interview Complete</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg mb-4 text-black">{message}</p>
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Processing your interview recording...</span>
          </div>
        )}
        {onDownload && !isProcessing && (
          <Button onClick={onDownload} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download Recording
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
