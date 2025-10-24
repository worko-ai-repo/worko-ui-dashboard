import { Card, CardHeader, CardTitle, CardContent } from "@Components/ui/card";
import { User } from "lucide-react";

export const IntroCard = () => {
  return (
    <Card className="mb-6 bg-white border-blue-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-black">Candidate Introduction</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-semibold text-black">Name:</span> John Doe
          </p>
          <p>
            <span className="font-semibold text-black">Position:</span> Senior Frontend Developer
          </p>
          <p>
            <span className="font-semibold text-black">Experience:</span> 5+ years in React,
            TypeScript, and modern web technologies
          </p>
          <p className="mt-4 text-black">
            Welcome to your AI Mock Interview. Answer each question naturally and click "Submit
            Answer" when you're ready to move on.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
