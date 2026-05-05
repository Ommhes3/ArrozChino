from LogicPackage.backend import Backend


def test_backend_can_be_created():
    backend = Backend()

    assert backend is not None
    assert backend.isSystemActive is True
    assert backend.apiVersion == "1.0.0"


def test_backend_request_payment():
    backend = Backend()

    result = backend.requestPayment()

    assert result["success"] is True
    assert result["message"] == "Solicitud de pago recibida por Backend"
    assert result["systemActive"] is True
    assert result["apiVersion"] == "1.0.0"


def test_backend_confirm_payment():
    backend = Backend()

    result = backend.confirmPayment()

    assert result["success"] is True
    assert result["message"] == "Pago confirmado por Backend"
    assert result["systemActive"] is True


def test_backend_get_stream_url():
    backend = Backend()

    result = backend.getStreamURL()

    assert result == "http://esp32cam.local/stream"