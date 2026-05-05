from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from models import Feeder
from schemas import FeederCreate, FeederUpdate


router = APIRouter()


@router.post("/feeders")
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


@router.get("/feeders")
def list_feeders(db: Session = Depends(get_db)):
    feeders = db.query(Feeder).all()

    return {
        "success": True,
        "feeders": [
            feeder_to_dict(feeder)
            for feeder in feeders
        ]
    }


@router.get("/feeders/{feeder_id}")
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


@router.put("/feeders/{feeder_id}")
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
