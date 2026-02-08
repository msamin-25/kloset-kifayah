"""
Kloset Kifayah Backend - Admin Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from uuid import UUID
from pydantic import BaseModel

from app.core.supabase import get_supabase_admin
from app.api.deps import require_admin
from app.schemas.common import SuccessResponse


router = APIRouter(prefix="/admin", tags=["Admin"])


class CommunityCodeCreate(BaseModel):
    code: str
    name: str
    uses_remaining: Optional[int] = None  # None = unlimited


@router.get("/listings/pending")
async def get_pending_listings(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    _: dict = Depends(require_admin())
):
    """
    Get listings pending approval (admin only).
    """
    admin = get_supabase_admin()
    
    query = admin.table("listings").select(
        "*, listing_images(*), profiles!owner_id(full_name, email)",
        count="exact"
    ).eq("is_approved", False).eq("status", "pending")
    
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


@router.post("/listings/{listing_id}/approve", response_model=SuccessResponse)
async def approve_listing(
    listing_id: UUID,
    _: dict = Depends(require_admin())
):
    """
    Approve a pending listing (admin only).
    """
    admin = get_supabase_admin()
    
    # Check listing exists
    existing = admin.table("listings").select("id, status").eq(
        "id", str(listing_id)
    ).single().execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    if existing.data["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing is not pending approval"
        )
    
    admin.table("listings").update({
        "is_approved": True,
        "status": "active"
    }).eq("id", str(listing_id)).execute()
    
    return SuccessResponse(message="Listing approved")


@router.post("/listings/{listing_id}/reject", response_model=SuccessResponse)
async def reject_listing(
    listing_id: UUID,
    reason: Optional[str] = None,
    _: dict = Depends(require_admin())
):
    """
    Reject a pending listing (admin only).
    """
    admin = get_supabase_admin()
    
    existing = admin.table("listings").select("id").eq(
        "id", str(listing_id)
    ).single().execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    admin.table("listings").update({
        "is_approved": False,
        "status": "inactive"
    }).eq("id", str(listing_id)).execute()
    
    # TODO: Send notification to user with reason
    
    return SuccessResponse(message="Listing rejected")


@router.get("/codes")
async def get_community_codes(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    _: dict = Depends(require_admin())
):
    """
    Get all community invite codes (admin only).
    """
    admin = get_supabase_admin()
    
    query = admin.table("community_codes").select("*", count="exact")
    
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


@router.post("/codes")
async def create_community_code(
    code_data: CommunityCodeCreate,
    current_user: dict = Depends(require_admin())
):
    """
    Create a new community invite code (admin only).
    """
    admin = get_supabase_admin()
    
    # Check if code already exists
    existing = admin.table("community_codes").select("id").eq(
        "code", code_data.code
    ).execute()
    
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code already exists"
        )
    
    response = admin.table("community_codes").insert({
        "code": code_data.code,
        "name": code_data.name,
        "uses_remaining": code_data.uses_remaining,
        "created_by": current_user["id"],
        "is_active": True
    }).execute()
    
    return response.data[0]


@router.delete("/codes/{code_id}", response_model=SuccessResponse)
async def deactivate_code(
    code_id: UUID,
    _: dict = Depends(require_admin())
):
    """
    Deactivate a community code (admin only).
    """
    admin = get_supabase_admin()
    
    admin.table("community_codes").update({
        "is_active": False
    }).eq("id", str(code_id)).execute()
    
    return SuccessResponse(message="Code deactivated")


@router.get("/stats")
async def get_admin_stats(_: dict = Depends(require_admin())):
    """
    Get platform statistics (admin only).
    """
    admin = get_supabase_admin()
    
    # Users
    total_users = admin.table("profiles").select("id", count="exact").execute()
    verified_users = admin.table("profiles").select("id", count="exact").eq(
        "is_verified_community", True
    ).execute()
    
    # Listings
    total_listings = admin.table("listings").select("id", count="exact").execute()
    pending_listings = admin.table("listings").select("id", count="exact").eq(
        "status", "pending"
    ).execute()
    active_listings = admin.table("listings").select("id", count="exact").eq(
        "status", "active"
    ).execute()
    
    # Rentals
    total_rentals = admin.table("rentals").select("id", count="exact").execute()
    completed_rentals = admin.table("rentals").select("id", count="exact").eq(
        "status", "completed"
    ).execute()
    active_rentals = admin.table("rentals").select("id", count="exact").in_(
        "status", ["pending", "accepted", "picked_up"]
    ).execute()
    
    return {
        "users": {
            "total": total_users.count or 0,
            "verified": verified_users.count or 0
        },
        "listings": {
            "total": total_listings.count or 0,
            "pending": pending_listings.count or 0,
            "active": active_listings.count or 0
        },
        "rentals": {
            "total": total_rentals.count or 0,
            "completed": completed_rentals.count or 0,
            "active": active_rentals.count or 0
        }
    }
