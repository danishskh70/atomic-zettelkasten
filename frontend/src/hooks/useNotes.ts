import { useState, useCallback } from 'react'
import type { Note, NoteCreate, NoteUpdate, Tab } from '../types/note'
import * as api from '../api/notes'

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [tabs, setTabs] = useState<Tab[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [lastNoteId, setLastNoteId] = useState<number | null>(null)

  const loadNotes = useCallback(async () => {
    const data = await api.getNotes()
    setNotes(data)
  }, [])

  const addNote = useCallback(async (note: NoteCreate) => {
    const created = await api.createNote(note)
    await loadNotes()
    return created
  }, [loadNotes])

  const editNote = useCallback(async (id: number, note: NoteUpdate) => {
    const updated = await api.updateNote(id, note)
    await loadNotes()
    return updated
  }, [loadNotes])

  const removeNote = useCallback(async (id: number) => {
    await api.deleteNote(id)
    await loadNotes()
    setTabs(prev => prev.filter(t => !(t.type === 'note' && t.noteId === id)))
  }, [loadNotes])

  const openNoteTab = useCallback((note: Note) => {
    setLastNoteId(note.id)
    setTabs(prev => {
      const existing = prev.find(t => t.type === 'note' && t.noteId === note.id)
      if (existing) {
        setActiveTabId(existing.id)
        return prev
      }
      const newTab: Tab = { id: `note-${note.id}`, type: 'note', title: note.title, noteId: note.id }
      setActiveTabId(newTab.id)
      return [...prev, newTab]
    })
  }, [])

  const openGraphTab = useCallback(() => {
    setTabs(prev => {
      const existing = prev.find(t => t.type === 'graph')
      if (existing) {
        setActiveTabId(existing.id)
        return prev
      }
      const newTab: Tab = { id: '__graph__', type: 'graph', title: 'Graph' }
      setActiveTabId(newTab.id)
      return [...prev, newTab]
    })
  }, [])

  const openNewNoteTab = useCallback(() => {
    setTabs(prev => {
      const existing = prev.find(t => t.type === 'new')
      if (existing) {
        setActiveTabId(existing.id)
        return prev
      }
      const newTab: Tab = { id: '__new__', type: 'new', title: 'New note' }
      setActiveTabId(newTab.id)
      return [...prev, newTab]
    })
  }, [])

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === tabId)
      if (idx === -1) return prev
      const next = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        const fallback = next[Math.min(idx, next.length - 1)]
        setActiveTabId(fallback ? fallback.id : null)
      }
      return next
    })
  }, [activeTabId])

  return {
    notes, tabs, activeTabId, lastNoteId,
    loadNotes, addNote, editNote, removeNote,
    openNoteTab, openGraphTab, openNewNoteTab, closeTab, setActiveTabId
  }
}