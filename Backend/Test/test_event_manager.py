from LogicPackage.event_manager import EventManager


class FakeFeeder:
    feeder_id = "feeder-demo"
    food_level = 5.0


class FakeDB:
    def __init__(self):
        self.items = []

    def get(self, model, item_id):
        if item_id == "feeder-demo":
            return FakeFeeder()
        return None

    def add(self, item):
        self.items.append(item)


def test_create_event_success():
    manager = EventManager()
    db = FakeDB()

    result = manager.create_event(
        db=db,
        feeder_id="feeder-demo",
        event_type="test_event",
        description="Evento de prueba",
        status="created"
    )

    assert result["success"] is True
    assert result["event_type"] == "test_event"
    assert result["status"] == "created"
    assert len(db.items) == 1


def test_create_event_feeder_not_found():
    manager = EventManager()
    db = FakeDB()

    result = manager.create_event(
        db=db,
        feeder_id="no-existe",
        event_type="test_event"
    )

    assert result["success"] is False
    assert result["message"] == "Comedero no encontrado"


def test_wifi_disconnection_less_than_10_minutes_does_not_create_event():
    manager = EventManager()
    db = FakeDB()

    result = manager.register_wifi_disconnection(
        db=db,
        feeder_id="feeder-demo",
        disconnected_minutes=5
    )

    assert result["success"] is True
    assert result["event_created"] is False
    assert len(db.items) == 0


def test_wifi_disconnection_more_than_10_minutes_creates_event():
    manager = EventManager()
    db = FakeDB()

    result = manager.register_wifi_disconnection(
        db=db,
        feeder_id="feeder-demo",
        disconnected_minutes=12
    )

    assert result["success"] is True
    assert result["event_type"] == "wifi_disconnected"
    assert result["status"] == "alert"
    assert len(db.items) == 1