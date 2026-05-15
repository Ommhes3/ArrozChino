from LogicPackage.notification_manager import NotificationManager


class FakeFeeder:
    feeder_id = "feeder-demo"


class FakeDB:
    def __init__(self):
        self.items = []

    def get(self, model, item_id):
        if item_id == "feeder-demo":
            return FakeFeeder()
        return None

    def add(self, item):
        self.items.append(item)


def test_generate_notification_success():
    manager = NotificationManager()
    db = FakeDB()

    result = manager.generate_notification(
        db=db,
        feeder_id="feeder-demo",
        message="Nivel de comida bajo",
        notification_type="alert"
    )

    assert result["success"] is True
    assert result["feeder_id"] == "feeder-demo"
    assert result["message"] == "Nivel de comida bajo"
    assert result["notification_type"] == "alert"
    assert result["status"] == "generated"
    assert len(db.items) == 1


def test_generate_notification_feeder_not_found():
    manager = NotificationManager()
    db = FakeDB()

    result = manager.generate_notification(
        db=db,
        feeder_id="no-existe",
        message="Prueba"
    )

    assert result["success"] is False
    assert result["message"] == "Comedero no encontrado"