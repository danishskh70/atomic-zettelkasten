

from pydantic import BaseModel


class NoteCreate(BaseModel):
    title:str
    content:str



class NoteUpdate(BaseModel):
    title: str | None = None
    content: str | None = None