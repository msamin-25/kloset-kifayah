"""
Kloset Kifayah Backend - Rental Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

from app.core.supabase import get_supabase_admin
from app.core.config import get_settings
from app.api.deps import get_current_user, get_current_user_id
from app.models.rental import RentalCreate, Rental, RentalWithDetails, RentalCostBreakdown
from app.models.enums import RentalStatus
from app.schemas.common import SuccessResponse
from app.services.contract_service import generate_contract
from app.services.payment_service import create_payment_intent


router = APIRouter(prefix="/rentals", tags=["Rentals"])


def calculate_rental_cost(
    daily_rate: float,
    deposit: float,
    start_date: date,
    end_date: date,
    add_cleaning: bool = False
) -> RentalCostBreakdown:
    """Calculate total rental cost."""
    total_days = (end_date - start_date).days + 1
    subtotal = daily_rate * total_days
    cleaning_fee = get_settings().cleaning_service_base_fee if add_cleaning else 0
    service_fee = round(subtotal * 0.05, 2)  # 5% service fee
    total_amount = subtotal + deposit + cleaning_fee + service_fee
    
    return RentalCostBreakdown(
        daily_rate=Decimal(str(daily_rate)),
        total_days=total_days,
        subtotal=Decimal(str(subtotal)),
        deposit_amount=Decimal(str(deposit)),
        cleaning_fee=Decimal(str(cleaning_fee)),
        service_fee=Decimal(str(service_fee)),
        total_amount=Decimal(str(total_amount))
    )


@router.get("")
async def get_rentals(
    role: str = Query("renter", regex="^(renter|owner|all)$"),
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Get user's rentals (as renter or owner).
    """
    admin = get_supabase_admin()
    
    query = admin.table("rentals").select(
        "*, listings(id, title, listing_images(image_url)), "
        "profiles!renter_id(full_name, avatar_url), "
        "profiles!owner_id(full_name, avatar_url)",
        count="exact"
    )
    
    if role == "renter":
        query = query.eq("renter_id", str(current_user_id))
    elif role == "owner":
        query = query.eq("owner_id", str(current_user_id))
    else:
        query = query.or_(
            f"renter_id.eq.{current_user_id},owner_id.eq.{current_user_id}"
        )
    
    if status_filter:
        query = query.eq("status", status_filter)
    
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


