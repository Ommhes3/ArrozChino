from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "donor"

class UserLogin(BaseModel):
    email: str
    password: str
    
class FeederCreate(BaseModel):
    feeder_id: Optional[str] = None
    name: str
    location: Optional[str] = None
    food_limit: Optional[float] = Field(default=None, ge=0)
    price_per_donation: Optional[float] = Field(default=None, ge=0)
    portion_per_donation: Optional[float] = Field(default=None, ge=0)
    stream_url: Optional[str] = None


class FeederUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None
    food_level: Optional[float] = Field(default=None, ge=0)
    food_limit: Optional[float] = Field(default=None, ge=0)
    price_per_donation: Optional[float] = Field(default=None, ge=0)
    portion_per_donation: Optional[float] = Field(default=None, ge=0)
    stream_url: Optional[str] = None


class DonationCreate(BaseModel):
    user_id: Optional[str] = None
    feeder_id: str = "feeder-demo"
    amount: float = Field(..., gt=0)


class DonationConfirm(BaseModel):
    transaction_code: str


class DeviceCommandRequest(BaseModel):
    feeder_id: str = "feeder-demo"
    command: str
    description: Optional[str] = None


class DispenserActivationRequest(BaseModel):
    feeder_id: str = "feeder-demo"
    donation_id: Optional[str] = None
    food_amount: Optional[float] = Field(default=None, ge=0)


class SensorReadingCreate(BaseModel):
    feeder_id: str = "feeder-demo"
    food_level: float = Field(..., ge=0)
    weight: Optional[float] = Field(default=None, ge=0)
    description: Optional[str] = None


class StreamUpdate(BaseModel):
    feeder_id: str = "feeder-demo"
    stream_url: str


class ReadingCreate(BaseModel):
    feeder_id: str = "feeder-demo"
    food_level: float = Field(..., ge=0)
    weight: Optional[float] = Field(default=None, ge=0)
    device_name: Optional[str] = None
    units: str = "kg"
    taken_at: Optional[datetime] = None

class EventCreate(BaseModel):
    feeder_id: str = "feeder-demo"
    donation_id: Optional[str] = None
    event_type: str
    description: Optional[str] = None
    command: Optional[str] = None
    food_level: Optional[float] = Field(default=None, ge=0)
    weight: Optional[float] = Field(default=None, ge=0)
    status: Optional[str] = "created"


class WifiDisconnectionEventCreate(BaseModel):
    feeder_id: str = "feeder-demo"
    disconnected_minutes: int = Field(..., ge=0)
    description: Optional[str] = None


class NotificationCreate(BaseModel):
    feeder_id: str = "feeder-demo"
    message: str
    notification_type: str = "info"
    related_event_id: Optional[str] = None


