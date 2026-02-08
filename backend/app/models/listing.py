"""
Kloset Kifayah Backend - Listing Models
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from decimal import Decimal

from .enums import ListingStatus, ListingCondition, ListingCategory


class ListingImageCreate(BaseModel):
    """Create listing image."""
    image_url: str
    display_order: int = 0


class ListingImage(ListingImageCreate):
    """Listing image model."""
    id: UUID
    listing_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True


class ListingBase(BaseModel):
    """Base listing model."""
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = None
    category: ListingCategory
    subcategory: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    condition: ListingCondition = ListingCondition.GOOD
    price_per_day: Decimal = Field(..., gt=0)
    sell_price: Optional[Decimal] = Field(default=None, ge=0)  # Buy price (optional)
    deposit_amount: Decimal = Field(default=Decimal("0"), ge=0)
    min_rental_days: int = Field(default=1, ge=1)
    max_rental_days: int = Field(default=30, ge=1)
    is_cleaned: bool = False
    is_smoke_free: bool = False
    is_pet_free: bool = False
    is_modest: bool = False  # Islamic/modest clothing flag
    tags: List[str] = Field(default=[])  # Product tags
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    pickup_instructions: Optional[str] = None
    women_only_pickup: bool = False


class ListingCreate(ListingBase):
    """Create listing model."""
    images: List[str] = Field(default=[], description="List of image URLs")


class ListingUpdate(BaseModel):
    """Update listing model."""
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = None
    category: Optional[ListingCategory] = None
    subcategory: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    condition: Optional[ListingCondition] = None
    price_per_day: Optional[Decimal] = Field(None, gt=0)
    sell_price: Optional[Decimal] = Field(None, ge=0)
    deposit_amount: Optional[Decimal] = Field(None, ge=0)
    min_rental_days: Optional[int] = Field(None, ge=1)
    max_rental_days: Optional[int] = Field(None, ge=1)
    is_cleaned: Optional[bool] = None
    is_smoke_free: Optional[bool] = None
    is_pet_free: Optional[bool] = None
    is_modest: Optional[bool] = None
    tags: Optional[List[str]] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    pickup_instructions: Optional[str] = None
    women_only_pickup: Optional[bool] = None
    status: Optional[ListingStatus] = None


class Listing(ListingBase):
    """Full listing model."""
    id: UUID
    owner_id: UUID
    status: ListingStatus = ListingStatus.PENDING
    is_approved: bool = False
    view_count: int = 0
    created_at: datetime
    updated_at: datetime
    images: List[ListingImage] = []
    
    class Config:
        from_attributes = True


class ListingWithOwner(Listing):
    """Listing with owner info."""
    owner_name: Optional[str] = None
    owner_avatar: Optional[str] = None
    owner_rating: Optional[float] = None
    owner_verified: bool = False


class ListingAvailabilityCreate(BaseModel):
    """Block dates for a listing."""
    start_date: date
    end_date: date
    reason: str = "blocked"


class ListingAvailability(ListingAvailabilityCreate):
    """Listing availability block."""
    id: UUID
    listing_id: UUID
    rental_id: Optional[UUID] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ListingSearchParams(BaseModel):
    """Search/filter parameters for listings."""
    query: Optional[str] = None
    category: Optional[ListingCategory] = None
    location: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    condition: Optional[ListingCondition] = None
    size: Optional[str] = None
    available_from: Optional[date] = None
    available_to: Optional[date] = None
    is_cleaned: Optional[bool] = None
    is_smoke_free: Optional[bool] = None
    women_only_pickup: Optional[bool] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    page: int = 1
    per_page: int = 20