@router.post("", response_model=Rental)
async def create_rental(
    rental: RentalCreate,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Create a new rental request.
    """
    admin = get_supabase_admin()
    
    # Get listing
    listing = admin.table("listings").select("*").eq(
        "id", str(rental.listing_id)
    ).single().execute()
    
    if not listing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    listing_data = listing.data
    
    # Validate listing is available
    if listing_data["status"] != "active" or not listing_data["is_approved"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing is not available for rental"
        )
    
    # Cannot rent your own listing
    if listing_data["owner_id"] == str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot rent your own listing"
        )
    
    # Validate dates
    if rental.start_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be in the past"
        )
    
    if rental.end_date < rental.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after start date"
        )
    
    total_days = (rental.end_date - rental.start_date).days + 1
    
    if total_days < listing_data.get("min_rental_days", 1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum rental period is {listing_data['min_rental_days']} days"
        )
    
    if total_days > listing_data.get("max_rental_days", 30):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum rental period is {listing_data['max_rental_days']} days"
        )
    
    # Check availability
    conflicts = admin.table("listing_availability").select("id").eq(
        "listing_id", str(rental.listing_id)
    ).or_(
        f"and(start_date.lte.{rental.end_date},end_date.gte.{rental.start_date})"
    ).execute()
    
    if conflicts.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing is not available for selected dates"
        )
    
    # Check for pending/active rentals on same dates
    rental_conflicts = admin.table("rentals").select("id").eq(
        "listing_id", str(rental.listing_id)
    ).in_("status", ["pending", "accepted", "picked_up"]).or_(
        f"and(start_date.lte.{rental.end_date},end_date.gte.{rental.start_date})"
    ).execute()
    
    if rental_conflicts.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Listing already has a rental request for these dates"
        )
    
    # Calculate costs
    cost = calculate_rental_cost(
        daily_rate=listing_data["price_per_day"],
        deposit=listing_data["deposit_amount"],
        start_date=rental.start_date,
        end_date=rental.end_date,
        add_cleaning=rental.add_cleaning_service
    )
    
    # Create payment intent (placeholder)
    payment_intent_id = create_payment_intent(float(cost.total_amount))
    
    # Create rental
    rental_data = {
        "listing_id": str(rental.listing_id),
        "renter_id": str(current_user_id),
        "owner_id": listing_data["owner_id"],
        "start_date": rental.start_date.isoformat(),
        "end_date": rental.end_date.isoformat(),
        "total_days": cost.total_days,
        "daily_rate": float(cost.daily_rate),
        "deposit_amount": float(cost.deposit_amount),
        "cleaning_fee": float(cost.cleaning_fee),
        "service_fee": float(cost.service_fee),
        "total_amount": float(cost.total_amount),
        "status": "pending",
        "payment_intent_id": payment_intent_id,
        "renter_notes": rental.renter_notes,
        "add_cleaning_service": rental.add_cleaning_service
    }
    
    response = admin.table("rentals").insert(rental_data).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create rental request"
        )
    
    return response.data[0]


@router.get("/{rental_id}")
async def get_rental(
    rental_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Get rental details. Only accessible by renter or owner.
    """
    admin = get_supabase_admin()
    
    response = admin.table("rentals").select(
        "*, listings(id, title, description, category, listing_images(image_url)), "
        "profiles!renter_id(full_name, avatar_url, phone), "
        "profiles!owner_id(full_name, avatar_url, phone)"
    ).eq("id", str(rental_id)).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    rental = response.data
    
    # Check access
    if rental["renter_id"] != str(current_user_id) and rental["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this rental"
        )
    
    return rental


@router.post("/{rental_id}/accept", response_model=SuccessResponse)
async def accept_rental(
    rental_id: UUID,
    owner_notes: Optional[str] = None,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Owner accepts a rental request.
    """
    admin = get_supabase_admin()
    
    rental = admin.table("rentals").select("*").eq(
        "id", str(rental_id)
    ).single().execute()
    
    if not rental.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    if rental.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can accept rentals"
        )
    
    if rental.data["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot accept rental in {rental.data['status']} status"
        )
    
    # Generate contract
    contract_html = generate_contract(rental.data)
    
    # Update rental
    admin.table("rentals").update({
        "status": "accepted",
        "owner_notes": owner_notes,
        "contract_html": contract_html
    }).eq("id", str(rental_id)).execute()
    
    # Block dates on listing
    admin.table("listing_availability").insert({
        "listing_id": rental.data["listing_id"],
        "start_date": rental.data["start_date"],
        "end_date": rental.data["end_date"],
        "reason": "rental",
        "rental_id": str(rental_id)
    }).execute()
    
    return SuccessResponse(message="Rental accepted")


@router.post("/{rental_id}/reject", response_model=SuccessResponse)
async def reject_rental(
    rental_id: UUID,
    reason: Optional[str] = None,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Owner rejects a rental request.
    """
    admin = get_supabase_admin()
    
    rental = admin.table("rentals").select("*").eq(
        "id", str(rental_id)
    ).single().execute()
    
    if not rental.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    if rental.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can reject rentals"
        )
    
    if rental.data["status"] != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot reject rental in {rental.data['status']} status"
        )
    
    admin.table("rentals").update({
        "status": "rejected",
        "cancellation_reason": reason
    }).eq("id", str(rental_id)).execute()
    
    return SuccessResponse(message="Rental rejected")


