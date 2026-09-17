export interface Note {
  id: number
  title: string
  content: string
  created_at: string
}

export interface NoteCreate {
  title: string
  content: string
}

export interface NoteUpdate {
  title?: string
  content?: string
}

export interface Tab {
  id: string
  type: 'note' | 'graph' | 'new'
  title: string
  noteId?: number
}