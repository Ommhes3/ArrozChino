from fastapi import FastAPI
from database.database import Base, SessionLocal, engine
from models import Feeder
from fastapi.middleware.cors import CORSMiddleware
from Modules import users, feeders, donations, device_events, device, readings

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
                price_per_donation=10.0,
                portion_per_donation=0.25,
                stream_url="http://esp32cam.local/stream"
            )

            db.add(demo_feeder)
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



# Routers
app.include_router(users.router)
app.include_router(feeders.router)
app.include_router(donations.router)
app.include_router(device_events.router)
app.include_router(device.router)
app.include_router(readings.router)

