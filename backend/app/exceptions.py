"""
Standardized error handling and response models for OneRouter API.
Provides consistent error responses across all endpoints with error codes,
request IDs, and timestamps for better client-side error handling.
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class ErrorCode(str, Enum):
    """Standardized error codes for client-side error handling"""
    # Authentication errors (401)
    INVALID_API_KEY = "INVALID_API_KEY"
    EXPIRED_API_KEY = "EXPIRED_API_KEY"
    INVALID_CLERK_TOKEN = "INVALID_CLERK_TOKEN"
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS"
    
    # Validation errors (400)
    INVALID_AMOUNT = "INVALID_AMOUNT"
    INVALID_CURRENCY = "INVALID_CURRENCY"
    INVALID_REQUEST_FORMAT = "INVALID_REQUEST_FORMAT"
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
    CURRENCY_AMOUNT_MISMATCH = "CURRENCY_AMOUNT_MISMATCH"
    
    # Business logic errors (400/422)
    DUPLICATE_REQUEST = "DUPLICATE_REQUEST"  # Idempotency conflict
    PROVIDER_NOT_CONFIGURED = "PROVIDER_NOT_CONFIGURED"
    INVALID_PROVIDER = "INVALID_PROVIDER"
    AMOUNT_EXCEEDS_LIMIT = "AMOUNT_EXCEEDS_LIMIT"
    
    # Rate limiting (429)
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    
    # Provider errors (external service failures)
    PROVIDER_ERROR = "PROVIDER_ERROR"
    PROVIDER_TIMEOUT = "PROVIDER_TIMEOUT"
    PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE"
    CIRCUIT_BREAKER_OPEN = "CIRCUIT_BREAKER_OPEN"
    
    # Database/Internal errors (500)
    DATABASE_ERROR = "DATABASE_ERROR"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    
    # Not found (404)
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"
    ORDER_NOT_FOUND = "ORDER_NOT_FOUND"


class ErrorDetail(BaseModel):
    """Detailed error information"""
    code: ErrorCode
    message: str
    details: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standardized error response format"""
    error: ErrorDetail
    request_id: str
    timestamp: str


class OneRouterException(Exception):
    """Base exception class for OneRouter API"""
    
    def __init__(
        self,
        error_code: ErrorCode,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None
    ):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


# Specific exception types for different error scenarios
class InvalidAPIKeyException(OneRouterException):
    def __init__(self, message: str = "Invalid or expired API key"):
        super().__init__(
            error_code=ErrorCode.INVALID_API_KEY,
            message=message,
            status_code=401
        )


class InvalidClerkTokenException(OneRouterException):
    def __init__(self, message: str = "Invalid Clerk authentication token"):
        super().__init__(
            error_code=ErrorCode.INVALID_CLERK_TOKEN,
            message=message,
            status_code=401
        )


class PermissionDeniedException(OneRouterException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            message=message,
            status_code=403
        )


class ValidationException(OneRouterException):
    def __init__(self, error_code: ErrorCode, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            error_code=error_code,
            message=message,
            status_code=400,
            details=details
        )


class InvalidAmountException(ValidationException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            error_code=ErrorCode.INVALID_AMOUNT,
            message=message,
            details=details
        )


class CurrencyAmountMismatchException(ValidationException):
    def __init__(self, currency: str, message: str):
        super().__init__(
            error_code=ErrorCode.CURRENCY_AMOUNT_MISMATCH,
            message=message,
            details={"currency": currency}
        )


class DuplicateRequestException(OneRouterException):
    def __init__(self, idempotency_key: str):
        super().__init__(
            error_code=ErrorCode.DUPLICATE_REQUEST,
            message=f"Request with idempotency key '{idempotency_key}' already processed",
            status_code=409,
            details={"idempotency_key": idempotency_key}
        )


class ProviderNotConfiguredException(OneRouterException):
    def __init__(self, provider: str):
        super().__init__(
            error_code=ErrorCode.PROVIDER_NOT_CONFIGURED,
            message=f"Payment provider '{provider}' is not configured for your account",
            status_code=400,
            details={"provider": provider}
        )


class ProviderException(OneRouterException):
    def __init__(self, provider: str, message: str, status_code: int = 502):
        super().__init__(
            error_code=ErrorCode.PROVIDER_ERROR,
            message=f"{provider}: {message}",
            status_code=status_code,
            details={"provider": provider}
        )


class CircuitBreakerOpenException(OneRouterException):
    def __init__(self, provider: str):
        super().__init__(
            error_code=ErrorCode.CIRCUIT_BREAKER_OPEN,
            message=f"Payment provider '{provider}' is temporarily unavailable. Please retry in a moment.",
            status_code=503,
            details={"provider": provider, "retry_after": 60}
        )


class RateLimitException(OneRouterException):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            error_code=ErrorCode.RATE_LIMIT_EXCEEDED,
            message="Too many requests. Please try again later.",
            status_code=429,
            details={"retry_after": retry_after}
        )


class ResourceNotFoundException(OneRouterException):
    def __init__(self, resource_type: str, resource_id: str):
        super().__init__(
            error_code=ErrorCode.RESOURCE_NOT_FOUND,
            message=f"{resource_type} with ID '{resource_id}' not found",
            status_code=404,
            details={"resource_type": resource_type, "resource_id": resource_id}
        )
