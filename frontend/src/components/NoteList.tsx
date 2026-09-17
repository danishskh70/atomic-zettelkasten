import type { MouseEvent } from 'react'
import type { Note } from '../types/note'

interface NoteListProps {
  notes: Note[]
  activeNoteId: number | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (id: number) => void
}

export default function NoteList({ notes, activeNoteId, onSelectNote, onDeleteNote }: NoteListProps) {
  const handleDelete = (e: MouseEvent, id: number, title: string) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${title}"? This can't be undone.`)) {
      onDeleteNote(id)
    }
  }

  return (
    <ul id="noteList">
      {notes.map(n => (
        <li key={n.id} className={n.id === activeNoteId ? 'active' : ''}>
          <span className="note-label" onClick={() => onSelectNote(n)}>{n.title}</span>
          <span className="note-actions">
            <button className="icon-btn small" title="Delete" onClick={e => handleDelete(e, n.id, n.title)}>🗑</button>
          </span>
        </li>
      ))}
    </ul>
  )
}