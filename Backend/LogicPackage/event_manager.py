from uuid import uuid4

from sqlalchemy.orm import Session

from models import DeviceEvent, Feeder


class EventManager:
    """
    Clase encargada de manejar eventos del sistema.

    Según el flujo del proyecto, se registran eventos como:
    - desconexión WiFi
    - comandos enviados al dispositivo
    - activación del dispensador
    - lecturas o alertas del comedero
    """

    def create_event(
        self,
        db: Session,
        feeder_id: str,
        event_type: str,
        description: str | None = None,
        donation_id: str | None = None,
        command: str | None = None,
        food_level: float | None = None,
        weight: float | None = None,
        status: str | None = "created"
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
            donation_id=donation_id,
            event_type=event_type,
            description=description,
            command=command,
            food_level=food_level,
            weight=weight,
            status=status
        )

        db.add(event)

        return {
            "success": True,
            "event_id": event.event_id,
            "feeder_id": feeder_id,
            "event_type": event_type,
            "description": description,
            "status": status,
            "message": "Evento registrado correctamente"
        }

    def register_wifi_disconnection(
        self,
        db: Session,
        feeder_id: str,
        disconnected_minutes: int,
        description: str | None = None
    ) -> dict:
        """
        Registra evento de desconexión WiFi solo si supera 10 minutos.
        """

        if disconnected_minutes < 10:
            return {
                "success": True,
                "event_created": False,
                "feeder_id": feeder_id,
                "disconnected_minutes": disconnected_minutes,
                "message": "No se registra evento porque la desconexión fue menor a 10 minutos"
            }

        return self.create_event(
            db=db,
            feeder_id=feeder_id,
            event_type="wifi_disconnected",
            description=description or f"El comedero lleva {disconnected_minutes} minutos sin conexión WiFi",
            status="alert"
        )