@router.post("/{rental_id}/pickup", response_model=SuccessResponse)
async def mark_picked_up(
    rental_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Mark rental as picked up. Either party can mark this.
    """
    admin = get_supabase_admin()
    
    rental = admin.table("rentals").select("*").eq(
        "id", str(rental_id)
    ).single().execute()
    
    if not rental.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Either renter or owner can mark pickup
    if rental.data["renter_id"] != str(current_user_id) and rental.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only rental participants can update status"
        )
    
    if rental.data["status"] != "accepted":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot mark pickup for rental in {rental.data['status']} status"
        )
    
    admin.table("rentals").update({
        "status": "picked_up",
        "picked_up_at": datetime.now().isoformat()
    }).eq("id", str(rental_id)).execute()
    
    # Update listing status to rented
    admin.table("listings").update({
        "status": "rented"
    }).eq("id", rental.data["listing_id"]).execute()
    
    return SuccessResponse(message="Marked as picked up")


@router.post("/{rental_id}/return", response_model=SuccessResponse)
async def mark_returned(
    rental_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Mark rental as returned. Either party can mark this.
    """
    admin = get_supabase_admin()
    
    rental = admin.table("rentals").select("*").eq(
        "id", str(rental_id)
    ).single().execute()
    
    if not rental.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    if rental.data["renter_id"] != str(current_user_id) and rental.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only rental participants can update status"
        )
    
    if rental.data["status"] != "picked_up":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot mark return for rental in {rental.data['status']} status"
        )
    
    admin.table("rentals").update({
        "status": "returned",
        "returned_at": datetime.now().isoformat()
    }).eq("id", str(rental_id)).execute()
    
    return SuccessResponse(message="Marked as returned")


@router.post("/{rental_id}/complete", response_model=SuccessResponse)
async def complete_rental(
    rental_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Mark rental as completed. Owner confirms completion and deposit release.
    """
    admin = get_supabase_admin()
    
    rental = admin.table("rentals").select("*").eq(
        "id", str(rental_id)
    ).single().execute()
    
    if not rental.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    if rental.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the owner can complete rentals"
        )
    
    if rental.data["status"] != "returned":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete rental in {rental.data['status']} status"
        )
    
    admin.table("rentals").update({
        "status": "completed",
        "payment_status": "paid"  # In production, release from escrow
    }).eq("id", str(rental_id)).execute()
    
    # Update listing status back to active
    admin.table("listings").update({
        "status": "active"
    }).eq("id", rental.data["listing_id"]).execute()
    
    return SuccessResponse(message="Rental completed")


@router.post("/{rental_id}/cancel", response_model=SuccessResponse)
async def cancel_rental(
    rental_id: UUID,
    reason: Optional[str] = None,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Cancel a rental. Can be done by either party before pickup.
    """
    admin = get_supabase_admin()
    
    rental = admin.table("rentals").select("*").eq(
        "id", str(rental_id)
    ).single().execute()
    
    if not rental.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    if rental.data["renter_id"] != str(current_user_id) and rental.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only rental participants can cancel"
        )
    
    if rental.data["status"] not in ["pending", "accepted"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel rental in {rental.data['status']} status"
        )
    
    admin.table("rentals").update({
        "status": "cancelled",
        "cancellation_reason": reason,
        "payment_status": "refunded"
    }).eq("id", str(rental_id)).execute()
    
    # Remove availability block if it exists
    admin.table("listing_availability").delete().eq(
        "rental_id", str(rental_id)
    ).execute()
    
    return SuccessResponse(message="Rental cancelled")


@router.get("/{rental_id}/contract")
async def get_contract(
    rental_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Get rental contract HTML.
    """
    admin = get_supabase_admin()
    
    rental = admin.table("rentals").select(
        "contract_html, renter_id, owner_id"
    ).eq("id", str(rental_id)).single().execute()
    
    if not rental.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    if rental.data["renter_id"] != str(current_user_id) and rental.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this contract"
        )
    
    if not rental.data["contract_html"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not yet generated"
        )
    
    return {"contract_html": rental.data["contract_html"]}


@router.post("/{rental_id}/cleaning", response_model=SuccessResponse)
async def add_cleaning_service(
    rental_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Add cleaning service to a rental (after return).
    """
    admin = get_supabase_admin()
    settings = get_settings()
    
    rental = admin.table("rentals").select("*").eq(
        "id", str(rental_id)
    ).single().execute()
    
    if not rental.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    if rental.data["renter_id"] != str(current_user_id) and rental.data["owner_id"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only rental participants can add cleaning"
        )
    
    if rental.data["status"] not in ["returned", "completed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cleaning can only be added after return"
        )
    
    # Check if cleaning order already exists
    existing = admin.table("cleaning_orders").select("id").eq(
        "rental_id", str(rental_id)
    ).execute()
    
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cleaning order already exists"
        )
    
    # Create cleaning order
    admin.table("cleaning_orders").insert({
        "rental_id": str(rental_id),
        "fee": settings.cleaning_service_base_fee,
        "status": "pending"
    }).execute()
    
    return SuccessResponse(message="Cleaning service added")
