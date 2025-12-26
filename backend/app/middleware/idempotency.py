import json
import hashlib
from typing import Callable
from fastapi import Request, HTTPException, Response
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.idempotency_service import IdempotencyService
from ..auth.dependencies import get_api_key_from_request
from ..database import get_db
from ..config import settings


class IdempotencyMiddleware:
    """
    Middleware for handling idempotency keys on POST requests.

    Intercepts requests with Idempotency-Key headers and returns cached responses
    or validates request hashes to prevent duplicate processing.
    """

    def __init__(self, app):
        self.app = app
        self.idempotency_service = IdempotencyService()

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Only process POST requests
        if scope["method"] != "POST":
            await self.app(scope, receive, send)
            return

        # Build request object for easier access
        request = Request(scope, receive)

        # Check if idempotency is required for this endpoint
        endpoint = scope["path"]
        if not self.idempotency_service.is_idempotency_required(endpoint):
            await self.app(scope, receive, send)
            return

        # Extract idempotency key
        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            # Idempotency key required but not provided
            response = JSONResponse(
                status_code=400,
                content={
                    "error": "Idempotency key required",
                    "message": "POST requests to this endpoint require an Idempotency-Key header"
                }
            )
            await response(scope, receive, send)
            return

        # Get API key ID for user identification
        try:
            api_key_id = await self._get_api_key_id(request)
        except Exception:
            # If we can't get API key, proceed without idempotency
            await self.app(scope, receive, send)
            return

        # Get database session
        db = next(get_db())  # Synchronous for middleware

        try:
            # Read request body for hash computation
            body = await request.body()
            request_body_str = body.decode('utf-8') if body else ''

            # Check if response is cached
            cached_response = await self.idempotency_service.get_idempotency_response(
                db, api_key_id, idempotency_key
            )

            if cached_response:
                # Return cached response
                response = JSONResponse(
                    status_code=cached_response['response_status_code'],
                    content=cached_response['response_body']
                )
                await response(scope, receive, send)
                return

            # Validate request hash if key exists
            is_valid = await self.idempotency_service.validate_request_hash(
                db, api_key_id, idempotency_key, request_body_str
            )

            if not is_valid:
                # Hash mismatch - different request with same idempotency key
                response = JSONResponse(
                    status_code=422,
                    content={
                        "error": "Idempotency key conflict",
                        "message": "Idempotency key already used with different request parameters"
                    }
                )
                await response(scope, receive, send)
                return

            # Store original request body for later use
            scope["idempotency"] = {
                "key": idempotency_key,
                "api_key_id": api_key_id,
                "request_body": request_body_str,
                "endpoint": endpoint,
                "db": db
            }

        except Exception as e:
            # If idempotency check fails, proceed without it (fail open)
            print(f"Idempotency check failed: {e}")
            pass

        # Proceed with normal request processing
        await self.app(scope, receive, send)

    async def _get_api_key_id(self, request: Request) -> str:
        """Extract API key ID from request for idempotency tracking."""
        # Try Authorization header first (Bearer token)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # This would need to be implemented to resolve API key from token
            # For now, return a placeholder
            return "api_key_placeholder"

        # Fallback to other methods
        return "unknown_api_key"

    @staticmethod
    async def store_response(
        db: AsyncSession,
        idempotency_data: dict,
        response_body: dict,
        response_status: int
    ):
        """
        Store response data for idempotency key.

        This should be called after successful request processing.
        """
        if not idempotency_data:
            return

        service = IdempotencyService()
        await service.store_idempotency_response(
            db=db,
            api_key_id=idempotency_data["api_key_id"],
            idempotency_key=idempotency_data["key"],
            endpoint=idempotency_data["endpoint"],
            request_body=idempotency_data["request_body"],
            response_body=response_body,
            response_status_code=response_status
        )