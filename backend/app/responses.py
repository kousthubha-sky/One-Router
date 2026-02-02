"""
Standardized success response models for OneRouter API.
Mirrors the ErrorResponse pattern from exceptions.py for consistency.
"""

from pydantic import BaseModel, Field
from typing import TypeVar, Generic, Optional, Dict, Any, List
from datetime import datetime

T = TypeVar('T')


class PaginationMeta(BaseModel):
    """Pagination metadata for list responses"""
    total: int = Field(..., description="Total number of items")
    limit: int = Field(..., description="Maximum items per page")
    offset: int = Field(..., description="Number of items skipped")
    has_more: bool = Field(..., description="Whether more items exist")

    @classmethod
    def from_query(cls, total: int, limit: int, offset: int) -> "PaginationMeta":
        """Factory method to create pagination meta from query params"""
        return cls(
            total=total,
            limit=limit,
            offset=offset,
            has_more=(offset + limit) < total
        )


class APIResponse(BaseModel, Generic[T]):
    """
    Standardized success response envelope.

    Mirrors the ErrorResponse pattern:
    - ErrorResponse has: error, request_id, timestamp
    - APIResponse has: data, request_id, timestamp, meta (optional)

    Usage:
        return APIResponse(
            data={"user": user_data},
            request_id=request.state.request_id
        )
    """
    data: T = Field(..., description="Response payload")
    request_id: str = Field(..., description="Unique request identifier for tracing")
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        description="ISO 8601 timestamp"
    )
    meta: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional metadata (pagination, deprecation notices, etc.)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "data": {"id": "123", "name": "Example"},
                "request_id": "req_abc123",
                "timestamp": "2025-01-15T10:30:00Z",
                "meta": None
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Standardized paginated response envelope.

    Usage:
        return PaginatedResponse(
            data=items,
            pagination=PaginationMeta.from_query(total, limit, offset),
            request_id=request.state.request_id
        )
    """
    data: List[T] = Field(..., description="List of items")
    pagination: PaginationMeta = Field(..., description="Pagination metadata")
    request_id: str = Field(..., description="Unique request identifier")
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        description="ISO 8601 timestamp"
    )
    meta: Optional[Dict[str, Any]] = Field(None, description="Optional metadata")


def success_response(
    data: Any,
    request_id: str,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Helper to create standardized success response dict.

    Use this for routes that return raw dicts and want to opt-in
    to the standard format without changing return types.

    Args:
        data: The response payload
        request_id: From request.state.request_id
        meta: Optional metadata

    Returns:
        Dict matching APIResponse structure
    """
    return {
        "data": data,
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "meta": meta
    }


def paginated_response(
    data: List[Any],
    total: int,
    limit: int,
    offset: int,
    request_id: str,
    meta: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Helper to create standardized paginated response dict.

    Args:
        data: List of items
        total: Total count of items (for pagination)
        limit: Page size
        offset: Items skipped
        request_id: From request.state.request_id
        meta: Optional metadata

    Returns:
        Dict matching PaginatedResponse structure
    """
    return {
        "data": data,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total
        },
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "meta": meta
    }
