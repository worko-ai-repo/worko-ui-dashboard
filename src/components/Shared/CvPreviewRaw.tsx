import React from "react";

interface CVPreviewRawProps {
  pdfUrl: string;
  onClose?: () => void;
}

const CVPreviewRaw: React.FC<CVPreviewRawProps> = ({ pdfUrl, onClose }) => {
  return (
    <div className="flex flex-col gap-4 p-4 ">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">CV Preview</h2>
      </div>

      <div className="flex-1 border-2 border-gray-400 w-full min-h-[80vh] rounded-xl overflow-hidden">
        <iframe
          src={pdfUrl}
          title="CV Preview"
          className="w-full  min-h-[80vh] h-full"
        />
      </div>
    </div>
  );
};

export default CVPreviewRaw;
