"""
Kloset Kifayah Backend - Listing Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from uuid import UUID
from datetime import date
from decimal import Decimal

from app.core.supabase import get_supabase_admin
from app.api.deps import get_current_user, get_current_user_id, get_current_user_optional
from app.models.listing import (
    ListingCreate, ListingUpdate, Listing, ListingWithOwner,
    ListingAvailabilityCreate, ListingAvailability
)
from app.models.enums import ListingCategory, ListingCondition, ListingStatus
from app.schemas.common import SuccessResponse


router = APIRouter(prefix="/listings", tags=["Listings"])


@router.get("")
async def get_listings(
    # Search and filter
    query: Optional[str] = Query(None, description="Search in title/description"),
    category: Optional[ListingCategory] = Query(None),
    location: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    condition: Optional[ListingCondition] = Query(None),
    size: Optional[str] = Query(None),
    available_from: Optional[date] = Query(None),
    available_to: Optional[date] = Query(None),
    is_cleaned: Optional[bool] = Query(None),
    is_smoke_free: Optional[bool] = Query(None),
    women_only_pickup: Optional[bool] = Query(None),
    # Sorting
    sort_by: str = Query("created_at", regex="^(created_at|price_per_day|view_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    # Pagination
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    # Auth (optional for viewing)
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Search and filter listings.
    Only shows active, approved listings.
    """
    admin = get_supabase_admin()
    
    # Base query - only active and approved
    db_query = admin.table("listings").select(
        "*, listing_images(*), profiles!owner_id(full_name, avatar_url)",
        count="exact"
    ).eq("status", "active").eq("is_approved", True)
    
    # Apply filters
    if query:
        db_query = db_query.or_(f"title.ilike.%{query}%,description.ilike.%{query}%")
    
    if category:
        db_query = db_query.eq("category", category.value)
    
    if location:
        db_query = db_query.ilike("location", f"%{location}%")
    
    if min_price is not None:
        db_query = db_query.gte("price_per_day", min_price)
    
    if max_price is not None:
        db_query = db_query.lte("price_per_day", max_price)
    
    if condition:
        db_query = db_query.eq("condition", condition.value)
    
    if size:
        db_query = db_query.eq("size", size)
    
    if is_cleaned is not None:
        db_query = db_query.eq("is_cleaned", is_cleaned)
    
    if is_smoke_free is not None:
        db_query = db_query.eq("is_smoke_free", is_smoke_free)
    
    if women_only_pickup is not None:
        db_query = db_query.eq("women_only_pickup", women_only_pickup)
    
    # Sorting
    db_query = db_query.order(sort_by, desc=(sort_order == "desc"))
    
    # Pagination
    offset = (page - 1) * per_page
    db_query = db_query.range(offset, offset + per_page - 1)
    
    response = db_query.execute()
    
    # TODO: Filter by availability dates (requires checking listing_availability table)
    
    return {
        "items": response.data,
        "total": response.count or 0,
        "page": page,
        "per_page": per_page
    }


