import type { Note, NoteCreate, NoteUpdate } from '../types/note'

const BASE = 'http://127.0.0.1:8000'

export async function getNotes(): Promise<Note[]> {
  const res = await fetch(`${BASE}/notes`)
  if (!res.ok) throw new Error('Failed to load notes')
  return res.json()
}

export async function createNote(note: NoteCreate): Promise<Note> {
  const res = await fetch(`${BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  })
  if (!res.ok) throw new Error('Failed to create note')
  return res.json()
}

export async function updateNote(id: number, note: NoteUpdate): Promise<Note> {
  const res = await fetch(`${BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note)
  })
  if (!res.ok) throw new Error('Failed to update note')
  return res.json()
}

export async function deleteNote(id: number): Promise<void> {
  const res = await fetch(`${BASE}/notes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete note')
}

export async function getBacklinks(id: number): Promise<Note[]> {
  const res = await fetch(`${BASE}/notes/${id}/backlinks`)
  if (!res.ok) throw new Error('Failed to load backlinks')
  return res.json()
}