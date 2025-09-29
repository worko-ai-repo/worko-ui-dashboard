import React from "react";
import { toast } from "react-toastify";
import { ExternalLink, Link } from "lucide-react"; // or use your own external link icon
import { clipboard } from "@AssetsFolder/assets";
import { getToastOptions } from "@Utils/Toast.utils";

export interface InteractiveInputProps {
  data?: string | null;
  isLoading?: boolean;
  variant: "copy" | "open-link";
  placeholder?: string;
  loadingText?: string;
  width?: string;
  onCopy?: (data: string) => void;
  onOpenLink?: (url: string) => void;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  textClassName?: string;
}

export const InteractiveInput: React.FC<InteractiveInputProps> = ({
  data,
  isLoading = false,
  variant,
  placeholder = "No data available",
  loadingText = "Fetching...",
  width = "w-32",
  onCopy,
  onOpenLink,
  disabled = false,
  className = "",
  buttonClassName = "",
  textClassName = "",
}) => {
  const handleCopy = () => {
    if (!data || disabled) return;

    navigator.clipboard
      .writeText(data)
      .then(() => {
        toast.success("Copied to clipboard!" , getToastOptions({}));
        onCopy?.(data);
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard", getToastOptions({}));
      });
  };

  const handleOpenLink = () => {
    if (!data || disabled) return;

    // Validate if it's a proper URL
    try {
      const url = data.startsWith("http") ? data : `https://${data}`;
      window.open(url, "_blank", "noopener,noreferrer");
      onOpenLink?.(data);
    } catch (error) {
      toast.error("Invalid URL", getToastOptions({}));
    }
  };

  const getDisplayText = () => {
    if (isLoading) return loadingText;
    if (!data) return placeholder;
    return data;
  };

  const getButtonContent = () => {
    if (variant === "copy") {
      return <img src={clipboard} alt="Copy" className="min-w-4  min-h-4 text-white" />;
    }
    return <Link className="min-w-4 p-1 min-h-4 text-white" />;
  };

  const handleButtonClick = () => {
    if (variant === "copy") {
      handleCopy();
    } else {
      handleOpenLink();
    }
  };

  const isButtonDisabled = disabled || isLoading || !data;

  return (
    <div className={`flex border rounded-lg justify-between ${width} relative ${className}`}>
      <div className={`px-2 py-1 rounded-lg truncate text-[#C0B7B7] ${textClassName}`}>
        {getDisplayText()}
      </div>
      <button
        onClick={handleButtonClick}
        disabled={isButtonDisabled}
        className={`
          ${ "bg-blue-500" }
          p-1 w-auto h-full rounded-lg active:scale-95 
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:opacity-90 transition-all duration-200
          ${buttonClassName}
        `}
        title={variant === "copy" ? "Copy to clipboard" : "Open in new tab"}>
        {getButtonContent()}
      </button>
    </div>
  );
};
