"""
GDPR Compliance Service
Handles data export and deletion requests.
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from .audit_service import AuditService, AuditAction

logger = logging.getLogger(__name__)


class GDPRService:
    """
    Service for GDPR compliance operations.

    Supports:
    - Right to access (data export)
    - Right to erasure (data deletion)
    - Right to data portability (machine-readable export)
    """

    @staticmethod
    async def export_user_data(
        user_id: str,
        db: AsyncSession,
        request: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Export all user data in a portable format.

        Returns a comprehensive data package containing:
        - User profile
        - API keys (without secrets)
        - Service credentials (without secrets)
        - Transaction history
        - Credit balance and transactions
        - Audit logs
        - Webhook configurations
        """
        from ..models import (
            User, ApiKey, ServiceCredential, TransactionLog,
            UserCredit, CreditTransaction, WebhookEvent, AuditLog
        )

        export_data = {
            "export_info": {
                "requested_at": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "format_version": "1.0"
            },
            "profile": {},
            "api_keys": [],
            "service_credentials": [],
            "transactions": [],
            "credits": {},
            "credit_transactions": [],
            "webhook_events": [],
            "audit_logs": []
        }

        try:
            # User profile
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                export_data["profile"] = {
                    "id": str(user.id),
                    "email": user.email,
                    "created_at": user.created_at.isoformat() if user.created_at else None,
                    "preferences": user.preferences
                }

            # API Keys (without secret values)
            result = await db.execute(
                select(ApiKey).where(ApiKey.user_id == user_id)
            )
            api_keys = result.scalars().all()
            export_data["api_keys"] = [
                {
                    "id": str(key.id),
                    "key_name": key.key_name,
                    "key_prefix": key.key_prefix,
                    "environment": key.environment,
                    "is_active": key.is_active,
                    "created_at": key.created_at.isoformat() if key.created_at else None,
                    "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
                }
                for key in api_keys
            ]

            # Service credentials (without secrets)
            result = await db.execute(
                select(ServiceCredential).where(ServiceCredential.user_id == user_id)
            )
            credentials = result.scalars().all()
            export_data["service_credentials"] = [
                {
                    "id": str(cred.id),
                    "provider_name": cred.provider_name,
                    "environment": cred.environment,
                    "is_active": cred.is_active,
                    "created_at": cred.created_at.isoformat() if cred.created_at else None,
                    "features_config": cred.features_config
                }
                for cred in credentials
            ]

            # Transaction logs
            result = await db.execute(
                select(TransactionLog).where(TransactionLog.user_id == user_id)
            )
            transactions = result.scalars().all()
            export_data["transactions"] = [
                {
                    "id": str(tx.id),
                    "transaction_id": tx.transaction_id,
                    "service_name": tx.service_name,
                    "endpoint": tx.endpoint,
                    "status": tx.status,
                    "created_at": tx.created_at.isoformat() if tx.created_at else None,
                }
                for tx in transactions
            ]

            # Credits
            result = await db.execute(
                select(UserCredit).where(UserCredit.user_id == user_id)
            )
            credit = result.scalar_one_or_none()
            if credit:
                export_data["credits"] = {
                    "balance": credit.balance,
                    "total_purchased": credit.total_purchased,
                    "total_consumed": credit.total_consumed,
                    "created_at": credit.created_at.isoformat() if credit.created_at else None
                }

            # Credit transactions
            result = await db.execute(
                select(CreditTransaction).where(CreditTransaction.user_id == user_id)
            )
            credit_txs = result.scalars().all()
            export_data["credit_transactions"] = [
                {
                    "id": str(tx.id),
                    "amount": tx.amount,
                    "transaction_type": tx.transaction_type.value if tx.transaction_type else None,
                    "description": tx.description,
                    "created_at": tx.created_at.isoformat() if tx.created_at else None
                }
                for tx in credit_txs
            ]

            # Webhook events
            result = await db.execute(
                select(WebhookEvent).where(WebhookEvent.user_id == user_id)
            )
            webhooks = result.scalars().all()
            export_data["webhook_events"] = [
                {
                    "id": str(wh.id),
                    "service_name": wh.service_name,
                    "event_type": wh.event_type,
                    "processed": wh.processed,
                    "created_at": wh.created_at.isoformat() if wh.created_at else None
                }
                for wh in webhooks
            ]

            # Audit logs
            result = await db.execute(
                select(AuditLog).where(AuditLog.user_id == user_id)
            )
            audit_logs = result.scalars().all()
            export_data["audit_logs"] = [
                {
                    "id": str(log.id),
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "created_at": log.created_at.isoformat() if log.created_at else None,
                    "ip_address": log.ip_address
                }
                for log in audit_logs
            ]

            # Log the export
            await AuditService.log(
                db=db,
                user_id=user_id,
                action=AuditAction.DATA_EXPORTED,
                resource_type="user_data",
                request=request,
                details={"record_counts": {
                    "api_keys": len(export_data["api_keys"]),
                    "credentials": len(export_data["service_credentials"]),
                    "transactions": len(export_data["transactions"]),
                    "credit_transactions": len(export_data["credit_transactions"]),
                    "webhook_events": len(export_data["webhook_events"]),
                    "audit_logs": len(export_data["audit_logs"])
                }}
            )

            return export_data

        except Exception as e:
            logger.error(f"GDPR export failed for user {user_id}: {e}")
            raise

    @staticmethod
    async def delete_user_data(
        user_id: str,
        db: AsyncSession,
        request: Optional[Any] = None,
        keep_audit_logs: bool = True
    ) -> Dict[str, Any]:
        """
        Delete all user data (Right to Erasure).

        By default, keeps audit logs for compliance (can be overridden).

        Returns summary of deleted records.
        """
        from ..models import (
            User, ApiKey, ServiceCredential, TransactionLog,
            UserCredit, CreditTransaction, WebhookEvent, AuditLog,
            OneRouterPayment
        )

        deleted_counts = {}

        try:
            # Delete in order of dependencies

            # 1. Webhook events
            result = await db.execute(
                delete(WebhookEvent).where(WebhookEvent.user_id == user_id)
            )
            deleted_counts["webhook_events"] = result.rowcount

            # 2. Transaction logs
            result = await db.execute(
                delete(TransactionLog).where(TransactionLog.user_id == user_id)
            )
            deleted_counts["transaction_logs"] = result.rowcount

            # 3. Credit transactions
            result = await db.execute(
                delete(CreditTransaction).where(CreditTransaction.user_id == user_id)
            )
            deleted_counts["credit_transactions"] = result.rowcount

            # 4. User credits
            result = await db.execute(
                delete(UserCredit).where(UserCredit.user_id == user_id)
            )
            deleted_counts["user_credits"] = result.rowcount

            # 5. Payments
            result = await db.execute(
                delete(OneRouterPayment).where(OneRouterPayment.user_id == user_id)
            )
            deleted_counts["payments"] = result.rowcount

            # 6. Service credentials
            result = await db.execute(
                delete(ServiceCredential).where(ServiceCredential.user_id == user_id)
            )
            deleted_counts["service_credentials"] = result.rowcount

            # 7. API keys
            result = await db.execute(
                delete(ApiKey).where(ApiKey.user_id == user_id)
            )
            deleted_counts["api_keys"] = result.rowcount

            # 8. Audit logs (optional - kept for compliance by default)
            if not keep_audit_logs:
                result = await db.execute(
                    delete(AuditLog).where(AuditLog.user_id == user_id)
                )
                deleted_counts["audit_logs"] = result.rowcount
            else:
                deleted_counts["audit_logs"] = 0
                deleted_counts["audit_logs_retained"] = True

            # 9. User profile
            result = await db.execute(
                delete(User).where(User.id == user_id)
            )
            deleted_counts["user_profile"] = result.rowcount

            # Commit all deletions
            await db.commit()

            # Log deletion (before user is deleted, we log to a system audit)
            # This log entry references the deleted user_id for compliance
            logger.info(
                "GDPR deletion completed",
                extra={
                    "user_id": user_id,
                    "deleted_counts": deleted_counts,
                    "action": "gdpr_deletion"
                }
            )

            return {
                "status": "completed",
                "user_id": user_id,
                "deleted_at": datetime.utcnow().isoformat(),
                "deleted_counts": deleted_counts
            }

        except Exception as e:
            await db.rollback()
            logger.error(f"GDPR deletion failed for user {user_id}: {e}")
            raise

    @staticmethod
    async def anonymize_user_data(
        user_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """
        Anonymize user data instead of deleting.

        Useful when you need to keep transaction records but
        remove personally identifiable information.
        """
        from ..models import User, ApiKey

        try:
            # Anonymize user profile
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()

            if user:
                user.email = f"deleted-{user_id[:8]}@anonymized.local"
                user.preferences = {}

            # Anonymize API key names
            result = await db.execute(
                select(ApiKey).where(ApiKey.user_id == user_id)
            )
            api_keys = result.scalars().all()
            for key in api_keys:
                key.key_name = f"deleted-key-{key.id}"
                key.is_active = False

            await db.commit()

            return {
                "status": "anonymized",
                "user_id": user_id,
                "anonymized_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            await db.rollback()
            logger.error(f"GDPR anonymization failed for user {user_id}: {e}")
            raise
