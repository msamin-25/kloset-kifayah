"""
Kloset Kifayah Backend - Common Schemas
"""
from pydantic import BaseModel
from typing import Generic, TypeVar, List, Optional

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    items: List[T]
    total: int
    page: int
    per_page: int
    total_pages: int
    
    @classmethod
    def create(cls, items: List[T], total: int, page: int, per_page: int):
        total_pages = (total + per_page - 1) // per_page if per_page > 0 else 0
        return cls(
            items=items,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )


class SuccessResponse(BaseModel):
    """Generic success response."""
    success: bool = True
    message: str = "Operation successful"


class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None


class IDResponse(BaseModel):
    """Response with just an ID."""
    id: str


class HealthCheck(BaseModel):
    """Health check response."""
    status: str = "healthy"
    version: str = "1.0.0"
