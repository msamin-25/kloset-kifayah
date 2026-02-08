"""
Kloset Kifayah Backend - Review Models
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from .enums import ReviewType


class ReviewCreate(BaseModel):
    """Create a review."""
    rental_id: UUID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=1000)
    review_type: ReviewType


class Review(BaseModel):
    """Review model."""
    id: UUID
    rental_id: UUID
    reviewer_id: UUID
    reviewee_id: UUID
    rating: int
    comment: Optional[str] = None
    review_type: ReviewType
    is_visible: bool = True
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReviewWithDetails(Review):
    """Review with user details."""
    reviewer_name: Optional[str] = None
    reviewer_avatar: Optional[str] = None
    listing_title: Optional[str] = None
    
    class Config:
        from_attributes = True


class ReviewSummary(BaseModel):
    """Summary of reviews for a user."""
    total_reviews: int = 0
    average_rating: Optional[float] = None
    rating_distribution: dict = {
        "5": 0,
        "4": 0,
        "3": 0,
        "2": 0,
        "1": 0
    }
