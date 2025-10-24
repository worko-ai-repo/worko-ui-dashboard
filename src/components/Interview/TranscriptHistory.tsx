import { Card, CardHeader, CardTitle, CardContent } from "@Components/ui/card";
import { MessageSquare, User } from "lucide-react";

export interface TranscriptEntry {
  question: string;
  answer: string;
  timestamp: number;
}

interface TranscriptHistoryProps {
  transcripts: TranscriptEntry[];
}

export const TranscriptHistory = ({ transcripts }: TranscriptHistoryProps) => {
  if (transcripts.length === 0) return null;

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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
