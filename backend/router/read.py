from fastapi import APIRouter, Depends
from sqlmodel import Session

from crud import get_backlinks, get_notes, get_all_links
from crud import get_backlinks, get_notes
from database import get_session
from crud import update_note, delete_note
from schema import NoteUpdate

router = APIRouter()

@router.get("/notes")
def read_note(session: Session = Depends(get_session)):
    return get_notes(session=session)

@router.get("/notes/{note_id}/backlinks")
def read_backlinks(note_id: int, session: Session = Depends(get_session)):
    return get_backlinks(session, note_id)

@router.get("/links")
def read_links(session: Session = Depends(get_session)):
    return get_all_links(session)


@router.put("/notes/{note_id}")
def update(note_id: int, note: NoteUpdate, session: Session = Depends(get_session)):
    return update_note(session, note_id, note)

@router.delete("/notes/{note_id}")
def remove(note_id: int, session: Session = Depends(get_session)):
    delete_note(session, note_id)
    return {"ok": True}