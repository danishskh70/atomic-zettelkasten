import { useEffect, useState } from 'react'
import type { Note, NoteUpdate } from '../types/note'
import { getBacklinks } from '../api/notes'

interface NoteViewProps {
  note: Note
  onEdit: (id: number, note: NoteUpdate) => Promise<Note>
}

function renderContent(content: string) {
  const parts = content.split(/(\[\[.*?\]\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[\[(.*?)\]\]$/)
    if (match) {
      // [[Target|Display Alias]] — show the alias if present, else the target.
      const [target, alias] = match[1].split('|')
      return <span key={i} className="note-link">{(alias ?? target).trim()}</span>
    }
    return <span key={i}>{part}</span>
  })
}

export default function NoteView({ note, onEdit }: NoteViewProps) {
  const [backlinks, setBacklinks] = useState<Note[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(note.title)
  const [contentDraft, setContentDraft] = useState(note.content)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getBacklinks(note.id).then(setBacklinks).catch(() => setBacklinks([]))
  }, [note.id])

  useEffect(() => {
    setTitleDraft(note.title)
    setContentDraft(note.content)
    setIsEditing(false)
    setError(null)
  }, [note.id, note.title, note.content])

  const isDirty = titleDraft !== note.title || contentDraft !== note.content

  const handleEnterEdit = () => {
    setTitleDraft(note.title)
    setContentDraft(note.content)
    setError(null)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!titleDraft.trim()) {
      setError('Title cannot be empty')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const patch: NoteUpdate = {}
      if (titleDraft.trim() !== note.title) patch.title = titleDraft.trim()
      if (contentDraft !== note.content) patch.content = contentDraft
      await onEdit(note.id, patch)
      setIsEditing(false)
    } catch {
      setError('Save failed — try again')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return
    setTitleDraft(note.title)
    setContentDraft(note.content)
    setError(null)
    setIsEditing(false)
  }

  const wordCount = note.content.trim() ? note.content.trim().split(/\s+/).length : 0

  return (
    <div id="noteView">
      <div id="noteHeader">
        {isEditing ? (
          <input
            id="editTitle"
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            autoFocus
          />
        ) : (
          <h1 id="detailTitle">{note.title}</h1>
        )}
        <div id="noteActions">
          {isEditing ? (
            <>
              <button id="saveEditBtn" onClick={handleSave} disabled={saving || !titleDraft.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="icon-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
            </>
          ) : (
            <button className="icon-btn" onClick={handleEnterEdit} title="Edit note">✏️ Edit</button>
          )}
        </div>
      </div>

      {error && <div className="edit-error">{error}</div>}

      {isEditing ? (
        <div id="editContentArea">
          <textarea
            id="editContent"
            value={contentDraft}
            onChange={e => setContentDraft(e.target.value)}
            placeholder="Write your note… Use [[Another Note]] to link."
          />
          <div className="word-count">{contentDraft.trim() ? contentDraft.trim().split(/\s+/).length : 0} words</div>
        </div>
      ) : (
        <>
          <div id="detailContent">{renderContent(note.content)}</div>
          <div className="word-count">{wordCount} words</div>
        </>
      )}

      <div id="backlinksSection">
        <div className="sidebar-heading">Backlinks</div>
        {backlinks.length === 0 ? (
          <div className="empty-state">No backlinks yet</div>
        ) : (
          <ul id="backlinks">
            {backlinks.map(b => <li key={b.id}>{b.title}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}