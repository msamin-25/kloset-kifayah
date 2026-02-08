"""
Kloset Kifayah Backend - Message Models
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class MessageCreate(BaseModel):
    """Create a message."""
    content: str = Field(..., min_length=1, max_length=2000)


class Message(BaseModel):
    """Message model."""
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    is_read: bool = False
    created_at: datetime
    
    # Populated by service
    sender_name: Optional[str] = None
    sender_avatar: Optional[str] = None
    
    class Config:
        from_attributes = True


class ConversationCreate(BaseModel):
    """Create a conversation."""
    listing_id: Optional[UUID] = None
    rental_id: Optional[UUID] = None
    other_user_id: UUID
    initial_message: str = Field(..., min_length=1, max_length=2000)


class Conversation(BaseModel):
    """Conversation model."""
    id: UUID
    listing_id: Optional[UUID] = None
    rental_id: Optional[UUID] = None
    participant_1: UUID
    participant_2: UUID
    last_message_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationWithDetails(Conversation):
    """Conversation with additional details."""
    other_user_id: UUID
    other_user_name: Optional[str] = None
    other_user_avatar: Optional[str] = None
    listing_title: Optional[str] = None
    listing_image: Optional[str] = None
    last_message_content: Optional[str] = None
    unread_count: int = 0
    
    class Config:
        from_attributes = True


class ConversationWithMessages(Conversation):
    """Conversation with all messages."""
    messages: List[Message] = []
    other_user_name: Optional[str] = None
    other_user_avatar: Optional[str] = None
    listing_title: Optional[str] = None
    
    class Config:
        from_attributes = True
