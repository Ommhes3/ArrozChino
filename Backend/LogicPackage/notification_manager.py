from uuid import uuid4

from sqlalchemy.orm import Session

from models import DeviceEvent, Feeder


class NotificationManager:
    """
    Clase encargada de manejar notificaciones.

    Como por ahora no tenemos una tabla independiente de notificaciones,
    las notificaciones se guardan como eventos dentro de device_events.
    """

    def generate_notification(
        self,
        db: Session,
        feeder_id: str,
        message: str,
        notification_type: str = "info",
        related_event_id: str | None = None
    ) -> dict:
        feeder = db.get(Feeder, feeder_id)

        if not feeder:
            return {
                "success": False,
                "message": "Comedero no encontrado",
                "feeder_id": feeder_id
            }

        event = DeviceEvent(
            event_id=str(uuid4()),
            feeder_id=feeder_id,
            donation_id=None,
            event_type=f"notification_{notification_type}",
            description=message,
            command=None,
            food_level=None,
            weight=None,
            status="generated"
        )

        db.add(event)

        return {
            "success": True,
            "notification_event_id": event.event_id,
            "related_event_id": related_event_id,
            "feeder_id": feeder_id,
            "message": message,
            "notification_type": notification_type,
            "status": "generated"
        }