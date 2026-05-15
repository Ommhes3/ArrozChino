from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from database.database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True, index=True)
    password = Column(String, nullable=False)
    role = Column(String, default="donor")
    created_at = Column(DateTime, default=datetime.utcnow)

    donations = relationship("Donation", back_populates="user")


class Feeder(Base):
    __tablename__ = "feeders"

    feeder_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)

    food_level = Column(Float, default=0.0)
    food_limit = Column(Float, nullable=True)

    price_per_donation = Column(Float, nullable=True)
    portion_per_donation = Column(Float, nullable=True)

    stream_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    donations = relationship("Donation", back_populates="feeder")
    events = relationship("DeviceEvent", back_populates="feeder")
    readings = relationship("Reading", back_populates="feeder")


class Donation(Base):
    __tablename__ = "donations"

    donation_id = Column(String, primary_key=True, index=True)

    user_id = Column(String, ForeignKey("users.user_id"), nullable=True)
    feeder_id = Column(String, ForeignKey("feeders.feeder_id"), nullable=False)

    amount = Column(Float, nullable=False)
    food_amount = Column(Float, nullable=True)

    payment_status = Column(String, default="pending")
    payment_transaction_code = Column(String, nullable=True)

    donation_date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="donations")
    feeder = relationship("Feeder", back_populates="donations")
    events = relationship("DeviceEvent", back_populates="donation")


class DeviceEvent(Base):
    __tablename__ = "device_events"

    event_id = Column(String, primary_key=True, index=True)

    feeder_id = Column(String, ForeignKey("feeders.feeder_id"), nullable=False)
    donation_id = Column(String, ForeignKey("donations.donation_id"), nullable=True)

    event_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    command = Column(String, nullable=True)

    food_level = Column(Float, nullable=True)
    weight = Column(Float, nullable=True)

    status = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    feeder = relationship("Feeder", back_populates="events")
    donation = relationship("Donation", back_populates="events")


class Reading(Base):
    __tablename__ = "readings"

    reading_id = Column(String, primary_key=True, index=True)

    feeder_id = Column(String, ForeignKey("feeders.feeder_id"), nullable=False)

    food_level = Column(Float, nullable=False)
    weight = Column(Float, nullable=True)

    sensor_type = Column(String, default="load_cell")
    description = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    feeder = relationship("Feeder", back_populates="readings")