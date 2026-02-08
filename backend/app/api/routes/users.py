"""
Kloset Kifayah Backend - User Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from uuid import UUID

from app.core.supabase import get_supabase_admin
from app.api.deps import get_current_user, get_current_user_id
from app.models.user import UserUpdate, UserProfile, UserPublicProfile, UserStats
from app.models.listing import Listing
from app.models.rental import RentalWithDetails
from app.schemas.common import SuccessResponse, PaginatedResponse


router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserPublicProfile)
async def get_user_profile(user_id: UUID):
    """
    Get public profile of a user.
    """
    admin = get_supabase_admin()
    
    # Get profile
    response = admin.table("profiles").select("*").eq("id", str(user_id)).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile = response.data
    
    # Get stats
    listings_response = admin.table("listings").select("id", count="exact").eq(
        "owner_id", str(user_id)
    ).eq("status", "active").execute()
    
    rentals_response = admin.table("rentals").select("id", count="exact").eq(
        "owner_id", str(user_id)
    ).eq("status", "completed").execute()
    
    reviews_response = admin.table("reviews").select("rating").eq(
        "reviewee_id", str(user_id)
    ).execute()
    
    # Calculate average rating
    avg_rating = None
    if reviews_response.data:
        ratings = [r["rating"] for r in reviews_response.data]
        avg_rating = sum(ratings) / len(ratings) if ratings else None
    
    return UserPublicProfile(
        id=UUID(profile["id"]),
        full_name=profile.get("full_name"),
        avatar_url=profile.get("avatar_url"),
        location=profile.get("location"),
        bio=profile.get("bio"),
        is_verified_email=profile.get("is_verified_email", False),
        is_verified_phone=profile.get("is_verified_phone", False),
        is_verified_community=profile.get("is_verified_community", False),
        response_rate=profile.get("response_rate", 1.0),
        created_at=profile["created_at"],
        total_listings=listings_response.count or 0,
        completed_rentals=rentals_response.count or 0,
        average_rating=round(avg_rating, 1) if avg_rating else None
    )


@router.put("/{user_id}", response_model=UserProfile)
async def update_profile(
    user_id: UUID,
    update_data: UserUpdate,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Update user profile. Users can only update their own profile.
    """
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    admin = get_supabase_admin()
    
    # Filter out None values
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    response = admin.table("profiles").update(update_dict).eq(
        "id", str(user_id)
    ).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return response.data[0]


@router.get("/{user_id}/listings")
async def get_user_listings(
    user_id: UUID,
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50)
):
    """
    Get listings owned by a user.
    """
    admin = get_supabase_admin()
    
    query = admin.table("listings").select(
        "*, listing_images(*)", count="exact"
    ).eq("owner_id", str(user_id))
    
    # Only show active/approved listings for public view
    query = query.eq("is_approved", True)
    
    if status:
        query = query.eq("status", status)
    
    # Pagination
    offset = (page - 1) * per_page
    query = query.range(offset, offset + per_page - 1)
    query = query.order("created_at", desc=True)
    
    response = query.execute()
    
    return {
        "items": response.data,
        "total": response.count or 0,
        "page": page,
        "per_page": per_page
    }


@router.get("/{user_id}/rentals")
async def get_user_rentals(
    user_id: UUID,
    role: str = Query("renter", regex="^(renter|owner)$"),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Get rental history for a user. Users can only view their own rentals.
    """
    if user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own rentals"
        )
    
    admin = get_supabase_admin()
    
    query = admin.table("rentals").select(
        "*, listings(title, listing_images(image_url))", count="exact"
    )
    
    if role == "renter":
        query = query.eq("renter_id", str(user_id))
    else:
        query = query.eq("owner_id", str(user_id))
    
    if status:
        query = query.eq("status", status)
    
    # Pagination
    offset = (page - 1) * per_page
    query = query.range(offset, offset + per_page - 1)
    query = query.order("created_at", desc=True)
    
    response = query.execute()
    
    return {
        "items": response.data,
        "total": response.count or 0,
        "page": page,
        "per_page": per_page
    }


@router.get("/{user_id}/reviews")
async def get_user_reviews(
    user_id: UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50)
):
    """
    Get reviews about a user.
    """
    admin = get_supabase_admin()
    
    query = admin.table("reviews").select(
        "*, profiles!reviewer_id(full_name, avatar_url)", count="exact"
    ).eq("reviewee_id", str(user_id)).eq("is_visible", True)
    
    # Pagination
    offset = (page - 1) * per_page
    query = query.range(offset, offset + per_page - 1)
    query = query.order("created_at", desc=True)
    
    response = query.execute()
    
    return {
        "items": response.data,
        "total": response.count or 0,
        "page": page,
        "per_page": per_page
    }


@router.get("/{user_id}/stats", response_model=UserStats)
async def get_user_stats(user_id: UUID):
    """
    Get statistics for a user.
    """
    admin = get_supabase_admin()
    
    # Total and active listings
    total_listings = admin.table("listings").select("id", count="exact").eq(
        "owner_id", str(user_id)
    ).execute()
    
    active_listings = admin.table("listings").select("id", count="exact").eq(
        "owner_id", str(user_id)
    ).eq("status", "active").execute()
    
    # Rentals as owner
    rentals_as_owner = admin.table("rentals").select("id", count="exact").eq(
        "owner_id", str(user_id)
    ).execute()
    
    # Rentals as renter
    rentals_as_renter = admin.table("rentals").select("id", count="exact").eq(
        "renter_id", str(user_id)
    ).execute()
    
    # Completed rentals
    completed_rentals = admin.table("rentals").select("id", count="exact").eq(
        "owner_id", str(user_id)
    ).eq("status", "completed").execute()
    
    # Reviews and ratings
    reviews_response = admin.table("reviews").select(
        "rating, review_type"
    ).eq("reviewee_id", str(user_id)).execute()
    
    owner_ratings = []
    renter_ratings = []
    for r in reviews_response.data or []:
        if r["review_type"] == "renter_to_owner":
            owner_ratings.append(r["rating"])
        else:
            renter_ratings.append(r["rating"])
    
    return UserStats(
        total_listings=total_listings.count or 0,
        active_listings=active_listings.count or 0,
        total_rentals_as_owner=rentals_as_owner.count or 0,
        total_rentals_as_renter=rentals_as_renter.count or 0,
        completed_rentals=completed_rentals.count or 0,
        average_rating_as_owner=round(sum(owner_ratings) / len(owner_ratings), 1) if owner_ratings else None,
        average_rating_as_renter=round(sum(renter_ratings) / len(renter_ratings), 1) if renter_ratings else None,
        total_reviews_received=len(reviews_response.data or [])
    )
