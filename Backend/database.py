import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Cambia TU_PASSWORD por la contraseña real de tu PostgreSQL.
# También asegúrate de haber creado una base de datos llamada arroz_chino.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:PASSWORD@localhost:5432/arroz_chino"
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