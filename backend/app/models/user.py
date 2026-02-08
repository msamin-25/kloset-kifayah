"""
Kloset Kifayah Backend - User Models
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class UserCreate(BaseModel):
    """User registration model."""
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    community_code: Optional[str] = None


class UserUpdate(BaseModel):
    """User profile update model."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    avatar_url: Optional[str] = None


class UserProfile(UserBase):
    """Full user profile model."""
    id: UUID
    avatar_url: Optional[str] = None
    is_verified_email: bool = False
    is_verified_phone: bool = False
    is_verified_community: bool = False
    community_code: Optional[str] = None
    response_rate: float = 1.0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserPublicProfile(BaseModel):
    """Public-facing user profile (limited info)."""
    id: UUID
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    is_verified_email: bool = False
    is_verified_phone: bool = False
    is_verified_community: bool = False
    response_rate: float = 1.0
    created_at: datetime
    
    # Computed fields (will be added by service)
    total_listings: int = 0
    completed_rentals: int = 0
    average_rating: Optional[float] = None
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User statistics."""
    total_listings: int = 0
    active_listings: int = 0
    total_rentals_as_owner: int = 0
    total_rentals_as_renter: int = 0
    completed_rentals: int = 0
    average_rating_as_owner: Optional[float] = None
    average_rating_as_renter: Optional[float] = None
    total_reviews_received: int = 0
