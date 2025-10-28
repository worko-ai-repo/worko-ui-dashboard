import { Card, CardHeader, CardTitle, CardContent } from "@Components/ui/card";
import { Button } from "@Components/ui/button";
import { MessageSquare, User } from "lucide-react";

export interface TranscriptEntry {
  question: string;
  answer: string;
  timestamp: number;
}

interface TranscriptHistoryProps {
  transcripts: TranscriptEntry[];
  answerVideos?: Blob[];
}

export const TranscriptHistory = ({ transcripts, answerVideos }: TranscriptHistoryProps) => {
  if (transcripts.length === 0) return null;

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const openBlobInNewTab = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    // We cannot revoke immediately; give the new tab time to load
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <Card className="mt-6 bg-white border-blue-200">
      <CardHeader>
        <CardTitle className="text-black">Interview Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {transcripts.map((entry, index) => (
            <div key={index} className="border-l-2 border-blue-300 pl-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Question {index + 1}</p>
                  <p className="text-sm leading-relaxed text-black">{entry.question}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 mb-1">Your Answer</p>
                  <p className="text-sm leading-relaxed text-gray-700">{entry.answer}</p>
                </div>
              </div>

              {answerVideos?.[index] && (
                <div className="pt-1 flex items-center gap-2">
                  <span className="text-xs text-gray-600">Q{index + 1} → A{index + 1} → D{index + 1}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openBlobInNewTab(answerVideos[index]!)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => downloadBlob(answerVideos[index]!, `answer-${index + 1}.webm`)}
                  >
                    Download {index + 1}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
