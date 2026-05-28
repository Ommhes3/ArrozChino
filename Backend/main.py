from fastapi import FastAPI, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database.database import Base, SessionLocal, engine, get_db
from models import Feeder, Reading

from uuid import uuid4
from datetime import datetime, timedelta

from Modules import (
    users,
    feeders,
    donations,
    device_events,
    device,
    readings
)

app = FastAPI(
    title="Comedor Inteligente API",
    description="Backend base y estructura DeviceController para proyecto integrador",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    seed_initial_data()


def seed_initial_data():
    db = SessionLocal()

    try:
        feeder = db.get(Feeder, "feeder-demo")

        if not feeder:
            demo_feeder = Feeder(
                feeder_id="feeder-demo",
                name="Comedero Demo",
                location="Zona principal",
                is_active=True,
                food_level=5.0,
                food_limit=10.0,
                price_per_donation=10000.0,
                portion_per_donation=0.25,
                stream_url="http://esp32cam.local/stream"
            )

            db.add(demo_feeder)
            db.commit()

        readings_count = (
            db.query(Reading)
            .filter(Reading.feeder_id == "feeder-demo")
            .count()
        )

        if readings_count == 0:
            now = datetime.utcnow()

            demo_readings = [
                Reading(
                    reading_id=str(uuid4()),
                    feeder_id="feeder-demo",
                    food_level=9.0,
                    weight=950.0,
                    device_name="sensor_peso",
                    units="g",
                    taken_at=now - timedelta(minutes=50)
                ),
                Reading(
                    reading_id=str(uuid4()),
                    feeder_id="feeder-demo",
                    food_level=8.2,
                    weight=890.0,
                    device_name="sensor_peso",
                    units="g",
                    taken_at=now - timedelta(minutes=40)
                ),
                Reading(
                    reading_id=str(uuid4()),
                    feeder_id="feeder-demo",
                    food_level=7.5,
                    weight=820.0,
                    device_name="sensor_peso",
                    units="g",
                    taken_at=now - timedelta(minutes=30)
                ),
                Reading(
                    reading_id=str(uuid4()),
                    feeder_id="feeder-demo",
                    food_level=6.7,
                    weight=760.0,
                    device_name="sensor_nivel_comida",
                    units="g",
                    taken_at=now - timedelta(minutes=20)
                ),
                Reading(
                    reading_id=str(uuid4()),
                    feeder_id="feeder-demo",
                    food_level=5.9,
                    weight=700.0,
                    device_name="sensor_nivel_comida",
                    units="g",
                    taken_at=now - timedelta(minutes=10)
                ),
                Reading(
                    reading_id=str(uuid4()),
                    feeder_id="feeder-demo",
                    food_level=5.0,
                    weight=650.0,
                    device_name="sensor_nivel_comida",
                    units="g",
                    taken_at=now
                )
            ]

            db.add_all(demo_readings)
            db.commit()

    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "API del Comedor Inteligente activa",
        "docs": "/docs",
        "tables": [
            "users",
            "feeders",
            "donations",
            "readings",
            "device_events"
        ]
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "database": "postgresql"
    }


@app.get("/readings/chart")
def get_readings_for_chart(
    feeder_id: str = Query(default="feeder-demo"),
    sensor_type: str = Query(default="nivel-comida"),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    q = db.query(Reading).filter(Reading.feeder_id == feeder_id)

    if sensor_type == "peso":
        title = "Sensor de peso"
        unit = "g"
        value_field = "weight"
    elif sensor_type == "nivel-comida":
        title = "Sensor de nivel de comida"
        unit = "g"
        value_field = "food_level"
    else:
        title = "Sensor de nivel de comida"
        unit = "g"
        value_field = "food_level"

    readings_data = (
        q.order_by(Reading.created_at.desc())
        .limit(limit)
        .all()
    )

    readings_data = list(reversed(readings_data))

    data = []

    for reading in readings_data:
        if value_field == "weight":
            value = reading.weight
        else:
            value = reading.food_level

        data.append({
            "reading_id": reading.reading_id,
            "label": reading.created_at.strftime("%H:%M") if reading.created_at else "",
            "value": value,
            "unit": unit,
            "created_at": reading.created_at
        })

    return {
        "success": True,
        "mode": "mock",
        "message": "Datos simulados para gráfica del sensor",
        "feeder_id": feeder_id,
        "sensor_type": sensor_type,
        "title": title,
        "unit": unit,
        "data": data
    }


# Routers
app.include_router(users.router)
app.include_router(feeders.router)
app.include_router(donations.router)
app.include_router(device_events.router)
app.include_router(device.router)
app.include_router(readings.router)