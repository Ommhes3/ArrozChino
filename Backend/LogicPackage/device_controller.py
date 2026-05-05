from uuid import uuid4

from sqlalchemy.orm import Session

from models import DeviceEvent, Feeder


class DeviceController:
    def check_device_status(self, db: Session, feeder_id: str) -> dict:
        feeder = db.get(Feeder, feeder_id)

        if not feeder:
            return {
                "success": False,
                "message": "Comedero no encontrado",
                "feeder_id": feeder_id
            }

        event = DeviceEvent(
            event_id=str(uuid4()),
            feeder_id=feeder.feeder_id,
            event_type="device_status_checked",
            description="Consulta de estado del dispositivo",
            status="connected" if feeder.is_active else "inactive",
            food_level=feeder.food_level
        )

        db.add(event)

        return {
            "success": True,
            "feeder_id": feeder.feeder_id,
            "name": feeder.name,
            "location": feeder.location,
            "is_active": feeder.is_active,
            "food_level": feeder.food_level,
            "food_limit": feeder.food_limit,
            "price_per_donation": feeder.price_per_donation,
            "portion_per_donation": feeder.portion_per_donation,
            "stream_url": feeder.stream_url,
            "mode": "mock"
        }

    def send_command(
        self,
        db: Session,
        feeder_id: str,
        command: str,
        description: str | None = None
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
            event_type="device_command",
            command=command,
            description=description or f"Comando enviado al dispositivo: {command}",
            status="sent"
        )

        db.add(event)

        return {
            "success": True,
            "event_id": event.event_id,
            "feeder_id": feeder_id,
            "command": command,
            "status": "sent",
            "message": "Comando registrado correctamente en modo mock"
        }

    def activate_dispenser(
        self,
        db: Session,
        feeder_id: str,
        donation_id: str | None = None,
        food_amount: float | None = None
    ) -> dict:
        feeder = db.get(Feeder, feeder_id)

        if not feeder:
            return {
                "success": False,
                "message": "Comedero no encontrado",
                "feeder_id": feeder_id
            }

        amount_to_dispense = food_amount

        if amount_to_dispense is None:
            amount_to_dispense = feeder.portion_per_donation or 0

        new_food_level = feeder.food_level - amount_to_dispense

        if new_food_level < 0:
            new_food_level = 0

        feeder.food_level = new_food_level

        event = DeviceEvent(
            event_id=str(uuid4()),
            feeder_id=feeder_id,
            donation_id=donation_id,
            event_type="dispenser_activated",
            command="ACTIVATE_DISPENSER",
            description="Dispensador activado desde DeviceController",
            food_level=feeder.food_level,
            weight=amount_to_dispense,
            status="activated"
        )

        db.add(event)

        return {
            "success": True,
            "event_id": event.event_id,
            "feeder_id": feeder_id,
            "donation_id": donation_id,
            "food_amount": amount_to_dispense,
            "new_food_level": feeder.food_level,
            "status": "activated",
            "message": "Dispensador activado correctamente en modo mock"
        }

    def register_sensor_reading(
        self,
        db: Session,
        feeder_id: str,
        food_level: float,
        weight: float | None = None,
        description: str | None = None
    ) -> dict:
        feeder = db.get(Feeder, feeder_id)

        if not feeder:
            return {
                "success": False,
                "message": "Comedero no encontrado",
                "feeder_id": feeder_id
            }

        feeder.food_level = food_level

        alert_event_id = None

        if feeder.food_limit and food_level <= feeder.food_limit * 0.2:
            event = DeviceEvent(
                event_id=str(uuid4()),
                feeder_id=feeder_id,
                event_type="low_food_level",
                description=description or "Nivel de comida bajo",
                food_level=food_level,
                weight=weight,
                status="alert"
            )

            db.add(event)
            alert_event_id = event.event_id

        return {
            "success": True,
            "feeder_id": feeder_id,
            "food_level": food_level,
            "weight": weight,
            "alert_event_id": alert_event_id,
            "message": "Estado del comedero actualizado desde lectura"
        }

    def update_stream_url(
        self,
        db: Session,
        feeder_id: str,
        stream_url: str
    ) -> dict:
        feeder = db.get(Feeder, feeder_id)

        if not feeder:
            return {
                "success": False,
                "message": "Comedero no encontrado",
                "feeder_id": feeder_id
            }

        feeder.stream_url = stream_url

        event = DeviceEvent(
            event_id=str(uuid4()),
            feeder_id=feeder_id,
            event_type="stream_updated",
            description=f"URL de stream actualizada: {stream_url}",
            status="updated"
        )

        db.add(event)

        return {
            "success": True,
            "event_id": event.event_id,
            "feeder_id": feeder_id,
            "stream_url": stream_url,
            "message": "Stream actualizado correctamente"
        }