import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { Note, NoteCreate } from '../types/note'

interface NewNoteFormProps {
  onSave: (note: NoteCreate) => Promise<Note>
  onCancel: () => void
}

export default function NewNoteForm({ onSave, onCancel }: NewNoteFormProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSave = async () => {
    if (!title.trim()) return
    await onSave({ title: title.trim(), content })
    setTitle('')
    setContent('')
  }

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      if (!window.confirm('Discard this note?')) return
    }
    onCancel()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <div id="newNoteView" onKeyDown={handleKeyDown}>
      <input
        id="newTitle"
        placeholder="Note title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        autoFocus
      />
      <textarea
        id="newContent"
        placeholder="Write your note… Use [[Another Note]] to link. (Ctrl+Enter to save)"
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <div className="char-count">{content.length} chars</div>
      <div id="newNoteActions">
        <button id="saveNewBtn" onClick={handleSave} disabled={!title.trim()}>Save note</button>
        <button id="cancelNewBtn" className="icon-btn" onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  )
}