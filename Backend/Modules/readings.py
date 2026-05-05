from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from database.database import get_db
from models import Reading, Feeder
from schemas import ReadingCreate
from LogicPackage.device_controller import DeviceController


router = APIRouter()

device_controller = DeviceController()


@router.post("/readings")
def create_reading(
    request: ReadingCreate,
    db: Session = Depends(get_db)
):
    feeder = db.get(Feeder, request.feeder_id)

    if not feeder:
        raise HTTPException(
            status_code=404,
            detail="Feeder no encontrado"
        )

    reading = Reading(
        reading_id=str(uuid4()),
        feeder_id=request.feeder_id,
        food_level=request.food_level,
        weight=request.weight,
        device_name=request.device_name,
        units=request.units,
        taken_at=request.taken_at
    )

    db.add(reading)

    result = device_controller.register_sensor_reading(
        db=db,
        feeder_id=request.feeder_id,
        food_level=request.food_level,
        weight=request.weight,
        description="Lectura procesada desde /readings"
    )

    if not result["success"]:
        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    db.commit()
    db.refresh(reading)

    return {
        "message": "Lectura registrada correctamente",
        "reading_id": reading.reading_id,
        "feeder_id": reading.feeder_id,
        "food_level": reading.food_level,
        "weight": reading.weight,
        "device_name": reading.device_name,
        "units": reading.units,
        "taken_at": reading.taken_at,
        "created_at": reading.created_at,
        "alert_event_id": result.get("alert_event_id")
    }


@router.post("/readings/batch")
def create_readings_batch(
    readings: list[ReadingCreate] = Body(...),
    db: Session = Depends(get_db)
):
    if not readings:
        raise HTTPException(
            status_code=400,
            detail="El batch no puede estar vacío"
        )

    readings_to_save = []
    alert_events = []

    for request in readings:
        feeder = db.get(Feeder, request.feeder_id)

        if not feeder:
            raise HTTPException(
                status_code=404,
                detail=f"Feeder '{request.feeder_id}' no encontrado"
            )

        reading = Reading(
            reading_id=str(uuid4()),
            feeder_id=request.feeder_id,
            food_level=request.food_level,
            weight=request.weight,
            device_name=request.device_name,
            units=request.units,
            taken_at=request.taken_at
        )

        readings_to_save.append(reading)

        result = device_controller.register_sensor_reading(
            db=db,
            feeder_id=request.feeder_id,
            food_level=request.food_level,
            weight=request.weight,
            description="Lectura batch procesada desde /readings/batch"
        )

        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )

        if result.get("alert_event_id"):
            alert_events.append(result["alert_event_id"])

    db.add_all(readings_to_save)
    db.commit()

    return {
        "message": "Batch de lecturas registrado correctamente",
        "inserted": len(readings_to_save),
        "alert_events": alert_events
    }


@router.get("/readings/latest")
def get_latest_reading(
    feeder_id: str = Query(default="feeder-demo"),
    db: Session = Depends(get_db)
):
    reading = (
        db.query(Reading)
        .filter(Reading.feeder_id == feeder_id)
        .order_by(Reading.created_at.desc())
        .first()
    )

    if not reading:
        raise HTTPException(
            status_code=404,
            detail="No hay lecturas registradas para este feeder"
        )

    return reading


@router.get("/readings/last")
def get_last_readings(
    feeder_id: str = Query(default="feeder-demo"),
    limit: int = Query(default=5, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return (
        db.query(Reading)
        .filter(Reading.feeder_id == feeder_id)
        .order_by(Reading.created_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/readings")
def get_readings(
    feeder_id: str | None = Query(default=None),
    device_name: str | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    q = db.query(Reading)

    if feeder_id:
        q = q.filter(Reading.feeder_id == feeder_id)

    if device_name:
        q = q.filter(Reading.device_name == device_name)

    return (
        q.order_by(Reading.created_at.desc())
        .limit(limit)
        .all()
    )