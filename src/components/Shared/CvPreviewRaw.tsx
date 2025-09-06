import { ExpandIcon, Maximize } from "lucide-react";
import React from "react";

interface CVPreviewRawProps {
  pdfUrl: string;
  onClose?: () => void;
}

const CVPreviewRaw: React.FC<CVPreviewRawProps> = ({ pdfUrl, onClose }) => {
  return (
    <div className="flex flex-col gap-4 p-4 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">CV Preview</h2>
      </div>

      <div className="flex-1 border-2 border-gray-400 w-full min-h-[80vh] rounded-xl overflow-hidden relative">
        <iframe
          src={pdfUrl}
          title="CV Preview"
          className="w-full min-h-[80vh] h-full"
        />
        <button
          onClick={() => window.open(pdfUrl, "_blank")}
          className="absolute bottom-4 right-4 bg-white text-blue px-4 py-2 rounded shadow hover:text-blue-600"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CVPreviewRaw;
