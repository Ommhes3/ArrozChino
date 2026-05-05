from LogicPackage.device_controller import DeviceController


class FakeFeeder:
    feeder_id = "feeder-demo"
    name = "Comedero Demo"
    location = "Zona principal"
    is_active = True
    food_level = 5.0
    food_limit = 10.0
    price_per_donation = 10.0
    portion_per_donation = 0.25
    stream_url = "http://esp32cam.local/stream"


class FakeDB:
    def __init__(self):
        self.items = []

    def get(self, model, item_id):
        if item_id == "feeder-demo":
            return FakeFeeder()
        return None

    def add(self, item):
        self.items.append(item)


def test_check_device_status_success():
    controller = DeviceController()
    db = FakeDB()

    result = controller.check_device_status(db, "feeder-demo")

    assert result["success"] is True
    assert result["feeder_id"] == "feeder-demo"
    assert result["is_active"] is True
    assert result["food_level"] == 5.0


def test_check_device_status_not_found():
    controller = DeviceController()
    db = FakeDB()

    result = controller.check_device_status(db, "no-existe")

    assert result["success"] is False
    assert result["message"] == "Comedero no encontrado"


def test_send_command_success():
    controller = DeviceController()
    db = FakeDB()

    result = controller.send_command(
        db=db,
        feeder_id="feeder-demo",
        command="ACTIVATE_DISPENSER",
        description="Prueba de comando"
    )

    assert result["success"] is True
    assert result["feeder_id"] == "feeder-demo"
    assert result["command"] == "ACTIVATE_DISPENSER"
    assert result["status"] == "sent"
    assert len(db.items) == 1


def test_activate_dispenser_success():
    controller = DeviceController()
    db = FakeDB()

    result = controller.activate_dispenser(
        db=db,
        feeder_id="feeder-demo",
        donation_id="donation-test",
        food_amount=0.25
    )

    assert result["success"] is True
    assert result["feeder_id"] == "feeder-demo"
    assert result["donation_id"] == "donation-test"
    assert result["food_amount"] == 0.25
    assert result["status"] == "activated"
    assert len(db.items) == 1


def test_register_sensor_reading_success():
    controller = DeviceController()
    db = FakeDB()

    result = controller.register_sensor_reading(
        db=db,
        feeder_id="feeder-demo",
        food_level=4.5,
        weight=0.5,
        description="Lectura de prueba"
    )

    assert result["success"] is True
    assert result["feeder_id"] == "feeder-demo"
    assert result["food_level"] == 4.5
    assert result["weight"] == 0.5
    assert len(db.items) == 1


def test_update_stream_url_success():
    controller = DeviceController()
    db = FakeDB()

    result = controller.update_stream_url(
        db=db,
        feeder_id="feeder-demo",
        stream_url="http://test.local/stream"
    )

    assert result["success"] is True
    assert result["feeder_id"] == "feeder-demo"
    assert result["stream_url"] == "http://test.local/stream"
    assert len(db.items) == 1