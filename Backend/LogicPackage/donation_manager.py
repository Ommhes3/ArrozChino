from uuid import uuid4

from sqlalchemy.orm import Session

from models import DeviceEvent, Donation, Feeder
from ExternalServices.payment import PaymentService


class DonationManager:
    def __init__(self):
        self.payment_service = PaymentService()

    def request_donation(
        self,
        db: Session,
        user_id: str | None,
        feeder_id: str,
        amount: float
    ) -> dict:
        feeder = db.get(Feeder, feeder_id)

        if not feeder:
            return {
                "success": False,
                "message": "Comedero no encontrado",
                "feeder_id": feeder_id
            }

        food_amount = self.calculate_food_amount(
            amount=amount,
            price_per_donation=feeder.price_per_donation,
            portion_per_donation=feeder.portion_per_donation
        )

        payment = self.payment_service.process_payment(amount)

        donation = Donation(
            donation_id=str(uuid4()),
            user_id=user_id,
            feeder_id=feeder_id,
            amount=amount,
            food_amount=food_amount,
            payment_status=payment["status"],
            payment_transaction_code=payment["transaction_code"]
        )

        db.add(donation)

        event = DeviceEvent(
            event_id=str(uuid4()),
            feeder_id=feeder_id,
            donation_id=donation.donation_id,
            event_type="donation_created",
            description="Donación creada y pago procesado en modo mock",
            status=payment["status"],
            weight=food_amount
        )

        db.add(event)

        return {
            "success": True,
            "donation_id": donation.donation_id,
            "feeder_id": feeder_id,
            "amount": amount,
            "food_amount": food_amount,
            "payment_status": donation.payment_status,
            "payment_transaction_code": donation.payment_transaction_code,
            "message": "Donación registrada correctamente"
        }

    def confirm_donation(
        self,
        db: Session,
        donation_id: str,
        transaction_code: str
    ) -> dict:
        donation = db.get(Donation, donation_id)

        if not donation:
            return {
                "success": False,
                "message": "Donación no encontrada",
                "donation_id": donation_id
            }

        payment = self.payment_service.confirm_payment(transaction_code)

        donation.payment_status = payment["status"]
        donation.payment_transaction_code = transaction_code

        event = DeviceEvent(
            event_id=str(uuid4()),
            feeder_id=donation.feeder_id,
            donation_id=donation.donation_id,
            event_type="donation_confirmed",
            description="Donación confirmada correctamente",
            status=payment["status"],
            weight=donation.food_amount
        )

        db.add(event)

        return {
            "success": True,
            "donation_id": donation.donation_id,
            "payment_status": donation.payment_status,
            "payment_transaction_code": donation.payment_transaction_code,
            "message": "Donación confirmada correctamente"
        }

    def calculate_food_amount(
        self,
        amount: float,
        price_per_donation: float | None,
        portion_per_donation: float | None
    ) -> float:
        if not price_per_donation or not portion_per_donation:
            return 0

        portions = amount / price_per_donation
        return portions * portion_per_donation