"""
Kloset Kifayah Backend - API Dependencies
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional
from uuid import UUID

from app.core.security import security, verify_token, extract_token
from app.core.supabase import get_supabase_client, get_supabase_admin


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Get current authenticated user.
    
    Raises:
        HTTPException: If not authenticated or token invalid
    """
    token = extract_token(credentials)
    user = await verify_token(token)
    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    Get current user if authenticated, None otherwise.
    """
    if credentials is None:
        return None
    try:
        user = await verify_token(credentials.credentials)
        return user
    except HTTPException:
        return None


async def get_current_user_id(
    current_user: dict = Depends(get_current_user)
) -> UUID:
    """Get current user's ID."""
    return UUID(current_user["id"])


def require_admin():
    """
    Dependency to require admin access.
    For MVP, we'll check against a list of admin emails.
    """
    async def check_admin(
        current_user: dict = Depends(get_current_user)
    ) -> dict:
        # For MVP: hardcoded admin check
        # In production: use roles table or Supabase custom claims
        admin_emails = ["admin@ibtikar.app"]  # Configure in .env later
        
        if current_user.get("email") not in admin_emails:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        return current_user
    
    return check_admin
