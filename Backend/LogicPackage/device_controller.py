from uuid import uuid4

from sqlalchemy.orm import Session

from models import DeviceEvent, Donation, Feeder


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

        # Validar primero si la donación existe.
        # Esto evita errores 500 por llave foránea cuando se registra el evento.
        if donation_id:
            donation = db.get(Donation, donation_id)

            if not donation:
                return {
                    "success": False,
                    "message": "La donación indicada no existe",
                    "feeder_id": feeder_id,
                    "donation_id": donation_id,
                    "status": "failed"
                }

        if not feeder.is_active:
            event = DeviceEvent(
                event_id=str(uuid4()),
                feeder_id=feeder_id,
                donation_id=donation_id,
                event_type="dispenser_activation_failed",
                command="ACTIVATE_DISPENSER",
                description="No se pudo activar el dispensador porque el comedero está inactivo",
                food_level=feeder.food_level,
                weight=0,
                status="failed"
            )

            db.add(event)

            return {
                "success": False,
                "event_id": event.event_id,
                "feeder_id": feeder_id,
                "status": "failed",
                "message": "No se puede activar el dispensador porque el comedero está inactivo"
            }

        amount_to_dispense = food_amount

        if amount_to_dispense is None:
            amount_to_dispense = feeder.portion_per_donation or 0

        if amount_to_dispense <= 0:
            event = DeviceEvent(
                event_id=str(uuid4()),
                feeder_id=feeder_id,
                donation_id=donation_id,
                event_type="dispenser_activation_failed",
                command="ACTIVATE_DISPENSER",
                description="No se pudo activar el dispensador porque la cantidad a dispensar no es válida",
                food_level=feeder.food_level,
                weight=amount_to_dispense,
                status="failed"
            )

            db.add(event)

            return {
                "success": False,
                "event_id": event.event_id,
                "feeder_id": feeder_id,
                "food_amount": amount_to_dispense,
                "status": "failed",
                "message": "La cantidad de comida a dispensar debe ser mayor a 0"
            }

        if feeder.food_level <= 0:
            event = DeviceEvent(
                event_id=str(uuid4()),
                feeder_id=feeder_id,
                donation_id=donation_id,
                event_type="dispenser_activation_failed",
                command="ACTIVATE_DISPENSER",
                description="No se pudo activar el dispensador porque no hay comida disponible",
                food_level=feeder.food_level,
                weight=0,
                status="failed"
            )

            db.add(event)

            return {
                "success": False,
                "event_id": event.event_id,
                "feeder_id": feeder_id,
                "current_food_level": feeder.food_level,
                "status": "failed",
                "message": "No hay comida disponible para dispensar"
            }

        real_dispensed_amount = amount_to_dispense
        activation_status = "activated"

        if amount_to_dispense > feeder.food_level:
            real_dispensed_amount = feeder.food_level
            activation_status = "partial"

        new_food_level = feeder.food_level - real_dispensed_amount

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
            weight=real_dispensed_amount,
            status=activation_status
        )

        db.add(event)

        return {
            "success": True,
            "event_id": event.event_id,
            "feeder_id": feeder_id,
            "donation_id": donation_id,

            # Compatibilidad con tests y código anterior
            "food_amount": real_dispensed_amount,

            # Campos más claros para el nuevo flujo
            "requested_food_amount": amount_to_dispense,
            "dispensed_food_amount": real_dispensed_amount,

            "new_food_level": feeder.food_level,
            "status": activation_status,
            "message": "Dispensador activado correctamente"
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

        reading_event = DeviceEvent(
            event_id=str(uuid4()),
            feeder_id=feeder_id,
            event_type="sensor_reading",
            description=description or "Lectura recibida desde sensor",
            command=None,
            food_level=food_level,
            weight=weight,
            status="received"
        )

        db.add(reading_event)

        alert_event_id = None

        if feeder.food_limit and food_level <= feeder.food_limit * 0.2:
            alert_event = DeviceEvent(
                event_id=str(uuid4()),
                feeder_id=feeder_id,
                event_type="low_food_level",
                description="Nivel de comida bajo",
                command=None,
                food_level=food_level,
                weight=weight,
                status="alert"
            )

            db.add(alert_event)
            alert_event_id = alert_event.event_id

        return {
            "success": True,
            "event_id": reading_event.event_id,
            "feeder_id": feeder_id,
            "food_level": food_level,
            "weight": weight,
            "alert_event_id": alert_event_id,
            "message": "Lectura del sensor registrada correctamente"
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