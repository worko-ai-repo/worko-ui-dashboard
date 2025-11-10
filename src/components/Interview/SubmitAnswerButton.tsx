import { Button } from "@Components/ui/button";
import { Send } from "lucide-react";

interface SubmitAnswerButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const SubmitAnswerButton = ({ onClick, disabled }: SubmitAnswerButtonProps) => {
  return (
    <div className="flex justify-center mb-6">
      <Button onClick={onClick} disabled={disabled} size="lg" className="btn_primary min-w-[200px]">
        <Send className="w-4 h-4 mr-2" />
        End Response
      </Button>
    </div>
  );
};
