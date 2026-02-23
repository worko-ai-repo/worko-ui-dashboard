import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, FileText, User, Building, Shield } from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";
import { toast } from "react-toastify";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { getToastOptions } from "@Utils/Toast.utils";
import { useAppContext } from "@Context/App.context";

// Types
type AuthorCognitoUserGroup = "corporate-admin" | "corporate-recruiter" | "ADMIN";

// API request/response interfaces
interface CreateJobApplicationNoteRequest {
  jobApplicationId: string;
  authorCognitoUserGroup: AuthorCognitoUserGroup | string;
  noteDetails: NoteDetail[];
}

interface UpdateJobApplicationNoteRequest {
  noteDetails: NoteDetail[];
}

type CreateJobApplicationNoteResponse = JobApplicationNote;
type UpdateJobApplicationNoteResponse = JobApplicationNote;
type GetJobApplicationNoteResponse = JobApplicationNote;

interface NoteDetail {
  title: string;
  detailedDescription: string;
  createdAt?: string;
  updatedAt?: string;
}

interface JobApplicationNote {
  id: string;
  PK: string;
  SK: string;
  jobApplicationId: string;
  authorCognitoUserGroup: "corporate-admin" | "corporate-recruiter" | "ADMIN";
  authorId: string;
  createdByCorporateUserId?: string;
  createdByUserId?: string;
  updatedByUserId?: string;
  noteDetails: NoteDetail[];
  createdAt?: string;
  updatedAt?: string;
}

interface NewNoteDetail {
  title: string;
  detailedDescription: string;
}

interface NotesAppProps {
  jobApplication: JobApplicationDetailsDto | null;
}

// API Service Interface
class JobApplicationNotesAPIService {
  private httpService: typeof httpServiceObj;

  constructor(httpService: typeof httpServiceObj) {
    this.httpService = httpService;
  }

  async createNote(payload: CreateJobApplicationNoteRequest): Promise<{
    response: CreateJobApplicationNoteResponse | null;
    error: any;
  }> {
    return await this.httpService.post(
      `/job-application-author-note/`,
      payload,
      true,
      {},
      false,
      "JOB"
    );
  }

  async updateNote(
    jobApplicationId: string,
    noteId: string,
    payload: UpdateJobApplicationNoteRequest
  ): Promise<{
    response: UpdateJobApplicationNoteResponse | null;
    error: any;
  }> {
    //sanitize payload by removing empty note details and removing createdAt/updatedAt if present
    payload.noteDetails = payload.noteDetails
      .filter((detail) => detail.title.trim() || detail.detailedDescription.trim())
      .map((detail) => {
        const { createdAt, updatedAt, ...rest } = detail;
        return rest;
      });
    return await this.httpService.patch(
      `/job-application-author-note/${jobApplicationId}/${noteId}`,
      payload,
      true,
      {},
      false,
      "JOB"
    );
  }

  async getNote(
    jobApplicationId: string,
    authorId: string
  ): Promise<{
    response: GetJobApplicationNoteResponse | null;
    error: any;
  }> {
    return await this.httpService.get(
      `/job-application-author-note/${jobApplicationId}/${authorId}`,
      true,
      {},
      false,
      "JOB"
    );
  }
}

