import hashlib
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.sql import text

from ..models import IdempotencyKey
from ..config import settings
from ..exceptions import IdempotencyKeyConflictException, IdempotencyKeyExpiredException


class IdempotencyService:
    """
    Service for managing idempotency keys in the database.

    Handles storage, retrieval, and validation of idempotency keys with request hash verification.
    """

    @staticmethod
    def _compute_request_hash(request_body: str) -> str:
        """Compute SHA256 hash of request body for idempotency verification."""
        return hashlib.sha256(request_body.encode('utf-8')).hexdigest()

    @staticmethod
    def _get_expires_at() -> datetime:
        """Get expiration timestamp for idempotency keys."""
        ttl_hours = getattr(settings, 'IDEMPOTENCY_KEY_TTL_HOURS', 24)
        return datetime.utcnow() + timedelta(hours=ttl_hours)

    async def store_idempotency_response(
        self,
        db: AsyncSession,
        api_key_id: str,
        idempotency_key: str,
        endpoint: str,
        request_body: str,
        response_body: Dict[str, Any],
        response_status_code: int
    ) -> None:
        """
        Store idempotency key with response data.

        Args:
            db: Database session
            api_key_id: API key ID
            idempotency_key: Idempotency key from request header
            endpoint: API endpoint
            request_body: Raw request body as string
            response_body: Response data to cache
            response_status_code: HTTP status code
        """
        request_hash = self._compute_request_hash(request_body)
        expires_at = self._get_expires_at()

        # Check if key already exists
        existing = await self.get_idempotency_response(db, api_key_id, idempotency_key)
        if existing:
            # If exists, verify request hash matches
            if existing['request_hash'] != request_hash:
                raise ValueError("Idempotency key already exists with different request")
            # Update with new response (in case of retry)
            existing_record = await db.execute(
                select(IdempotencyKey).where(
                    IdempotencyKey.api_key_id == api_key_id,
                    IdempotencyKey.idempotency_key == idempotency_key
                )
            )
            record = existing_record.scalar_one()
            record.response_body = json.dumps(response_body)
            record.response_status_code = response_status_code
        else:
            # Create new record
            idempotency_record = IdempotencyKey(
                api_key_id=api_key_id,
                idempotency_key=idempotency_key,
                endpoint=endpoint,
                request_hash=request_hash,
                response_body=json.dumps(response_body),
                response_status_code=response_status_code,
                expires_at=expires_at
            )
            db.add(idempotency_record)

    async def get_idempotency_response(
        self,
        db: AsyncSession,
        api_key_id: str,
        idempotency_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached idempotency response.

        Args:
            db: Database session
            api_key_id: API key ID
            idempotency_key: Idempotency key from request header

        Returns:
            Cached response data or None if not found/expired
        """
        result = await db.execute(
            select(IdempotencyKey).where(
                IdempotencyKey.api_key_id == api_key_id,
                IdempotencyKey.idempotency_key == idempotency_key,
                IdempotencyKey.expires_at > datetime.utcnow()
            )
        )
        record = result.scalar_one_or_none()

        if record and record.response_body:
            return {
                'response_body': json.loads(record.response_body),
                'response_status_code': record.response_status_code,
                'request_hash': record.request_hash,
                'created_at': record.created_at.isoformat()
            }
        return None

    async def validate_request_hash(
        self,
        db: AsyncSession,
        api_key_id: str,
        idempotency_key: str,
        request_body: str
    ) -> bool:
        """
        Validate that request hash matches stored hash for idempotency key.

        Args:
            db: Database session
            api_key_id: API key ID
            idempotency_key: Idempotency key from request header
            request_body: Raw request body as string

        Returns:
            True if hash matches or key doesn't exist

        Raises:
            IdempotencyKeyConflictException: If hash doesn't match
            IdempotencyKeyExpiredException: If key exists but is expired
        """
        result = await db.execute(
            select(IdempotencyKey).where(
                IdempotencyKey.api_key_id == api_key_id,
                IdempotencyKey.idempotency_key == idempotency_key
            )
        )
        record = result.scalar_one_or_none()

        if record:
            # Check if key has expired
            if record.expires_at <= datetime.utcnow():
                raise IdempotencyKeyExpiredException(idempotency_key)

            # Check hash match
            current_hash = self._compute_request_hash(request_body)
            if current_hash != record.request_hash:
                raise IdempotencyKeyConflictException(idempotency_key)

        return True  # Key doesn't exist or validation passed

    async def cleanup_expired_keys(self, db: AsyncSession) -> int:
        """
        Remove expired idempotency keys from database.

        Args:
            db: Database session

        Returns:
            Number of keys deleted
        """
        result = await db.execute(
            delete(IdempotencyKey).where(IdempotencyKey.expires_at <= datetime.utcnow())
        )
        deleted_count = result.rowcount
        return deleted_count

    def is_idempotency_required(self, endpoint: str) -> bool:
        """
        Check if idempotency is required for the given endpoint.

        Args:
            endpoint: API endpoint path (may include HTTP method)

        Returns:
            True if idempotency key is required
        """
        required_endpoints = getattr(settings, 'IDEMPOTENCY_KEY_REQUIRED_ENDPOINTS', [
            "/v1/payments/orders",
            "/v1/refunds",
            "/v1/subscriptions"
        ])

        # Check if endpoint matches any required pattern (ignore HTTP method)
        endpoint_path = endpoint.replace('POST ', '').replace('GET ', '').replace('PUT ', '').replace('DELETE ', '')

        for required in required_endpoints:
            # Also handle the case where required endpoint includes method
            required_path = required.replace('POST ', '').replace('GET ', '').replace('PUT ', '').replace('DELETE ', '')
            if endpoint_path == required_path:
                return True
        return False