"""
Kloset Kifayah Backend - Auth Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.supabase import get_supabase_client, get_supabase_admin
from app.api.deps import get_current_user
from app.schemas.common import SuccessResponse


router = APIRouter(prefix="/auth", tags=["Authentication"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    community_code: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    email: str


class TokenRefreshRequest(BaseModel):
    refresh_token: str


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    Register a new user with email and password.
    Optionally include a community code for verification.
    """
    client = get_supabase_client()
    
    try:
        # Validate community code if provided
        if request.community_code:
            admin = get_supabase_admin()
            code_response = admin.table("community_codes").select("*").eq(
                "code", request.community_code
            ).eq("is_active", True).execute()
            
            if not code_response.data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired community code"
                )
            
            code = code_response.data[0]
            if code.get("uses_remaining") is not None and code["uses_remaining"] <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Community code has reached maximum uses"
                )
        
        # Sign up with Supabase Auth
        response = client.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "full_name": request.full_name,
                    "community_code": request.community_code
                }
            }
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )
        
        # Update profile with community verification
        if request.community_code and response.user:
            admin = get_supabase_admin()
            admin.table("profiles").update({
                "full_name": request.full_name,
                "community_code": request.community_code,
                "is_verified_community": True
            }).eq("id", str(response.user.id)).execute()
            
            # Decrement uses_remaining if applicable
            code = code_response.data[0]
            if code.get("uses_remaining") is not None:
                admin.table("community_codes").update({
                    "uses_remaining": code["uses_remaining"] - 1
                }).eq("id", code["id"]).execute()
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user_id=str(response.user.id),
            email=response.user.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """
    Login with email and password.
    """
    client = get_supabase_client()
    
    try:
        response = client.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not response.user or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user_id=str(response.user.id),
            email=response.user.email
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )


@router.post("/logout", response_model=SuccessResponse)
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout current user (invalidate session).
    """
    client = get_supabase_client()
    
    try:
        client.auth.sign_out()
        return SuccessResponse(message="Logged out successfully")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(request: TokenRefreshRequest):
    """
    Refresh access token using refresh token.
    """
    client = get_supabase_client()
    
    try:
        response = client.auth.refresh_session(request.refresh_token)
        
        if not response.user or not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user_id=str(response.user.id),
            email=response.user.email
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user info.
    """
    admin = get_supabase_admin()
    
    # Get profile data
    profile_response = admin.table("profiles").select("*").eq(
        "id", current_user["id"]
    ).single().execute()
    
    if profile_response.data:
        return profile_response.data
    
    return current_user


@router.post("/resend-verification", response_model=SuccessResponse)
async def resend_verification(current_user: dict = Depends(get_current_user)):
    """
    Resend email verification link.
    """
    client = get_supabase_client()
    
    try:
        client.auth.resend({
            "type": "signup",
            "email": current_user["email"]
        })
        return SuccessResponse(message="Verification email sent")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
