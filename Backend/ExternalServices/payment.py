from uuid import uuid4


class PaymentService:
    def process_payment(self, amount: float) -> dict:
        transaction_code = f"PAY-{uuid4().hex[:10].upper()}"

        return {
            "success": True,
            "status": "approved",
            "transaction_code": transaction_code,
            "amount": amount
        }

    def confirm_payment(self, transaction_code: str) -> dict:
        return {
            "success": True,
            "status": "confirmed",
            "transaction_code": transaction_code
        }