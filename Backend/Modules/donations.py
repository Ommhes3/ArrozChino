from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from models import Donation
from schemas import DonationCreate, DonationConfirm
from LogicPackage.donation_manager import DonationManager


router = APIRouter()

donation_manager = DonationManager()


@router.post("/donations/request")
def request_donation(
    request: DonationCreate,
    db: Session = Depends(get_db)
):
    result = donation_manager.request_donation(
        db=db,
        user_id=request.user_id,
        feeder_id=request.feeder_id,
        amount=request.amount
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    db.commit()

    return result


@router.post("/donations/{donation_id}/confirm")
def confirm_donation(
    donation_id: str,
    request: DonationConfirm,
    db: Session = Depends(get_db)
):
    result = donation_manager.confirm_donation(
        db=db,
        donation_id=donation_id,
        transaction_code=request.transaction_code
    )

    if not result["success"]:
        raise HTTPException(
            status_code=404,
            detail=result["message"]
        )

    db.commit()

    return result


@router.get("/donations")
def list_donations(db: Session = Depends(get_db)):
    donations = (
        db.query(Donation)
        .order_by(Donation.donation_date.desc())
        .all()
    )

    return {
        "success": True,
        "donations": [
            donation_to_dict(donation)
            for donation in donations
        ]
    }


@router.get("/donations/{donation_id}")
def get_donation(
    donation_id: str,
    db: Session = Depends(get_db)
):
    donation = db.get(Donation, donation_id)

    if not donation:
        raise HTTPException(
            status_code=404,
            detail="Donación no encontrada"
        )

    return {
        "success": True,
        "donation": donation_to_dict(donation)
    }


def donation_to_dict(donation: Donation) -> dict:
    return {
        "donation_id": donation.donation_id,
        "user_id": donation.user_id,
        "feeder_id": donation.feeder_id,
        "amount": donation.amount,
        "food_amount": donation.food_amount,
        "payment_status": donation.payment_status,
        "payment_transaction_code": donation.payment_transaction_code,
        "donation_date": donation.donation_date
    }