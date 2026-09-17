import { useState } from 'react'
import type { Note } from '../types/note'
import NoteList from './NoteList'

interface SidebarProps {
  notes: Note[]
  activeNoteId: number | null
  onSelectNote: (note: Note) => void
  onDeleteNote: (id: number) => void
}

export default function Sidebar({ notes, activeNoteId, onSelectNote, onDeleteNote }: SidebarProps) {
  const [query, setQuery] = useState('')

  const q = query.toLowerCase()
  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)
  )

  return (
    <aside id="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-heading">Search</div>
        <input
          placeholder="Filter notes… (title or content)"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>
      <div className="sidebar-section">
        <div className="sidebar-heading">
          Notes <span className="note-count">{filtered.length}</span>
        </div>
        <NoteList
          notes={filtered}
          activeNoteId={activeNoteId}
          onSelectNote={onSelectNote}
          onDeleteNote={onDeleteNote}
        />
      </div>
    </aside>
  )
}