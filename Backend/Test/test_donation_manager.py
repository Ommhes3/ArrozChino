from LogicPackage.donation_manager import DonationManager


def test_calculate_food_amount_correctly():
    manager = DonationManager()

    result = manager.calculate_food_amount(
        amount=20,
        price_per_donation=10,
        portion_per_donation=0.25
    )

    assert result == 0.5


def test_calculate_food_amount_returns_zero_without_price():
    manager = DonationManager()

    result = manager.calculate_food_amount(
        amount=20,
        price_per_donation=None,
        portion_per_donation=0.25
    )

    assert result == 0


def test_calculate_food_amount_returns_zero_without_portion():
    manager = DonationManager()

    result = manager.calculate_food_amount(
        amount=20,
        price_per_donation=10,
        portion_per_donation=None
    )

    assert result == 0


def test_calculate_food_amount_returns_zero_with_zero_price():
    manager = DonationManager()

    result = manager.calculate_food_amount(
        amount=20,
        price_per_donation=0,
        portion_per_donation=0.25
    )

    assert result == 0