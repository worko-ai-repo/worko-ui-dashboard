import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import PdfPreviewModal from "./Modals/PdfPreviewModal";
import { toast } from "react-toastify";
import { SendIcon } from "lucide-react";
import { getToastOptions } from "lib-worko-ui";
import httpServiceObj from "@Services/ApiHandler.service";
import { useGoogleAuth } from "./Modals/useGoogleAuth";

interface DriveForm {
  folderLink: string;
}

interface PdfItem {
  id: string;
  name: string;
  url: string;
}

const DriveResumeFetcher: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } =
    useForm<DriveForm>();

  const [pdfFiles, setPdfFiles] = useState<PdfItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isAlreadyFetching, setIsAlreadyFetching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<PdfItem | null>(null);
  const { isSignedIn, signInWithGoogle } = useGoogleAuth();
  const fakePdfs: PdfItem[] = [
    {
    id: "fake-1",
    name: "Employee_Onboarding_Guide.pdf",
    url: "https://example.com/Employee_Onboarding_Guide.pdf",
    },
    {
    id: "fake-2",
    name: "Project_Requirements_Document.pdf",
    url: "https://example.com/Project_Requirements_Document.pdf",
    },
    {
    id: "fake-3",
    name: "Sales_Report_Q1_2024.pdf",
    url: "https://example.com/Sales_Report_Q1_2024.pdf",
    },
    {
    id: "fake-4",
    name: "Training_Manual_Advanced.pdf",
    url: "https://example.com/Training_Manual_Advanced.pdf",
    },
    {
    id: "fake-5",
    name: "System_Architecture_Overview.pdf",
    url: "https://example.com/System_Architecture_Overview.pdf",
    }
  ];

  const fetchDetails = async () =>{
    setIsDetailsLoading(true)
    try {
    //  const {response,error} = await httpServiceObj.get("/api/drive/list-pdfs",true,{},false,"BASE")
    //  if(error){
    //     toast.error(error.message,getToastOptions({}))
    //     return
    //  }
    //  if(response){
    //     setIsAlreadyFetching(true)
    //  }
     setIsAlreadyFetching(false)
    } catch (error) {
        console.error(error)
    } finally {
        setIsDetailsLoading(false)
    }
  }

//   const onSubmit = async (data: DriveForm) => {
//     const url = data.folderLink.trim();

//     try {
//       setIsFetching(true);
//       setPdfFiles([]);
    
//       const payload = {
//         folderLink: url
//       }
//     //   const {response,error} = await httpServiceObj.post<any>("/api/drive/list-pdfs",payload,true,{},false,"BASE");

//     //   if (error) {
//     //     toast.error(error.message,getToastOptions({}));
//     //     return;
//     //   }

//     //   const pdfs: PdfItem[] = await response.json();

//     //   if (!pdfs.length) {
//     //     toast.error("No PDF files found",getToastOptions({}));
//     //   } else {
//     //     toast.success(`Found ${pdfs.length} PDF(s)`,getToastOptions({}));
//     //   }

//       setPdfFiles(fakePdfs);
//     } catch (error) {
//       console.error(error);
//       toast.error("Unable to fetch files",getToastOptions({}));
//     } finally {
//       setIsFetching(false);
//     }
//   };

  useEffect(()=>{
    fetchDetails()
  },[])

  // BELOW 2 ARE FOR GOOGLE AUTH CAN REMOVE IF EVERYTHING DONE FROM BE
const extractFolderId = (url: string): string | null => {
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
};

const onSubmit = async (data: DriveForm) => {
  const url = data.folderLink.trim();

  try {
    setIsFetching(true);
    setPdfFiles([]);

    // 1. Get access token from your Google auth hook
    const token = localStorage.getItem("google_access_token");
    if (!token) {
      toast.error("Please sign in with Google first.", getToastOptions({}));
      return;
    }

    // 2. Extract folder ID from link
    const folderId = extractFolderId(url);
    if (!folderId) {
      toast.error("Invalid Google Drive folder link", getToastOptions({}));
      return;
    }

    // 3. Call Google Drive API directly from frontend
    const query = encodeURIComponent(
    `'${folderId}' in parents and mimeType='application/pdf' and trashed = false`
    );

    const apiUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`;

    const response = await fetch(apiUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    });


    const result = await response.json();

    if (!result.files || result.files.length === 0) {
      toast.error("No PDF files found", getToastOptions({}));
      return;
    }

    // 4. Convert Drive response to your PdfItem format
    const pdfs: PdfItem[] = result.files.map((file: any) => ({
      id: file.id,
      name: file.name,
      url: `https://drive.google.com/uc?id=${file.id}&export=download`,
    }));

    // 5. Update UI
    setPdfFiles(pdfs);
    toast.success(`Found ${pdfs.length} PDF(s)`, getToastOptions({}));

  } catch (error) {
    console.error(error);
    toast.error("Unable to fetch PDF files", getToastOptions({}));
  } finally {
    setIsFetching(false);
  }
};

  return (
    <div className="w-full min-h-screen flex justify-center text-gray-800">
      <div className="w-full max-w-3xl p-6">

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-blue-500">
            Fetch Resume's from Drive
          </h3>

        {/* CAN REMOVE BELOW DIV IF GOOGLE AUTH NOT REQUIRED AND ALSO DELETE useGoogleAuth.ts AND CDN FROM index.html */}
        {/* <div className="flex justify-end mb-4">
        {!isSignedIn ? (
            <button
            type="button"
            onClick={signInWithGoogle}
            className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-xl text-sm"
            >
            Sign in with Google
            </button>
        ) : (
            <p className="text-green-600 text-sm font-medium">✔ Google Authenticated</p>
        )}
        </div> */}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Public Drive Folder Link
              </label>

              <input
                placeholder="Paste Drive folder link"
                className={`w-full px-4 py-2 rounded-lg border text-sm
                  ${errors.folderLink
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                  }
                `}
                {...register("folderLink", {
                  required: "Folder link is required",
                })}
              />

              {errors.folderLink && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.folderLink.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isFetching || isAlreadyFetching || isDetailsLoading}
                data-tooltip-id="my-tooltip"
                data-tooltip-content={isAlreadyFetching ? "Already fetching in progress please wait until its finished" : isFetching ? "Fetching..." : ""}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white 
                hover:bg-blue-700 transition text-sm disabled:opacity-50"
              >
                <SendIcon className="w-4 h-4" />
                {isFetching ? "Fetching..." : "Fetch Resume's"}
              </button>
            </div>
          </form>

          {/* Loader */}
          {isFetching && (
            <div className="mt-6 space-y-3 animate-pulse">
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
            </div>
          )}

          {/* PDF List */}
          {!isFetching && pdfFiles.length > 0 && (
            <div className="mt-6 bg-gray-50 p-4 rounded-xl border shadow-inner">
              <h4 className="font-semibold text-gray-700 mb-2">PDF Files</h4>

              <ul className="space-y-2">
                {pdfFiles.map((file) => (
                  <li
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className="text-blue-600 hover:underline cursor-pointer text-sm"
                  >
                    {file.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedFile && (
        <PdfPreviewModal
          isOpen={true}
          onClose={() => setSelectedFile(null)}
          fileName={selectedFile.name}
          fileId={selectedFile.id}
          fileUrl={selectedFile.url}
        />
      )}
    </div>
  );
};

export default DriveResumeFetcher;
