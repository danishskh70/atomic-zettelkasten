import re
from sqlmodel import select

from model import Note, NoteLink
from schema import NoteCreate, NoteUpdate

def extract_links(content: str) -> list[str]:
    # finds all [[title]] patterns
    return re.findall(r"\[\[(.*?)\]\]", content)

def create_notes(session, note: NoteCreate) -> Note:
    db_note = Note(**note.dict())
    session.add(db_note)
    session.commit()
    session.refresh(db_note)

    # find linked titles, create link rows
    linked_titles = extract_links(note.content)
    for title in linked_titles:
        target = session.exec(select(Note).where(Note.title == title)).first()
        if target:
            assert db_note.id is not None
            link = NoteLink(from_note_id=db_note.id, to_note_id=target.id)
            session.add(link)
    session.commit()
    session.refresh(db_note)
    return db_note


def get_notes(session) -> list[Note]:
    return session.exec(select(Note)).all()

def get_backlinks(session, note_id: int) -> list[Note]:
    links = session.exec(select(NoteLink).where(NoteLink.to_note_id == note_id)).all()
    return [session.get(Note, l.from_note_id) for l in links]

def get_all_links(session) -> list[NoteLink]:
    return session.exec(select(NoteLink)).all()

def rename_links(session, old_title: str, new_title: str, exclude_id: int):
    all_notes = session.exec(select(Note).where(Note.id != exclude_id)).all()
    old_pattern = re.escape(old_title)
    # matches [[Old Title]] or [[Old Title|Alias]] — replaces only the title part
    pattern = re.compile(r"\[\[" + old_pattern + r"(\||\]\])")

    for n in all_notes:
        if pattern.search(n.content):
            n.content = pattern.sub(f"[[{new_title}\\1", n.content)
            session.add(n)

    session.commit()

def update_note(session, note_id: int, note: NoteUpdate) -> Note:
    db_note = session.get(Note, note_id)
    old_title = db_note.title

    if note.title is not None:
        db_note.title = note.title
    if note.content is not None:
        db_note.content = note.content

    session.add(db_note)
    session.commit()
    session.refresh(db_note)

    if note.title is not None and note.title != old_title:
        rename_links(session, old_title, note.title, exclude_id=note_id)

    return db_note

def delete_note(session, note_id: int):
    db_note = session.get(Note, note_id)
    session.delete(db_note)
    session.commit()