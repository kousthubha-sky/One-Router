"""
Audit Logging Service
Tracks all sensitive operations for security and compliance.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class AuditAction(str, Enum):
    """Types of auditable actions."""
    # Authentication
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    LOGOUT = "logout"
    API_KEY_CREATED = "api_key_created"
    API_KEY_DELETED = "api_key_deleted"
    API_KEY_DISABLED = "api_key_disabled"

    # Credentials
    CREDENTIALS_ADDED = "credentials_added"
    CREDENTIALS_UPDATED = "credentials_updated"
    CREDENTIALS_DELETED = "credentials_deleted"
    CREDENTIALS_VIEWED = "credentials_viewed"

    # Admin actions
    ADMIN_USER_VIEWED = "admin_user_viewed"
    ADMIN_USER_MODIFIED = "admin_user_modified"
    ADMIN_ENCRYPTION_KEY_ROTATED = "admin_encryption_key_rotated"
    ADMIN_SETTINGS_CHANGED = "admin_settings_changed"

    # Data access
    DATA_EXPORTED = "data_exported"
    DATA_DELETED = "data_deleted"
    GDPR_REQUEST = "gdpr_request"

    # Payments
    PAYMENT_INITIATED = "payment_initiated"
    PAYMENT_COMPLETED = "payment_completed"
    PAYMENT_FAILED = "payment_failed"
    REFUND_INITIATED = "refund_initiated"

    # Webhooks
    WEBHOOK_CONFIGURED = "webhook_configured"
    WEBHOOK_DELETED = "webhook_deleted"

    # Environment
    ENVIRONMENT_SWITCHED = "environment_switched"


class AuditLogEntry(BaseModel):
    """Audit log entry structure."""
    id: str
    timestamp: str
    user_id: str
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    status: str = "success"


class AuditService:
    """
    Service for recording and querying audit logs.

    Usage:
        await AuditService.log(
            db=db,
            user_id=user["id"],
            action=AuditAction.API_KEY_CREATED,
            resource_type="api_key",
            resource_id=key_id,
            request=request,
            details={"key_name": "production-key"}
        )
    """

    @staticmethod
    async def log(
        db: AsyncSession,
        user_id: str,
        action: AuditAction,
        resource_type: str,
        resource_id: Optional[str] = None,
        request: Optional[Any] = None,
        details: Optional[Dict[str, Any]] = None,
        status: str = "success"
    ) -> str:
        """
        Record an audit log entry.

        Returns the audit log entry ID.
        """
        from ..models import AuditLog

        # Extract request info if available
        ip_address = None
        user_agent = None
        if request:
            # Get client IP (handle proxies)
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                ip_address = forwarded.split(",")[0].strip()
            elif request.client:
                ip_address = request.client.host
            user_agent = request.headers.get("user-agent", "")[:500]  # Limit length

        # Sanitize details - remove sensitive data
        safe_details = AuditService._sanitize_details(details) if details else None

        # Create audit log entry
        audit_entry = AuditLog(
            user_id=user_id,
            action=action.value,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=safe_details,
            status=status
        )

        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)

        # Also log to structured logging for real-time monitoring
        logger.info(
            f"Audit: {action.value}",
            extra={
                "audit_id": str(audit_entry.id),
                "user_id": user_id,
                "action": action.value,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "ip_address": ip_address,
                "status": status
            }
        )

        return str(audit_entry.id)

    @staticmethod
    def _sanitize_details(details: Dict[str, Any]) -> Dict[str, Any]:
        """Remove sensitive data from details before logging."""
        sensitive_keys = {
            "password", "secret", "token", "key", "api_key",
            "authorization", "credential", "private", "ssn",
            "credit_card", "card_number", "cvv", "pin"
        }

        sanitized = {}
        for key, value in details.items():
            key_lower = key.lower()
            # Check if key contains sensitive terms
            if any(s in key_lower for s in sensitive_keys):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = AuditService._sanitize_details(value)
            elif isinstance(value, str) and len(value) > 100:
                # Truncate long strings
                sanitized[key] = value[:100] + "..."
            else:
                sanitized[key] = value

        return sanitized

    @staticmethod
    async def get_user_logs(
        db: AsyncSession,
        user_id: str,
        limit: int = 100,
        offset: int = 0,
        action_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get audit logs for a specific user."""
        from ..models import AuditLog
        from sqlalchemy import func, and_

        # Build filter
        filters = [AuditLog.user_id == user_id]
        if action_filter:
            filters.append(AuditLog.action == action_filter)

        # Get total count
        count_query = select(func.count(AuditLog.id)).where(and_(*filters))
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # Get logs
        query = select(AuditLog).where(and_(*filters)).order_by(
            desc(AuditLog.created_at)
        ).limit(limit).offset(offset)

        result = await db.execute(query)
        logs = result.scalars().all()

        return {
            "logs": [
                {
                    "id": str(log.id),
                    "timestamp": log.created_at.isoformat(),
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "ip_address": log.ip_address,
                    "status": log.status,
                    "details": log.details
                }
                for log in logs
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }

    @staticmethod
    async def get_admin_logs(
        db: AsyncSession,
        limit: int = 100,
        offset: int = 0,
        user_id_filter: Optional[str] = None,
        action_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get audit logs for admin review (all users)."""
        from ..models import AuditLog
        from sqlalchemy import func, and_

        # Build filter - only admin actions
        admin_actions = [
            AuditAction.ADMIN_USER_VIEWED.value,
            AuditAction.ADMIN_USER_MODIFIED.value,
            AuditAction.ADMIN_ENCRYPTION_KEY_ROTATED.value,
            AuditAction.ADMIN_SETTINGS_CHANGED.value,
            AuditAction.DATA_EXPORTED.value,
            AuditAction.DATA_DELETED.value,
        ]

        filters = [AuditLog.action.in_(admin_actions)]
        if user_id_filter:
            filters.append(AuditLog.user_id == user_id_filter)
        if action_filter:
            filters.append(AuditLog.action == action_filter)

        # Get total count
        count_query = select(func.count(AuditLog.id)).where(and_(*filters))
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # Get logs
        query = select(AuditLog).where(and_(*filters)).order_by(
            desc(AuditLog.created_at)
        ).limit(limit).offset(offset)

        result = await db.execute(query)
        logs = result.scalars().all()

        return {
            "logs": [
                {
                    "id": str(log.id),
                    "timestamp": log.created_at.isoformat(),
                    "user_id": log.user_id,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "ip_address": log.ip_address,
                    "user_agent": log.user_agent[:100] if log.user_agent else None,
                    "status": log.status,
                    "details": log.details
                }
                for log in logs
            ],
            "total": total,
            "limit": limit,
            "offset": offset
        }
