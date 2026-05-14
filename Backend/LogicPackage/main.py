from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, get_db
from LogicPackage.device_controller import DeviceController
from LogicPackage.donation_manager import DonationManager
from models import DeviceEvent, Donation, Feeder, User
from schemas import (
    DeviceCommandRequest,
    DispenserActivationRequest,
    DonationConfirm,
    DonationCreate,
    FeederCreate,
    FeederUpdate,
    SensorReadingCreate,
    StreamUpdate,
    UserCreate,
)

app = FastAPI(
    title="Comedor Inteligente API",
    description="Backend base y estructura DeviceController para proyecto integrador",
    version="1.0.0"
)

device_controller = DeviceController()
donation_manager = DonationManager()


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
            "device_events"
        ]
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "database": "postgresql"
    }



# USERS


@app.post("/users")
def create_user(
    request: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un usuario con ese correo"
        )

    user = User(
        user_id=str(uuid4()),
        name=request.name,
        email=request.email,
        password=request.password,
        role=request.role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        }
    }


@app.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()

    return {
        "success": True,
        "users": [
            {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "created_at": user.created_at
            }
            for user in users
        ]
    }



# FEEDERS


@app.post("/feeders")
def create_feeder(
    request: FeederCreate,
    db: Session = Depends(get_db)
):
    feeder_id = request.feeder_id or str(uuid4())

    existing_feeder = db.get(Feeder, feeder_id)

    if existing_feeder:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un comedero con ese ID"
        )

    feeder = Feeder(
        feeder_id=feeder_id,
        name=request.name,
        location=request.location,
        food_limit=request.food_limit,
        price_per_donation=request.price_per_donation,
        portion_per_donation=request.portion_per_donation,
        stream_url=request.stream_url,
        is_active=True,
        food_level=0.0
    )

    db.add(feeder)
    db.commit()
    db.refresh(feeder)

    return {
        "success": True,
        "feeder": feeder_to_dict(feeder)
    }


@app.get("/feeders")
def list_feeders(db: Session = Depends(get_db)):
    feeders = db.query(Feeder).all()

    return {
        "success": True,
        "feeders": [
            feeder_to_dict(feeder)
            for feeder in feeders
        ]
    }


@app.get("/feeders/{feeder_id}")
def get_feeder(
    feeder_id: str,
    db: Session = Depends(get_db)
):
    feeder = db.get(Feeder, feeder_id)

    if not feeder:
        raise HTTPException(
            status_code=404,
            detail="Comedero no encontrado"
        )

    return {
        "success": True,
        "feeder": feeder_to_dict(feeder)
    }


@app.put("/feeders/{feeder_id}")
def update_feeder(
    feeder_id: str,
    request: FeederUpdate,
    db: Session = Depends(get_db)
):
    feeder = db.get(Feeder, feeder_id)

    if not feeder:
        raise HTTPException(
            status_code=404,
            detail="Comedero no encontrado"
        )

    update_data = request.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(feeder, field, value)

    db.commit()
    db.refresh(feeder)

    return {
        "success": True,
        "feeder": feeder_to_dict(feeder)
    }



# DONATIONS


