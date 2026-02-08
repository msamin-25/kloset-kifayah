"""
Kloset Kifayah Backend - Message Routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional
from uuid import UUID

from app.core.supabase import get_supabase_admin
from app.api.deps import get_current_user_id
from app.models.message import MessageCreate, ConversationCreate, Conversation, Message
from app.schemas.common import SuccessResponse


router = APIRouter(prefix="/conversations", tags=["Messages"])


@router.get("")
async def get_conversations(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Get user's conversations.
    """
    admin = get_supabase_admin()
    
    # Get conversations where user is a participant
    query = admin.table("conversations").select(
        "*, listings(id, title, listing_images(image_url)), "
        "profiles!participant_1(id, full_name, avatar_url), "
        "profiles!participant_2(id, full_name, avatar_url)",
        count="exact"
    ).or_(
        f"participant_1.eq.{current_user_id},participant_2.eq.{current_user_id}"
    )
    
    # Pagination
    offset = (page - 1) * per_page
    query = query.range(offset, offset + per_page - 1)
    query = query.order("last_message_at", desc=True)
    
    response = query.execute()
    
    # Add unread counts and last message
    conversations = []
    for conv in response.data or []:
        # Get last message
        last_msg = admin.table("messages").select("content, sender_id, created_at").eq(
            "conversation_id", conv["id"]
        ).order("created_at", desc=True).limit(1).execute()
        
        # Get unread count
        unread = admin.table("messages").select("id", count="exact").eq(
            "conversation_id", conv["id"]
        ).neq("sender_id", str(current_user_id)).eq("is_read", False).execute()
        
        # Determine other user
        if conv["participant_1"] == str(current_user_id):
            other_user = conv.get("profiles!participant_2")
            other_user_id = conv["participant_2"]
        else:
            other_user = conv.get("profiles!participant_1")
            other_user_id = conv["participant_1"]
        
        conv["other_user_id"] = other_user_id
        conv["other_user_name"] = other_user.get("full_name") if other_user else None
        conv["other_user_avatar"] = other_user.get("avatar_url") if other_user else None
        conv["last_message_content"] = last_msg.data[0]["content"] if last_msg.data else None
        conv["unread_count"] = unread.count or 0
        
        # Get listing image if exists
        if conv.get("listings") and conv["listings"].get("listing_images"):
            images = conv["listings"]["listing_images"]
            conv["listing_image"] = images[0]["image_url"] if images else None
            conv["listing_title"] = conv["listings"]["title"]
        
        conversations.append(conv)
    
    return {
        "items": conversations,
        "total": response.count or 0,
        "page": page,
        "per_page": per_page
    }


@router.post("")
async def create_conversation(
    data: ConversationCreate,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Start a new conversation or get existing one.
    """
    admin = get_supabase_admin()
    
    # Check if conversation already exists
    existing = admin.table("conversations").select("id").or_(
        f"and(participant_1.eq.{current_user_id},participant_2.eq.{data.other_user_id}),"
        f"and(participant_1.eq.{data.other_user_id},participant_2.eq.{current_user_id})"
    )
    
    if data.listing_id:
        existing = existing.eq("listing_id", str(data.listing_id))
    
    existing_result = existing.execute()
    
    if existing_result.data:
        # Use existing conversation
        conv_id = existing_result.data[0]["id"]
    else:
        # Create new conversation
        conv_data = {
            "participant_1": str(current_user_id),
            "participant_2": str(data.other_user_id),
            "listing_id": str(data.listing_id) if data.listing_id else None,
            "rental_id": str(data.rental_id) if data.rental_id else None
        }
        
        conv_result = admin.table("conversations").insert(conv_data).execute()
        
        if not conv_result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create conversation"
            )
        
        conv_id = conv_result.data[0]["id"]
    
    # Send initial message
    admin.table("messages").insert({
        "conversation_id": conv_id,
        "sender_id": str(current_user_id),
        "content": data.initial_message
    }).execute()
    
    return {"conversation_id": conv_id}


@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Get conversation with messages.
    """
    admin = get_supabase_admin()
    
    # Get conversation
    conv = admin.table("conversations").select(
        "*, listings(id, title, listing_images(image_url))"
    ).eq("id", str(conversation_id)).single().execute()
    
    if not conv.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Check access
    if conv.data["participant_1"] != str(current_user_id) and conv.data["participant_2"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this conversation"
        )
    
    # Get messages
    offset = (page - 1) * per_page
    messages = admin.table("messages").select(
        "*, profiles!sender_id(full_name, avatar_url)", count="exact"
    ).eq("conversation_id", str(conversation_id)).order(
        "created_at", desc=True
    ).range(offset, offset + per_page - 1).execute()
    
    # Mark messages as read
    admin.table("messages").update({"is_read": True}).eq(
        "conversation_id", str(conversation_id)
    ).neq("sender_id", str(current_user_id)).execute()
    
    # Get other user info
    if conv.data["participant_1"] == str(current_user_id):
        other_user_id = conv.data["participant_2"]
    else:
        other_user_id = conv.data["participant_1"]
    
    other_user = admin.table("profiles").select(
        "full_name, avatar_url"
    ).eq("id", other_user_id).single().execute()
    
    return {
        "conversation": conv.data,
        "other_user": other_user.data,
        "messages": {
            "items": messages.data,
            "total": messages.count or 0,
            "page": page,
            "per_page": per_page
        }
    }


@router.post("/{conversation_id}/messages", response_model=Message)
async def send_message(
    conversation_id: UUID,
    message: MessageCreate,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Send a message in a conversation.
    """
    admin = get_supabase_admin()
    
    # Check access
    conv = admin.table("conversations").select("participant_1, participant_2").eq(
        "id", str(conversation_id)
    ).single().execute()
    
    if not conv.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    if conv.data["participant_1"] != str(current_user_id) and conv.data["participant_2"] != str(current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this conversation"
        )
    
    # Create message
    response = admin.table("messages").insert({
        "conversation_id": str(conversation_id),
        "sender_id": str(current_user_id),
        "content": message.content
    }).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to send message"
        )
    
    return response.data[0]


@router.post("/{conversation_id}/read", response_model=SuccessResponse)
async def mark_read(
    conversation_id: UUID,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Mark all messages in conversation as read.
    """
    admin = get_supabase_admin()
    
    admin.table("messages").update({"is_read": True}).eq(
        "conversation_id", str(conversation_id)
    ).neq("sender_id", str(current_user_id)).execute()
    
    return SuccessResponse(message="Messages marked as read")
