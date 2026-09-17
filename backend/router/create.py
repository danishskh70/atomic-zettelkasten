from fastapi import APIRouter, Depends
from sqlmodel import Session

from crud import create_notes
from database import get_session
from schema import NoteCreate

router = APIRouter()

@router.post("/notes")
def add_notes(note: NoteCreate, session: Session = Depends(get_session)):
    return create_notes(session=session, note=note)