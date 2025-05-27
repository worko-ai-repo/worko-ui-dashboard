import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

// Types
interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
}

interface NewNote {
  title: string;
  content: string;
}

interface NoteCardProps {
  note: Note;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updatedNote: NewNote) => void;
  onCancel: () => void;
  onDelete: () => void;
}

const NotesApp: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newNote, setNewNote] = useState<NewNote>({ title: '', content: '' });

  const handleAddNote = (): void => {
    if (newNote.title.trim() || newNote.content.trim()) {
      const note: Note = {
        id: Date.now(),
        title: newNote.title.trim() || 'Untitled',
        content: newNote.content.trim(),
        createdAt: new Date().toLocaleDateString(),
      };
      setNotes([note, ...notes]);
      setNewNote({ title: '', content: '' });
      setIsAddingNote(false);
    }
  };

  const handleEditNote = (id: number, updatedNote: NewNote): void => {
    setNotes(notes.map(note => 
      note.id === id 
        ? { ...note, title: updatedNote.title || 'Untitled', content: updatedNote.content }
        : note
    ));
    setEditingId(null);
  };

  const handleDeleteNote = (id: number): void => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const cancelAdd = (): void => {
    setNewNote({ title: '', content: '' });
    setIsAddingNote(false);
  };

  const cancelEdit = (): void => {
    setEditingId(null);
  };

  const handleNewNoteChange = (field: keyof NewNote, value: string): void => {
    setNewNote(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Notes</h1>
          <p className="text-gray-600">Keep track of your thoughts and ideas</p>
        </div>

        {/* Add Note Button */}
        <div className="mb-6 text-left">
          <button
            onClick={() => setIsAddingNote(true)}
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            type="button"
          >
            <Plus size={20} />
            Add New Note
          </button>
        </div>

        {/* Add Note Form */}
        {isAddingNote && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 border border-gray-200">
            <input
              type="text"
              placeholder="Note title..."
              value={newNote.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                handleNewNoteChange('title', e.target.value)
              }
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <textarea
              placeholder="Write your note here..."
              value={newNote.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                handleNewNoteChange('content', e.target.value)
              }
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAddNote}
                className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                type="button"
              >
                <Save size={16} />
                Save Note
              </button>
              <button
                onClick={cancelAdd}
                className="inline-flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                type="button"
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">No notes yet. Create your first note!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note: Note) => (
              <NoteCard
                key={note.id}
                note={note}
                isEditing={editingId === note.id}
                onEdit={() => setEditingId(note.id)}
                onSave={(updatedNote: NewNote) => handleEditNote(note.id, updatedNote)}
                onCancel={cancelEdit}
                onDelete={() => handleDeleteNote(note.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NoteCard: React.FC<NoteCardProps> = ({ 
  note, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete 
}) => {
  const [editedNote, setEditedNote] = useState<NewNote>({ 
    title: note.title, 
    content: note.content 
  });

  const handleSave = (): void => {
    onSave(editedNote);
  };

  const handleCancel = (): void => {
    setEditedNote({ title: note.title, content: note.content });
    onCancel();
  };

  const handleEditedNoteChange = (field: keyof NewNote, value: string): void => {
    setEditedNote(prev => ({ ...prev, [field]: value }));
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
        <input
          type="text"
          value={editedNote.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
            handleEditedNoteChange('title', e.target.value)
          }
          className="w-full p-2 border border-gray-300 rounded mb-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium"
        />
        <textarea
          value={editedNote.content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
            handleEditedNoteChange('content', e.target.value)
          }
          rows={4}
          className="w-full p-2 border border-gray-300 rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-vertical"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleSave}
            className="inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
            type="button"
          >
            <Save size={14} />
            Save
          </button>
          <button
            onClick={handleCancel}
            className="inline-flex items-center justify-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors duration-200"
            type="button"
          >
            <X size={14} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-lg leading-tight">{note.title}</h3>
        <div className="flex gap-1 ml-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors duration-200"
            title="Edit note"
            type="button"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors duration-200"
            title="Delete note"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">
        {note.content}
      </div>
      
      <div className="text-xs text-gray-500 border-t pt-3">
        Created: {note.createdAt}
      </div>
    </div>
  );
};

export default NotesApp;