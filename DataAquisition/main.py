from fastapi import FastAPI
from pydantic import BaseModel

from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker

import os

app = FastAPI()

# ---------------- DB ----------------
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://neondb_owner:npg_J2q0ambuRelS@ep-frosty-rice-anqnftdm-pooler.c-6.us-east-1.aws.neon.tech/neondb"
)

engine = create_engine(DATABASE_URL)
Base = declarative_base()
SessionLocal = sessionmaker(bind=engine)

# ---------------- TABLA ----------------
class ReadingTable(Base):
    __tablename__ = "lecturas"

    id = Column(Integer, primary_key=True, index=True)
    value = Column(Integer)
    timestamp = Column(Integer)
    deviceName = Column(String)
    units = Column(String)

# ---------------- MODELO ----------------
class Reading(BaseModel):
    value: int
    timestamp: int
    deviceName: str
    units: str

# ---------------- ENDPOINTS ----------------

@app.get("/")
async def root():
    return {"message": "Hola mundo 😸"}

# 🔥 RECIBE UNA LECTURA
@app.post("/readings")
async def receive_reading(reading: Reading):

    db = SessionLocal()

    reading_to_save = ReadingTable(
        value=reading.value,
        timestamp=reading.timestamp,
        deviceName=reading.deviceName,
        units=reading.units
    )

    db.add(reading_to_save)
    db.commit()
    db.refresh(reading_to_save)
    db.close()

    return {
        "message": "Reading recibida",
        "value": reading.value,
        "timestamp": reading.timestamp
    }

# 🔥 RECIBE BATCH
@app.post("/readings/batch")
async def receive_batch(batch: list[Reading]):

    db = SessionLocal()

    readings_to_save = [
        ReadingTable(
            value=r.value,
            timestamp=r.timestamp,
            deviceName=r.deviceName,
            units=r.units
        )
        for r in batch
    ]

    db.add_all(readings_to_save)
    db.commit()
    db.close()

    return {"message": "Batch recibido 🚀"}

# ---------------- START ----------------
@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)