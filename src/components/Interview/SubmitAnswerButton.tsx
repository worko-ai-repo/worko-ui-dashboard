import { Button } from "@Components/ui/button";
import { ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
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
    <div className="flex justify-center mb-2">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        size="lg"
        className="btn_primary h-8 min-w-[100px]">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {isUploading ? "Uploading..." : "Processing..."}
          </>
        ) : (
          <>
            <ChevronDoubleRightIcon className="w-4 h-4 mr-2" />
            End Response
          </>
        )}
      </Button>
    </div>
  );
};
