import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, FileText, User, Building, Shield } from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";
import { useAppContext } from "@Context/App.context";
import secureStorage from "@Utils/SecureStorage.utils";
import { UserRole } from "aws-sdk/clients/workmail";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";

// Types
interface NoteDetail {
  title: string;
  detailedDescription: string;
}

interface JobApplicationNote {
  id: string;
  PK: string;
  SK: string;
  authorCognitoUserGroup: "corporate-admin" | "corporate-recruiter" | "ADMIN";
  createdByCorporateUserId?: string;
  createdByUserId?: string;
  noteDetails: NoteDetail[];
  createdAt?: string;
  updatedAt?: string;
}

interface NewNoteDetail {
  title: string;
  detailedDescription: string;
}

interface JobApplicationDetailsDto {
  id: string;
  companyId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  // ... other properties as defined in your interface
}

interface NotesAppProps {
  jobApplication: JobApplicationDetailsDto;
}

const JobApplicationNotesApp: React.FC<NotesAppProps> = ({ jobApplication }) => {
  const [notes, setNotes] = useState<JobApplicationNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteDetails, setNewNoteDetails] = useState<NewNoteDetail[]>([
    { title: "", detailedDescription: "" },
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const { userDetails } = useAppContext();

  const userGroup = window.location.href.includes("corporate")
    ? secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE)
    : "ADMIN";

  const createPayload = (noteDetails: NoteDetail[]) => {
    const basePayload = {
      authorCognitoUserGroup: userGroup,
      noteDetails,
    };

    if (userGroup === "ADMIN") {
      return {
        ...basePayload,
        createdByUserId: userDetails?.id,
      };
    } else {
      return {
        ...basePayload,
        createdByCorporateUserId: userDetails?.id,
      };
    }
  };

  // Fetch notes for the job application
  const fetchNotes = async () => {
    setLoading(true);
    try {
      const { response, error } = await httpServiceObj.get(
        `/job-application-author-note/${jobApplication?.id}`,

        true,
        {},
        false,
        "JOB"
      );

      if (error) {
        // toast.error("Failed to fetch notes");
        return;
      }

      if (response && Array.isArray(response)) {
        setNotes(response);
      }
    } catch (err) {
      toast.error("Something went wrong while fetching notes",getToastOptions({}));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [jobApplication?.id]);

  // Add new note
  const handleAddNote = async (): Promise<void> => {
    const validNoteDetails = newNoteDetails.filter(
      (detail) => detail.title.trim() || detail.detailedDescription.trim()
    );

    if (validNoteDetails.length === 0) {
      toast.error("Please add at least one note with title or description",getToastOptions({}));
      return;
    }

    setLoading(true);

    try {
      const payload = createPayload(validNoteDetails);

      const { response, error } = await httpServiceObj.post(
        `/job-application-author-note/${jobApplication?.id}`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (error) {
        toast.error("Failed to create note. Please try again.",getToastOptions({}));
        return;
      }

      console.log("Note created successfully:", response);
      setNewNoteDetails([{ title: "", detailedDescription: "" }]);
      setIsAddingNote(false);
      await fetchNotes(); // Refresh notes list
    } catch (err) {
      toast.error("Something went wrong. Please try again.",getToastOptions({}));
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
      const payload = {
        noteDetails: updatedNoteDetails,
      };

      const { response, error } = await httpServiceObj.patch(
        `/job-application-author-note/${jobApplication?.id}/${noteId}`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (error) {
        toast.error("Failed to update note. Please try again.",getToastOptions({}));
        return;
      }

      console.log("Note updated successfully:", response);
      setEditingNoteId(null);
      await fetchNotes(); // Refresh notes list
    } catch (err) {
      toast.error("Something went wrong. Please try again.",getToastOptions({}));
    } finally {
      setLoading(false);
    }
  };

  // Delete note (if supported by your backend)
  const handleDeleteNote = async (noteId: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await httpServiceObj.patch(
        `//job-application-author-note/${jobApplication?.id}/${noteId}`,
        { isDeleted: true },
        true,
        {},
        false,
        "JOB"
      );

      if (error) {
        toast.error("Failed to delete note. Please try again.",getToastOptions({}));
        return;
      }

      await fetchNotes(); // Refresh notes list
    } catch (err) {
      toast.error("Something went wrong. Please try again.",getToastOptions({}));
    } finally {
      setLoading(false);
    }
  };

  const addNewNoteDetail = () => {
    setNewNoteDetails([...newNoteDetails, { title: "", detailedDescription: "" }]);
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
    setNewNoteDetails([{ title: "", detailedDescription: "" }]);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-start gap-4">
              <FileText size={24} className="text-blue-500 mt-1" />
              <div className="text-left"> 
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Notes</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Job:</span> {jobApplication?.jobTitle}
                  </p>
                  <p>
                    <span className="font-medium">Company:</span> {jobApplication?.companyName}
                  </p>
                 {/*  <p>
                    <span className="font-medium">Application ID:</span> {jobApplication?.id}
                  </p> */}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
 {/*        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )} */}

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

                <input
                  type="text"
                  placeholder="Note title..."
                  value={detail.title}
                  onChange={(e) => updateNewNoteDetail(index, "title", e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />

                <textarea
                  placeholder="Detailed description..."
                  value={detail.detailedDescription}
                  onChange={(e) =>
                    updateNewNoteDetail(index, "detailedDescription", e.target.value)
                  }
                  rows={3}
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
        {!loading && notes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-gray-400 mb-4">
              <FileText size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">No notes yet for this application.</p>
            <p className="text-gray-400 text-sm mt-2">Create your first note to get started!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isEditing={editingNoteId === note.id}
                onEdit={() => setEditingNoteId(note.id)}
                onSave={(updatedNoteDetails) => handleUpdateNote(note.id, updatedNoteDetails)}
                onCancel={() => setEditingNoteId(null)}
                onDelete={() => handleDeleteNote(note.id)}
                getUserGroupIcon={getUserGroupIcon}
                getUserGroupLabel={getUserGroupLabel}
                loading={loading}
              />
            ))}
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
  getUserGroupIcon: (group: string) => JSX.Element;
  getUserGroupLabel: (group: string) => string;
  loading: boolean;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  getUserGroupIcon,
  getUserGroupLabel,
  loading,
}) => {
  const [editedNoteDetails, setEditedNoteDetails] = useState<NoteDetail[]>([...note.noteDetails]);

  const handleSave = (): void => {
    const validDetails = editedNoteDetails.filter(
      (detail) => detail.title.trim() || detail.detailedDescription.trim()
    );

    if (validDetails.length === 0) {
      alert("Please add at least one note with title or description");
      return;
    }

    onSave(validDetails);
  };

  const handleCancel = (): void => {
    setEditedNoteDetails([...note.noteDetails]);
    onCancel();
  };

  const updateEditedNoteDetail = (index: number, field: keyof NoteDetail, value: string) => {
    const updated = [...editedNoteDetails];
    updated[index] = { ...updated[index], [field]: value };
    setEditedNoteDetails(updated);
  };

  const addEditedNoteDetail = () => {
    setEditedNoteDetails([...editedNoteDetails, { title: "", detailedDescription: "" }]);
  };

  const removeEditedNoteDetail = (index: number) => {
    if (editedNoteDetails.length > 1) {
      setEditedNoteDetails(editedNoteDetails.filter((_, i) => i !== index));
    }
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Note</h3>

        {editedNoteDetails.map((detail, index) => (
          <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-medium text-gray-700">Note {index + 1}</h4>
              {editedNoteDetails.length > 1 && (
                <button
                  onClick={() => removeEditedNoteDetail(index)}
                  className="text-red-500 hover:text-red-700"
                  type="button">
                  <X size={16} />
                </button>
              )}
            </div>

            <input
              type="text"
              value={detail.title}
              onChange={(e) => updateEditedNoteDetail(index, "title", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
              placeholder="Note title..."
            />

            <textarea
              value={detail.detailedDescription}
              onChange={(e) => updateEditedNoteDetail(index, "detailedDescription", e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
              placeholder="Detailed description..."
            />
          </div>
        ))}

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button
            onClick={addEditedNoteDetail}
            className="inline-flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors duration-200"
            type="button">
            <Plus size={16} />
            Add Another Note
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
            type="button">
            <Save size={14} />
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
            type="button">
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {getUserGroupIcon(note.authorCognitoUserGroup)}
          <span className="text-sm font-medium text-gray-600">
            {getUserGroupLabel(note.authorCognitoUserGroup)}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors duration-200 disabled:opacity-50"
            title="Edit note"
            type="button">
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors duration-200 disabled:opacity-50"
            title="Delete note"
            type="button">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {note.noteDetails.map((detail, index) => (
          <div key={index} className="border-l-4 border-blue-200 pl-4">
            {detail.title && (
              <h4 className="font-semibold text-gray-900 text-lg mb-2">{detail.title}</h4>
            )}
            {detail.detailedDescription && (
              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {detail.detailedDescription}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-500 border-t pt-3 mt-4">
        <span>Note ID: {note.id}</span>
        {note.createdAt && (
          <span className="ml-4">Created: {new Date(note.createdAt).toLocaleDateString()}</span>
        )}
        {note.updatedAt && note.updatedAt !== note.createdAt && (
          <span className="ml-4">Updated: {new Date(note.updatedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

export default JobApplicationNotesApp;
