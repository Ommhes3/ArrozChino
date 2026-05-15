from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from models import Feeder
from schemas import (
    DeviceCommandRequest,
    DispenserActivationRequest,
    SensorReadingCreate,
    StreamUpdate
)
from LogicPackage.device_controller import DeviceController


router = APIRouter(
    tags=["DeviceController"]
)

device_controller = DeviceController()


@router.get("/device/{feeder_id}/status")
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


@router.post("/device/command")
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


@router.post("/device/dispenser/activate")
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
        db.rollback()

        if result["message"] == "Comedero no encontrado":
            raise HTTPException(
                status_code=404,
                detail=result["message"]
            )

        return result

    db.commit()

    return result


# Endpoint de compatibilidad.
# Para lecturas periódicas de la ESP32 usar POST /readings,
# porque ese endpoint guarda historial en la tabla readings.
@router.post("/device/readings")
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
        db.rollback()

        if result["message"] == "Comedero no encontrado":
            raise HTTPException(
                status_code=404,
                detail=result["message"]
            )

        return result

    db.commit()

    return result


@router.post("/device/stream")
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


@router.get("/device/{feeder_id}/stream")
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