@router.post("", response_model=Listing)
async def create_listing(
    listing: ListingCreate,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Create a new listing.
    Listing will be pending approval.
    """
    admin = get_supabase_admin()
    
    # Create listing
    listing_data = listing.model_dump(exclude={"images"})
    listing_data["owner_id"] = str(current_user_id)
    listing_data["status"] = "pending"
    listing_data["is_approved"] = False
    listing_data["price_per_day"] = float(listing_data["price_per_day"])
    listing_data["deposit_amount"] = float(listing_data["deposit_amount"])
    
    response = admin.table("listings").insert(listing_data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create listing"
        )
    
    listing_id = response.data[0]["id"]
    
    # Add images
    if listing.images:
        images_data = [
            {
                "listing_id": listing_id,
                "image_url": url,
                "display_order": i
            }
            for i, url in enumerate(listing.images)
        ]
        admin.table("listing_images").insert(images_data).execute()
    
    # Return full listing with images
    result = admin.table("listings").select(
        "*, listing_images(*)"
    ).eq("id", listing_id).single().execute()
    
    return result.data


@router.get("/{listing_id}")
async def get_listing(
    listing_id: UUID,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Get a single listing by ID.
    Increments view count.
    """
    admin = get_supabase_admin()
    
    response = admin.table("listings").select(
        "*, listing_images(*), profiles!owner_id(id, full_name, avatar_url, is_verified_email, is_verified_phone, is_verified_community, response_rate)"
    ).eq("id", str(listing_id)).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    listing = response.data
    
    # Check if user can view (owner can view their own non-approved listings)
    is_owner = current_user and current_user.get("id") == listing["owner_id"]
    if not listing["is_approved"] and not is_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # Increment view count (don't count owner views)
    if not is_owner:
        admin.table("listings").update({
            "view_count": listing["view_count"] + 1
        }).eq("id", str(listing_id)).execute()
    
    # Get owner stats
    owner_id = listing["owner_id"]
    reviews_response = admin.table("reviews").select("rating").eq(
        "reviewee_id", owner_id
    ).execute()
    
    owner_rating = None
    if reviews_response.data:
        ratings = [r["rating"] for r in reviews_response.data]
        owner_rating = round(sum(ratings) / len(ratings), 1) if ratings else None
    
    listing["owner_rating"] = owner_rating
    
    return listing


@router.put("/{listing_id}", response_model=Listing)
async def update_listing(
    listing_id: UUID,
    update_data: ListingUpdate,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Update a listing. Only owner can update.
    """
    admin = get_supabase_admin()
    
    # Check ownership
    existing = admin.table("listings").select("owner_id").eq(
        "id", str(listing_id)
    ).single().execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if existing.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own listings"
        )
    
    # Filter out None values
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    # Convert decimals
    if "price_per_day" in update_dict:
        update_dict["price_per_day"] = float(update_dict["price_per_day"])
    if "deposit_amount" in update_dict:
        update_dict["deposit_amount"] = float(update_dict["deposit_amount"])
    
    if not update_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    response = admin.table("listings").update(update_dict).eq(
        "id", str(listing_id)
    ).execute()
    
    # Return full listing
    result = admin.table("listings").select(
        "*, listing_images(*)"
    ).eq("id", str(listing_id)).single().execute()
    
    return result.data


@router.delete("/{listing_id}", response_model=SuccessResponse)
async def delete_listing(
    listing_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Delete a listing. Only owner can delete.
    """
    admin = get_supabase_admin()
    
    # Check ownership
    existing = admin.table("listings").select("owner_id").eq(
        "id", str(listing_id)
    ).single().execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if existing.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own listings"
        )
    
    # Check for active rentals
    active_rentals = admin.table("rentals").select("id", count="exact").eq(
        "listing_id", str(listing_id)
    ).in_("status", ["pending", "accepted", "picked_up"]).execute()
    
    if active_rentals.count and active_rentals.count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete listing with active rentals"
        )
    
    admin.table("listings").delete().eq("id", str(listing_id)).execute()
    
    return SuccessResponse(message="Listing deleted successfully")


@router.get("/{listing_id}/availability")
async def get_listing_availability(listing_id: UUID):
    """
    Get blocked dates for a listing.
    """
    admin = get_supabase_admin()
    
    response = admin.table("listing_availability").select("*").eq(
        "listing_id", str(listing_id)
    ).gte("end_date", date.today().isoformat()).order("start_date").execute()
    
    return response.data


@router.post("/{listing_id}/availability", response_model=ListingAvailability)
async def block_dates(
    listing_id: UUID,
    availability: ListingAvailabilityCreate,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Block dates on a listing (owner only).
    """
    admin = get_supabase_admin()
    
    # Check ownership
    existing = admin.table("listings").select("owner_id").eq(
        "id", str(listing_id)
    ).single().execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if existing.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own listings"
        )
    
    # Check for conflicts
    conflicts = admin.table("listing_availability").select("id").eq(
        "listing_id", str(listing_id)
    ).or_(
        f"and(start_date.lte.{availability.end_date},end_date.gte.{availability.start_date})"
    ).execute()
    
    if conflicts.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dates conflict with existing blocked period"
        )
    
    response = admin.table("listing_availability").insert({
        "listing_id": str(listing_id),
        "start_date": availability.start_date.isoformat(),
        "end_date": availability.end_date.isoformat(),
        "reason": availability.reason
    }).execute()
    
    return response.data[0]


@router.delete("/{listing_id}/availability/{availability_id}", response_model=SuccessResponse)
async def unblock_dates(
    listing_id: UUID,
    availability_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Remove a blocked date range (owner only).
    Cannot remove blocks caused by rentals.
    """
    admin = get_supabase_admin()
    
    # Check ownership
    existing = admin.table("listings").select("owner_id").eq(
        "id", str(listing_id)
    ).single().execute()
    
    if not existing.data or existing.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only manage your own listings"
        )
    
    # Check if it's a rental block
    block = admin.table("listing_availability").select("*").eq(
        "id", str(availability_id)
    ).single().execute()
    
    if not block.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blocked period not found"
        )
    
    if block.data.get("rental_id"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove blocks caused by rentals"
        )
    
    admin.table("listing_availability").delete().eq("id", str(availability_id)).execute()
    
    return SuccessResponse(message="Blocked period removed")
