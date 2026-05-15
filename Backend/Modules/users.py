from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.database import get_db
from models import User
from schemas import UserCreate, UserLogin


router = APIRouter()


@router.post("/users")
def create_user(
    request: UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un usuario con ese correo"
        )

    user = User(
        user_id=str(uuid4()),
        name=request.name,
        email=request.email,
        password=request.password,
        role=request.role
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at
        }
    }


@router.post("/users/login")
def login_user(
    request: UserLogin,
    db: Session = Depends(get_db)
):
    user = (
        db.query(User)
        .filter(User.email == request.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    if user.password != request.password:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    return {
        "success": True,
        "message": "Inicio de sesión exitoso",
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    
    }