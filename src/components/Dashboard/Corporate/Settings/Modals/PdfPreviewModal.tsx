import React from "react";
import { X } from "lucide-react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileId: string;
  fileUrl: string;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileUrl
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
      <div className="bg-white w-[90%] max-w-3xl rounded-2xl shadow-xl p-6 relative">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <h2 className="text-lg font-semibold mb-4">{fileName}</h2>

        <iframe
          src={fileUrl.replace("uc?", "preview?")}
          className="w-full h-[500px] rounded-xl border"
        />

        <div className="flex justify-end mt-4">
          <a
            href={fileUrl}
            target="_blank"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
