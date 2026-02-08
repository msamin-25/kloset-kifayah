"""
Kloset Kifayah Backend - Rental Models
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

from .enums import RentalStatus, PaymentStatus


class RentalCreate(BaseModel):
    """Create rental request."""
    listing_id: UUID
    start_date: date
    end_date: date
    renter_notes: Optional[str] = None
    add_cleaning_service: bool = False


class RentalUpdate(BaseModel):
    """Update rental (for owner notes, etc.)."""
    owner_notes: Optional[str] = None
    renter_notes: Optional[str] = None


class RentalStatusUpdate(BaseModel):
    """Update rental status."""
    status: RentalStatus
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


class Rental(BaseModel):
    """Full rental model."""
    id: UUID
    listing_id: UUID
    renter_id: UUID
    owner_id: UUID
    
    # Dates
    start_date: date
    end_date: date
    total_days: int
    
    # Pricing
    daily_rate: Decimal
    deposit_amount: Decimal
    cleaning_fee: Decimal = Decimal("0")
    service_fee: Decimal = Decimal("0")
    total_amount: Decimal
    
    # Status
    status: RentalStatus = RentalStatus.PENDING
    payment_intent_id: Optional[str] = None
    payment_status: PaymentStatus = PaymentStatus.PENDING
    
    # Contract
    contract_html: Optional[str] = None
    contract_signed_at: Optional[datetime] = None
    
    # Notes
    owner_notes: Optional[str] = None
    renter_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    
    # Timestamps
    picked_up_at: Optional[datetime] = None
    returned_at: Optional[datetime] = None
    add_cleaning_service: bool = False
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class RentalWithDetails(Rental):
    """Rental with listing and user details."""
    listing_title: Optional[str] = None
    listing_image: Optional[str] = None
    renter_name: Optional[str] = None
    renter_avatar: Optional[str] = None
    owner_name: Optional[str] = None
    owner_avatar: Optional[str] = None


class RentalCostBreakdown(BaseModel):
    """Cost breakdown for rental."""
    daily_rate: Decimal
    total_days: int
    subtotal: Decimal
    deposit_amount: Decimal
    cleaning_fee: Decimal
    service_fee: Decimal
    total_amount: Decimal


class RentalContract(BaseModel):
    """Rental contract info."""
    rental_id: UUID
    contract_html: str
    generated_at: datetime
