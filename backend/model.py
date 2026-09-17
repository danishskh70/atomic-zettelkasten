
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Note(SQLModel,table=True):
    id:int | None =Field(default=None,primary_key=True)
    title:str
    content:str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NoteLink(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    from_note_id: int = Field(foreign_key="note.id")
    to_note_id: int = Field(foreign_key="note.id")