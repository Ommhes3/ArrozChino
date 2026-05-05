from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# pruebas con tablas, se usa neon para visualizar mas facil sin docker
import os
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_cPhJeWza7fx2@ep-orange-cherry-anfiexh5-pooler.c-6.us-east-1.aws.neon.tech/neondb"
)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()