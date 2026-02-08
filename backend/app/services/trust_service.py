"""
Kloset Kifayah Backend - Trust Service

Handles trust badges, verification levels, and user scoring.
"""
from typing import Dict, List, Optional
from uuid import UUID

from app.core.supabase import get_supabase_admin


class TrustLevel:
    """Trust level constants."""
    UNVERIFIED = 0
    EMAIL_VERIFIED = 1
    PHONE_VERIFIED = 2
    COMMUNITY_VERIFIED = 3
    TOP_LENDER = 4


def calculate_trust_level(user_id: str) -> Dict:
    """
    Calculate trust level and badges for a user.
    
    Args:
        user_id: UUID of the user
        
    Returns:
        Dictionary with trust level and individual badges
    """
    admin = get_supabase_admin()
    
    # Get user profile
    profile = admin.table("profiles").select(
        "is_verified_email, is_verified_phone, is_verified_community"
    ).eq("id", user_id).single().execute()
    
    if not profile.data:
        return {"level": TrustLevel.UNVERIFIED, "badges": []}
    
    badges = []
    level = TrustLevel.UNVERIFIED
    
    # Check verifications
    if profile.data.get("is_verified_email"):
        badges.append("email_verified")
        level = max(level, TrustLevel.EMAIL_VERIFIED)
    
    if profile.data.get("is_verified_phone"):
        badges.append("phone_verified")
        level = max(level, TrustLevel.PHONE_VERIFIED)
    
    if profile.data.get("is_verified_community"):
        badges.append("community_verified")
        level = max(level, TrustLevel.COMMUNITY_VERIFIED)
    
    # Check for Top Lender status (10+ completed rentals, 4.5+ rating)
    completed_rentals = admin.table("rentals").select("id", count="exact").eq(
        "owner_id", user_id
    ).eq("status", "completed").execute()
    
    reviews = admin.table("reviews").select("rating").eq(
        "reviewee_id", user_id
    ).eq("review_type", "renter_to_owner").execute()
    
    if completed_rentals.count and completed_rentals.count >= 10:
        if reviews.data:
            avg_rating = sum(r["rating"] for r in reviews.data) / len(reviews.data)
            if avg_rating >= 4.5:
                badges.append("top_lender")
                level = max(level, TrustLevel.TOP_LENDER)
    
    return {
        "level": level,
        "badges": badges,
        "completed_rentals": completed_rentals.count or 0,
        "is_top_lender": "top_lender" in badges
    }


def get_trust_badges_display(badges: List[str]) -> List[Dict]:
    """
    Get display-friendly badge information.
    
    Args:
        badges: List of badge codes
        
    Returns:
        List of badge display info
    """
    badge_info = {
        "email_verified": {
            "name": "Email Verified",
            "icon": "✉️",
            "description": "Email address has been verified"
        },
        "phone_verified": {
            "name": "Phone Verified",
            "icon": "📱",
            "description": "Phone number has been verified"
        },
        "community_verified": {
            "name": "Community Member",
            "icon": "🤝",
            "description": "Verified through a community invite code"
        },
        "top_lender": {
            "name": "Top Lender",
            "icon": "⭐",
            "description": "10+ completed rentals with 4.5+ rating"
        }
    }
    
    return [badge_info.get(b, {"name": b, "icon": "✓", "description": ""}) for b in badges]


def calculate_response_rate(user_id: str) -> float:
    """
    Calculate user's response rate to rental requests.
    
    Args:
        user_id: UUID of the user (as owner)
        
    Returns:
        Response rate as decimal (0.0 to 1.0)
    """
    admin = get_supabase_admin()
    
    # Get all rental requests received
    total = admin.table("rentals").select("id", count="exact").eq(
        "owner_id", user_id
    ).execute()
    
    if not total.count or total.count == 0:
        return 1.0  # Default to 100% for new users
    
    # Get responded requests (accepted or rejected, not cancelled)
    responded = admin.table("rentals").select("id", count="exact").eq(
        "owner_id", user_id
    ).in_("status", ["accepted", "rejected", "picked_up", "returned", "completed"]).execute()
    
    return round((responded.count or 0) / total.count, 2)


def update_user_response_rate(user_id: str) -> None:
    """
    Update user's response rate in their profile.
    
    Args:
        user_id: UUID of the user
    """
    admin = get_supabase_admin()
    
    rate = calculate_response_rate(user_id)
    
    admin.table("profiles").update({
        "response_rate": rate
    }).eq("id", user_id).execute()


def get_user_trust_summary(user_id: str) -> Dict:
    """
    Get comprehensive trust summary for a user.
    
    Args:
        user_id: UUID of the user
        
    Returns:
        Dictionary with all trust-related information
    """
    admin = get_supabase_admin()
    
    # Get trust level and badges
    trust_info = calculate_trust_level(user_id)
    
    # Get response rate
    response_rate = calculate_response_rate(user_id)
    
    # Get rating info
    reviews = admin.table("reviews").select("rating, review_type").eq(
        "reviewee_id", user_id
    ).execute()
    
    owner_ratings = [r["rating"] for r in (reviews.data or []) if r["review_type"] == "renter_to_owner"]
    renter_ratings = [r["rating"] for r in (reviews.data or []) if r["review_type"] == "owner_to_renter"]
    
    return {
        "trust_level": trust_info["level"],
        "badges": trust_info["badges"],
        "badges_display": get_trust_badges_display(trust_info["badges"]),
        "response_rate": response_rate,
        "completed_rentals": trust_info["completed_rentals"],
        "is_top_lender": trust_info["is_top_lender"],
        "rating_as_owner": round(sum(owner_ratings) / len(owner_ratings), 1) if owner_ratings else None,
        "rating_as_renter": round(sum(renter_ratings) / len(renter_ratings), 1) if renter_ratings else None,
        "total_reviews": len(reviews.data or [])
    }
