class Backend:
    """
    Clase Backend basada en el diagrama UML.

    Representa la lógica base del sistema:
    - estado del sistema
    - versión de API
    - solicitud de pago
    - confirmación de pago
    - obtención de URL del stream
    """

    def __init__(self):
        self.isSystemActive = True
        self.apiVersion = "1.0.0"
        self.streamURL = "http://esp32cam.local/stream"

    def requestPayment(self):
        return {
            "success": True,
            "message": "Solicitud de pago recibida por Backend",
            "systemActive": self.isSystemActive,
            "apiVersion": self.apiVersion
        }

    def confirmPayment(self):
        return {
            "success": True,
            "message": "Pago confirmado por Backend",
            "systemActive": self.isSystemActive
        }

    def getStreamURL(self):
        return self.streamURL