@app.post("/donations/request")
def request_donation(
    request: DonationCreate,
    db: Session = Depends(get_db)
):
    result = donation_manager.request_donation(
        db=db,
        user_id=request.user_id,
        feeder_id=request.feeder_id,
        amount=request.amount
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    db.commit()

    return result


@app.post("/donations/{donation_id}/confirm")
def confirm_donation(
    donation_id: str,
    request: DonationConfirm,
    db: Session = Depends(get_db)
):
    result = donation_manager.confirm_donation(
        db=db,
        donation_id=donation_id,
        transaction_code=request.transaction_code
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    db.commit()

    return result


@app.get("/donations")
def list_donations(db: Session = Depends(get_db)):
    donations = (
        db.query(Donation)
        .order_by(Donation.donation_date.desc())
        .all()
    )

    return {
        "success": True,
        "donations": [
            {
                "donation_id": donation.donation_id,
                "user_id": donation.user_id,
                "feeder_id": donation.feeder_id,
                "amount": donation.amount,
                "food_amount": donation.food_amount,
                "payment_status": donation.payment_status,
                "payment_transaction_code": donation.payment_transaction_code,
                "donation_date": donation.donation_date
            }
            for donation in donations
        ]
    }


@app.get("/donations/{donation_id}")
def get_donation(
    donation_id: str,
    db: Session = Depends(get_db)
):
    donation = db.get(Donation, donation_id)

    if not donation:
        raise HTTPException(
            status_code=404,
            detail="Donación no encontrada"
        )

    return {
        "success": True,
        "donation": {
            "donation_id": donation.donation_id,
            "user_id": donation.user_id,
            "feeder_id": donation.feeder_id,
            "amount": donation.amount,
            "food_amount": donation.food_amount,
            "payment_status": donation.payment_status,
            "payment_transaction_code": donation.payment_transaction_code,
            "donation_date": donation.donation_date
        }
    }


# DEVICE CONTROLLER


@app.get("/device/{feeder_id}/status")
def check_device_status(
    feeder_id: str,
    db: Session = Depends(get_db)
):
    result = device_controller.check_device_status(db, feeder_id)

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    db.commit()

    return result


@app.post("/device/command")
def send_device_command(
    request: DeviceCommandRequest,
    db: Session = Depends(get_db)
):
    result = device_controller.send_command(
        db=db,
        feeder_id=request.feeder_id,
        command=request.command,
        description=request.description
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    db.commit()

    return result


@app.post("/device/dispenser/activate")
def activate_dispenser(
    request: DispenserActivationRequest,
    db: Session = Depends(get_db)
):
    result = device_controller.activate_dispenser(
        db=db,
        feeder_id=request.feeder_id,
        donation_id=request.donation_id,
        food_amount=request.food_amount
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    db.commit()

    return result


@app.post("/device/readings")
def register_sensor_reading(
    request: SensorReadingCreate,
    db: Session = Depends(get_db)
):
    result = device_controller.register_sensor_reading(
        db=db,
        feeder_id=request.feeder_id,
        food_level=request.food_level,
        weight=request.weight,
        description=request.description
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    db.commit()

    return result


@app.post("/device/stream")
def update_stream(
    request: StreamUpdate,
    db: Session = Depends(get_db)
):
    result = device_controller.update_stream_url(
        db=db,
        feeder_id=request.feeder_id,
        stream_url=request.stream_url
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    db.commit()

    return result


@app.get("/device/{feeder_id}/stream")
def get_stream(
    feeder_id: str,
    db: Session = Depends(get_db)
):
    feeder = db.get(Feeder, feeder_id)

    if not feeder:
        raise HTTPException(
            status_code=404,
            detail="Comedero no encontrado"
        )

    return {
        "success": True,
        "feeder_id": feeder.feeder_id,
        "stream_url": feeder.stream_url,
        "mode": "mock"
    }


# EVENTS


@app.get("/events")
def list_events(db: Session = Depends(get_db)):
    events = (
        db.query(DeviceEvent)
        .order_by(DeviceEvent.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "events": [
            event_to_dict(event)
            for event in events
        ]
    }


@app.get("/events/{feeder_id}")
def list_events_by_feeder(
    feeder_id: str,
    db: Session = Depends(get_db)
):
    events = (
        db.query(DeviceEvent)
        .filter(DeviceEvent.feeder_id == feeder_id)
        .order_by(DeviceEvent.created_at.desc())
        .all()
    )

    return {
        "success": True,
        "feeder_id": feeder_id,
        "events": [
            event_to_dict(event)
            for event in events
        ]
    }


# =========================
# HELPERS
# =========================

def feeder_to_dict(feeder: Feeder) -> dict:
    return {
        "feeder_id": feeder.feeder_id,
        "name": feeder.name,
        "location": feeder.location,
        "is_active": feeder.is_active,
        "food_level": feeder.food_level,
        "food_limit": feeder.food_limit,
        "price_per_donation": feeder.price_per_donation,
        "portion_per_donation": feeder.portion_per_donation,
        "stream_url": feeder.stream_url,
        "created_at": feeder.created_at
    }


def event_to_dict(event: DeviceEvent) -> dict:
    return {
        "event_id": event.event_id,
        "feeder_id": event.feeder_id,
        "donation_id": event.donation_id,
        "event_type": event.event_type,
        "description": event.description,
        "command": event.command,
        "food_level": event.food_level,
        "weight": event.weight,
        "status": event.status,
        "created_at": event.created_at
    }