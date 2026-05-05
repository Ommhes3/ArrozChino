from payment import PaymentService


def test_process_payment_returns_approved_payment():
    service = PaymentService()

    result = service.process_payment(100)

    assert result["success"] is True
    assert result["status"] == "approved"
    assert result["amount"] == 100
    assert "transaction_code" in result


def test_confirm_payment_returns_confirmed_payment():
    service = PaymentService()

    result = service.confirm_payment("PAY-TEST-123")

    assert result["success"] is True
    assert result["status"] == "confirmed"
    assert result["transaction_code"] == "PAY-TEST-123"