from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.database import get_db
from models import DeviceEvent


router = APIRouter()


@router.get("/events")
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


@router.get("/events/{feeder_id}")
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