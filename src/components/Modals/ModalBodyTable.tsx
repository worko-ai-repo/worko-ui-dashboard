// Reusable component for label + value
export const ModalBodyTable: React.FC<{
    label: string;
    value: React.ReactNode;
    multiline?: boolean;
    className?: string;
  }> = ({ label, value, multiline,className }) => (
    <div className="flex gap-2 text-xs">
    <span className={`text-slate-400 font-medium min-w-[200px] text-nowrap text-left ${className || ""}`}>{label}</span>
      <div
        className={`text-slate-900 text-left font-medium  ${multiline ? "whitespace-pre-wrap" : ""}`}>
        {value}
      </div>
    </div>
  );