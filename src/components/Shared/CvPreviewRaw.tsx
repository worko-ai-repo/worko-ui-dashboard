import { Download, ExpandIcon, Maximize } from "lucide-react";
import React from "react";

interface CVPreviewRawProps {
  pdfUrl: string;
  candidateName: string;
  YOE?: number;
  companyName?: string;
  onClose?: () => void;
}

const CVPreviewRaw: React.FC<CVPreviewRawProps> = ({
  pdfUrl,
  candidateName,
  YOE,
  companyName,
  onClose,
}) => {
  return (
    <div className="flex flex-col gap-4 p-4 relative">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">CV Preview</h2>
      </div>

      <div className="flex-1 border-2 border-gray-400 w-full min-h-[80vh] rounded-xl overflow-hidden relative">
        <iframe src={pdfUrl} title="CV Preview" className="w-full min-h-[80vh] h-full" />
        <button
          onClick={() => {
            fetch(pdfUrl)
              .then((response) => response.blob())
              .then((blob) => {
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.href = url;
                const name = candidateName.replace(/\s+/g, "_");
                const company = (companyName || "Company").replace(/\s+/g, "_");
                const date = new Date().toISOString().split("T")[0];
                link.download = `Worko_${name}_${YOE}_${company}_${date}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              })
              .catch((error) => console.error("Error downloading the file:", error));
          }}
          className="absolute bottom-4 mr-2 right-16 border bg-blue-200 px-3 py-2 rounded-md shadow text-blue-600">
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => window.open(pdfUrl, "_blank")}
          className="absolute bottom-4 right-4 bg-white text-blue px-4 py-2 rounded shadow hover:text-blue-600">
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CVPreviewRaw;
