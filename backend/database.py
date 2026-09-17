import sys, os
from sqlmodel import SQLModel, Session, create_engine

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)

sqlite_file = os.path.join(DATA_DIR, "database.db")
engine = create_engine(f"sqlite:///{sqlite_file}")

def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session