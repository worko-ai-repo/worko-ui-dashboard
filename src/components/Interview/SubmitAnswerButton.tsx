import { Button } from "@Components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface SubmitAnswerButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isSubmitting?: boolean;
  isUploading?: boolean;
}

export const SubmitAnswerButton = ({
  onClick,
  disabled,
  isSubmitting,
  isUploading,
}: SubmitAnswerButtonProps) => {
  const isLoading = isSubmitting || isUploading;

  return (
    <div className="flex justify-center mb-6">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        size="lg"
        className="btn_primary min-w-[200px]">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isUploading ? "Uploading..." : "Processing..."}
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            End Response
          </>
        )}
      </Button>
    </div>
  );
};
