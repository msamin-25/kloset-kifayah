"""
Kloset Kifayah Backend - Security Utilities
"""
from fastapi import HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client
from typing import Optional
import httpx

from .supabase import get_supabase_client
from .config import get_settings


# HTTP Bearer token security scheme
security = HTTPBearer(auto_error=False)


async def verify_token(token: str) -> dict:
    """
    Verify JWT token with Supabase and return user data.
    
    Args:
        token: JWT access token
        
    Returns:
        User data from Supabase
        
    Raises:
        HTTPException: If token is invalid
    """
    settings = get_settings()
    
    try:
        # Use Supabase to verify the token
        client = get_supabase_client()
        user_response = client.auth.get_user(token)
        
        if user_response and user_response.user:
            return {
                "id": str(user_response.user.id),
                "email": user_response.user.email,
                "email_confirmed_at": user_response.user.email_confirmed_at,
                "phone": user_response.user.phone,
                "created_at": str(user_response.user.created_at) if user_response.user.created_at else None,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )


def extract_token(credentials: Optional[HTTPAuthorizationCredentials]) -> str:
    """
    Extract token from authorization credentials.
    
    Args:
        credentials: HTTP authorization credentials
        
    Returns:
        Token string
        
    Raises:
        HTTPException: If no credentials provided
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header required"
        )
    return credentials.credentials
