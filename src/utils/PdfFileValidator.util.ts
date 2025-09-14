import { getToastOptions } from "@Utils/Toast.utils";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js?worker";
import { toast } from "react-toastify";

GlobalWorkerOptions.workerPort = new pdfjsWorker();

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = getDocument({ data: arrayBuffer });

    const pdf = await loadingTask.promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ");
      fullText += text + "\n";
    }

    if (!fullText.trim()) {
      toast.error(
        "We are unable to extract any data from this pdf (may be OCR or image-based PDF).Please try uploading text based pdf file.",
        getToastOptions({ autoClose: 8000 })
      );
      throw new Error("No extractable text found (may be OCR or image-based PDF).");
    }

    return fullText;
  } catch (error: any) {
    switch (error?.name) {
      case "PasswordException":
        toast.error("PDF is password-protected.", getToastOptions({ autoClose: 3000 }));
        throw new Error("PDF is password-protected.");
      case "InvalidPDFException":
        toast.error("The file is not a valid PDF.", getToastOptions({ autoClose: 3000 }));
        throw new Error("The file is not a valid PDF.");
      case "MissingPDFException":
        toast.error("No PDF file provided.", getToastOptions({ autoClose: 3000 }));
        throw new Error("No PDF file provided.");
      default:
        throw new Error(`PDF extraction failed: ${error.message || "Unknown error"}`);
    }
  }
}