const JobApplicationNotesApp: React.FC<NotesAppProps> = ({ jobApplication }) => {
  const [notes, setNotes] = useState<JobApplicationNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteDetails, setNewNoteDetails] = useState<NewNoteDetail[]>([
    { title: "", detailedDescription: "NA" },
  ]);
  const [loading, setLoading] = useState<boolean>(false);

  const { userDetails } = useAppContext();
  const userId = userDetails?.id || "";
  // Mock user group detection - in real app this would be based on actual routing/storage
  const userGroup: AuthorCognitoUserGroup = "ADMIN"; // TODO: derive from context if available

  // Initialize API service
  const apiService = new JobApplicationNotesAPIService(httpServiceObj);

  const createPayload = (noteDetails: NoteDetail[]): CreateJobApplicationNoteRequest => {
    return {
      jobApplicationId: jobApplication?.id ?? "",
      authorCognitoUserGroup: userGroup,
      noteDetails,
    };
  };

  // Fetch notes for current author and job application
  const fetchNotes = async () => {
    setLoading(true);
    try {
      if (!jobApplication?.id || !userId) {
        setNotes([]);
        return;
      }

      const { response, error } = await apiService.getNote(jobApplication.id, userId);

      if (error) {
        // Silent error handling - no toast for fetch errors
        console.error("Failed to fetch notes:", error);
        setNotes([]);
        return;
      }

      setNotes(response ? [response] : []);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobApplication?.id && userId) {
      fetchNotes();
    }
  }, [jobApplication?.id, userId]);

  // Add new note
  const handleAddNote = async (): Promise<void> => {
    const validNoteDetails = newNoteDetails.filter(
      (detail) => detail.title.trim() || detail.detailedDescription.trim()
    );

    if (validNoteDetails.length === 0) {
      toast.error("Please add at least one note with title or description", getToastOptions({}));
      return;
    }

    if (!jobApplication?.id) {
      toast.error("Missing application id. Please refresh and try again.", getToastOptions({}));
      return;
    }

    setLoading(true);

    try {
      const existingNote = notes && notes.length > 0 ? notes[0] : null;

      if (existingNote) {
        // Merge existing non-empty note details with new details
        const existingNonEmpty = (existingNote.noteDetails || []).filter(
          (d) => d.title?.trim() || "" || d.detailedDescription?.trim() || ""
        );
        const combinedNoteDetails: NoteDetail[] = [...existingNonEmpty, ...validNoteDetails];

        const updatePayload: UpdateJobApplicationNoteRequest = { noteDetails: combinedNoteDetails };
        const { error } = await apiService.updateNote(
          jobApplication.id,
          existingNote.id,
          updatePayload
        );

        if (error) {
          toast.error("Failed to update note. Please try again.", getToastOptions({}));
          return;
        }
      } else {
        // Create a new note
        const payload = createPayload(validNoteDetails);
        const { error } = await apiService.createNote(payload);
        if (error) {
          toast.error("Failed to create note. Please try again.", getToastOptions({}));
          return;
        }
      }

      // Silent success - just refresh and reset form
      setNewNoteDetails([{ title: "", detailedDescription: "NA" }]);
      setIsAddingNote(false);
      await fetchNotes(); // Silent refetch
    } catch (err) {
      toast.error("Failed to create note. Please try again.", getToastOptions({}));
    } finally {
      setLoading(false);
    }
  };

  // Update existing note
  const handleUpdateNote = async (
    noteId: string,
    updatedNoteDetails: NoteDetail[]
  ): Promise<void> => {
    setLoading(true);

    try {
      if (!jobApplication?.id) {
        toast.error("Missing application id. Please refresh and try again.", getToastOptions({}));
        return;
      }

      const payload: UpdateJobApplicationNoteRequest = {
        noteDetails: updatedNoteDetails,
      };

      const { response, error } = await apiService.updateNote(jobApplication.id, noteId, payload);

      if (error) {
        toast.error("Failed to update note. Please try again.", getToastOptions({}));
        return;
      }

      // Silent success - just refresh and exit edit mode
      setEditingNoteId(null);
      await fetchNotes(); // Silent refetch
    } catch (err) {
      toast.error("Failed to update note. Please try again.", getToastOptions({}));
    } finally {
      setLoading(false);
    }
  };

  // "Delete" note by removing specific note detail
  const handleDeleteNoteDetail = async (noteId: string, noteDetailIndex: number): Promise<void> => {
    const currentNote = notes.find((note) => note.id === noteId);
    if (!currentNote) return;

    // Create updated note details without the deleted one
    const updatedNoteDetails = currentNote.noteDetails.filter(
      (_, index) => index !== noteDetailIndex
    );

    // If no note details left, we can't delete the entire note structure
    // So we'll keep at least one empty note detail
    const finalNoteDetails =
      updatedNoteDetails.length === 0
        ? [{ title: "", detailedDescription: "NA" }]
        : updatedNoteDetails;

    await handleUpdateNote(noteId, finalNoteDetails);
  };

  // Delete entire note by setting empty note details
  const handleDeleteNote = async (noteId: string): Promise<void> => {
    await handleUpdateNote(noteId, [{ title: "", detailedDescription: "NA" }]);
  };

  const addNewNoteDetail = () => {
    setNewNoteDetails([...newNoteDetails, { title: "", detailedDescription: "NA" }]);
  };

  const removeNoteDetail = (index: number) => {
    if (newNoteDetails.length > 1) {
      setNewNoteDetails(newNoteDetails.filter((_, i) => i !== index));
    }
  };

  const updateNewNoteDetail = (index: number, field: keyof NewNoteDetail, value: string) => {
    const updated = [...newNoteDetails];
    updated[index] = { ...updated[index], [field]: value };
    setNewNoteDetails(updated);
  };

  const cancelAdd = (): void => {
    setNewNoteDetails([{ title: "", detailedDescription: "NA" }]);
    setIsAddingNote(false);
  };

  const getUserGroupIcon = (group: string) => {
    switch (group) {
      case "ADMIN":
        return <Shield size={16} className="text-red-500" />;
      case "corporate-admin":
        return <Building size={16} className="text-blue-500" />;
      case "corporate-recruiter":
        return <User size={16} className="text-green-500" />;
      default:
        return <User size={16} className="text-gray-500" />;
    }
  };

  const getUserGroupLabel = (group: string) => {
    switch (group) {
      case "ADMIN":
        return "Worko Admin";
      case "corporate-admin":
        return "Corporate Admin";
      case "corporate-recruiter":
        return "Corporate Recruiter";
      default:
        return group;
    }
  };

  // Filter out notes with empty content
  const displayNotes = notes.filter(
    (note) =>
      note.noteDetails &&
      note.noteDetails.some((detail) => detail.title.trim() || detail.detailedDescription.trim())
  );

  return (
    <div className="min-h-screen max-w-3xl bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        {false && <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-start gap-4">
              <FileText size={24} className="text-blue-500 mt-1" />
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                  {jobApplication?.applicantDetails?.name} Application Notes
                </h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium capitalize">Job:</span> {jobApplication?.jobTitle}
                  </p>
                  <p>
                    <span className="font-medium capitalize">Company:</span>{" "}
                    {jobApplication?.companyName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>}

        {/* Add Note Button */}
        <div className="mb-6 text-left">
          <button
            onClick={() => setIsAddingNote(true)}
            disabled={loading || isAddingNote}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            type="button">
            <Plus size={20} />
            Add New Note
          </button>
        </div>

        {/* Add Note Form */}
        {isAddingNote && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200 text-left">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Note</h3>

            {newNoteDetails.map((detail, index) => (
              <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-gray-700">Note {index + 1}</h4>
                  {newNoteDetails.length > 1 && (
                    <button
                      onClick={() => removeNoteDetail(index)}
                      className="text-red-500 hover:text-red-700"
                      type="button">
                      <X size={16} />
                    </button>
                  )}
                </div>

                <textarea
                  placeholder="Write your note here..."
                  value={detail.title}
                  onChange={(e) => updateNewNoteDetail(index, "title", e.target.value)}
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
                />
              </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <button
                onClick={addNewNoteDetail}
                className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors duration-200"
                type="button">
                <Plus size={16} />
                Add Another Note
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAddNote}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                type="button">
                <Save size={16} />
                {loading ? "Saving..." : "Save Notes"}
              </button>
              <button
                onClick={cancelAdd}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                type="button">
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !isAddingNote && !editingNoteId && (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading notes...</div>
          </div>
        )}

        {/* Notes List */}
        {!loading && displayNotes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-gray-400 mb-4">
              <FileText size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">No notes yet for this application.</p>
            <p className="text-gray-400 text-sm mt-2">Create your first note to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayNotes.map((note) =>
              note.noteDetails
                .filter((detail) => detail.title.trim() || detail.detailedDescription.trim())
                .map((detail, index) => (
                  <NoteDetailCard
                    key={`${note.id}-${index}`}
                    note={note}
                    detailIndex={index}
                    detail={detail}
                    loading={loading}
                    getUserGroupIcon={getUserGroupIcon}
                    getUserGroupLabel={getUserGroupLabel}
                    onSaveDetail={async (updatedDetail) => {
                      const existing = notes.find((n) => n.id === note.id);
                      if (!existing) return;
                      const updatedDetails = [...existing.noteDetails];
                      updatedDetails[index] = updatedDetail;
                      await handleUpdateNote(note.id, updatedDetails);
                    }}
                    onDeleteDetail={async () => {
                      await handleDeleteNoteDetail(note.id, index);
                    }}
                  />
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Note Card Component
interface NoteCardProps {
  note: JobApplicationNote;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updatedNoteDetails: NoteDetail[]) => void;
  onCancel: () => void;
  onDelete: () => void;
  onDeleteNoteDetail: (noteDetailIndex: number) => void;
  getUserGroupIcon: (group: string) => JSX.Element;
  getUserGroupLabel: (group: string) => string;
  loading: boolean;
}

export default JobApplicationNotesApp;

// Standalone card per single note detail
interface NoteDetailCardProps {
  note: JobApplicationNote;
  detailIndex: number;
  detail: NoteDetail;
  loading: boolean;
  getUserGroupIcon: (group: string) => JSX.Element;
  getUserGroupLabel: (group: string) => string;
  onSaveDetail: (updated: NoteDetail) => Promise<void> | void;
  onDeleteDetail: () => Promise<void> | void;
}

const NoteDetailCard: React.FC<NoteDetailCardProps> = ({
  note,
  detailIndex,
  detail,
  loading,
  getUserGroupIcon,
  getUserGroupLabel,
  onSaveDetail,
  onDeleteDetail,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [edited, setEdited] = useState<NoteDetail>({
    title: detail.title || "",
    detailedDescription: detail.detailedDescription || "NA",
  });

  const handleSave = async () => {
    const hasContent = edited.title.trim() || edited.detailedDescription.trim();
    if (!hasContent) {
      toast.error("Please add at least one note with title or description", getToastOptions({}));
      return;
    }
    await onSaveDetail(edited);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-end items-start mb-0">
{/*         <div className="flex items-center gap-2">
          {getUserGroupIcon(note.authorCognitoUserGroup)}
          <span className="text-sm font-medium text-gray-600">
            {getUserGroupLabel(note.authorCognitoUserGroup)}
          </span>
        </div> */}
        <div className="flex justify-self-end gap-1">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors duration-200 disabled:opacity-50"
              title="Edit note detail"
              type="button">
              <Edit2 size={16} />
            </button>
          )}
          <button
            onClick={onDeleteDetail}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors duration-200 disabled:opacity-50"
            title="Delete this note detail"
            type="button">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {!isEditing ? (
        <div className="space-y-2 text-left capitalize">
          {detail.title && (
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
              {detail.title}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-2">
            {detail.createdAt && <>Created: {new Date(detail.createdAt).toLocaleString()}</>}
            {detail.updatedAt && detail.updatedAt !== detail.createdAt && (
              <div>Updated: {new Date(detail.updatedAt).toLocaleString()}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={edited.title}
            onChange={(e) => setEdited((p) => ({ ...p, title: e.target.value }))}
            rows={5}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
            placeholder="Write your note here..."
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
              type="button">
              <Save size={14} />
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEdited({ title: detail.title || "", detailedDescription: detail.detailedDescription || "NA" });
                setIsEditing(false);
              }}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
              type="button">
              <X size={14} />
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
