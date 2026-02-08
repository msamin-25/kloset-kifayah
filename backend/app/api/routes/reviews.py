"""
Kloset Kifayah Backend - Review Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from uuid import UUID

from app.core.supabase import get_supabase_admin
from app.api.deps import get_current_user_id
from app.models.review import ReviewCreate, Review, ReviewWithDetails, ReviewSummary
from app.models.enums import ReviewType


router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=Review)
async def create_review(
    review: ReviewCreate,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Submit a review after rental completion.
    """
    admin = get_supabase_admin()
    
    # Get rental
    rental = admin.table("rentals").select("*").eq(
        "id", str(review.rental_id)
    ).single().execute()
    
    if not rental.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check rental is completed
    if rental.data["status"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only review completed rentals"
        )
    
    # Determine reviewer role and reviewee
    if str(current_user_id) == rental.data["renter_id"]:
        # Renter reviewing owner
        if review.review_type != ReviewType.RENTER_TO_OWNER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="As renter, you can only submit renter_to_owner reviews"
            )
        reviewee_id = rental.data["owner_id"]
    elif str(current_user_id) == rental.data["owner_id"]:
        # Owner reviewing renter
        if review.review_type != ReviewType.OWNER_TO_RENTER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="As owner, you can only submit owner_to_renter reviews"
            )
        reviewee_id = rental.data["renter_id"]
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant in this rental"
        )
    
    # Check for existing review
    existing = admin.table("reviews").select("id").eq(
        "rental_id", str(review.rental_id)
    ).eq("reviewer_id", str(current_user_id)).eq(
        "review_type", review.review_type.value
    ).execute()
    
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a review for this rental"
        )
    
    # Create review
    response = admin.table("reviews").insert({
        "rental_id": str(review.rental_id),
        "reviewer_id": str(current_user_id),
        "reviewee_id": reviewee_id,
        "rating": review.rating,
        "comment": review.comment,
        "review_type": review.review_type.value
    }).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create review"
        )
    
    return response.data[0]


@router.get("/{review_id}", response_model=ReviewWithDetails)
async def get_review(review_id: UUID):
    """
    Get a single review.
    """
    admin = get_supabase_admin()
    
    response = admin.table("reviews").select(
        "*, profiles!reviewer_id(full_name, avatar_url), "
        "rentals(listings(title))"
    ).eq("id", str(review_id)).eq("is_visible", True).single().execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    review = response.data
    review["reviewer_name"] = review.get("profiles", {}).get("full_name")
    review["reviewer_avatar"] = review.get("profiles", {}).get("avatar_url")
    review["listing_title"] = review.get("rentals", {}).get("listings", {}).get("title")
    
    return review


@router.get("/user/{user_id}/summary", response_model=ReviewSummary)
async def get_review_summary(user_id: UUID):
    """
    Get review summary for a user.
    """
    admin = get_supabase_admin()
    
    response = admin.table("reviews").select("rating").eq(
        "reviewee_id", str(user_id)
    ).eq("is_visible", True).execute()
    
    if not response.data:
        return ReviewSummary()
    
    ratings = [r["rating"] for r in response.data]
    distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    
    for r in ratings:
        distribution[str(r)] += 1
    
    return ReviewSummary(
        total_reviews=len(ratings),
        average_rating=round(sum(ratings) / len(ratings), 1) if ratings else None,
        rating_distribution=distribution
    )
