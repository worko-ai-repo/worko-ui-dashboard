import { Card, CardHeader, CardTitle, CardContent } from "@Components/ui/card";
import { User } from "lucide-react";
import { useAppContext } from "@Context/App.context";

export const IntroCard = () => {
  const { userDetails } = useAppContext();

  const userName = userDetails?.fullName || "Candidate";
  const firstName = userName.split(" ")[0];

  return (
    <Card className="mb-6 bg-white border-blue-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-black">Interview Participant</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-semibold text-black">Name:</span> {userName}
          </p>
          {userDetails?.email && (
            <p>
              <span className="font-semibold text-black">Email:</span> {userDetails.email}
            </p>
          )}
          <p className="mt-4 text-black">
            Welcome, {firstName}! Your interview is about to begin. Answer each question naturally
            and click "Submit Answer" when you're ready to move to the next question. Take your time
            and speak clearly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
