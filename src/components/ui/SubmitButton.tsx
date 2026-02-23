import { SendIcon } from "lucide-react"
import React from "react"

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting?: boolean
  text?: string
  submittingText?: string
  icon?: React.ElementType
  iconHeight?: number
  iconWidth?: number
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  isSubmitting = false,
  text = "Submit",
  submittingText = "Submitting...",
  icon: Icon = SendIcon,
  iconHeight = 14,
  iconWidth = 14,
  disabled,
  ...props
}) => {
  return (
    <button
      type="submit"
      disabled={isSubmitting || disabled}
      className={`flex items-center gap-1 px-3 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs ${
        isSubmitting ? "opacity-50 cursor-not-allowed" : ""
      }`}
      {...props}
    >
      <Icon width={iconWidth} height={iconHeight} />
      {isSubmitting ? submittingText : text}
    </button>
  )
}

export default SubmitButton
