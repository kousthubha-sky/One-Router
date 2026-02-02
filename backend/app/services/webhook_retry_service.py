"""
Webhook Retry Service
Handles failed webhook deliveries with exponential backoff.
"""

import asyncio
import logging
import httpx
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from enum import Enum
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_

logger = logging.getLogger(__name__)


class WebhookStatus(str, Enum):
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    RETRYING = "retrying"
    EXHAUSTED = "exhausted"  # Max retries reached


class WebhookRetryConfig:
    """Configuration for webhook retry behavior."""
    MAX_RETRIES = 5
    INITIAL_DELAY_SECONDS = 60  # 1 minute
    MAX_DELAY_SECONDS = 3600  # 1 hour
    BACKOFF_MULTIPLIER = 2
    TIMEOUT_SECONDS = 30


class WebhookRetryService:
    """
    Service for managing webhook retries with exponential backoff.

    Retry schedule with default config:
    - Attempt 1: Immediate
    - Attempt 2: 1 minute later
    - Attempt 3: 2 minutes later
    - Attempt 4: 4 minutes later
    - Attempt 5: 8 minutes later
    - Attempt 6: 16 minutes later (max)

    After MAX_RETRIES, webhook is marked as EXHAUSTED.
    """

    @staticmethod
    def calculate_next_retry(attempt: int) -> datetime:
        """Calculate the next retry time based on attempt number."""
        delay = min(
            WebhookRetryConfig.INITIAL_DELAY_SECONDS * (WebhookRetryConfig.BACKOFF_MULTIPLIER ** attempt),
            WebhookRetryConfig.MAX_DELAY_SECONDS
        )
        return datetime.utcnow() + timedelta(seconds=delay)

    @staticmethod
    async def queue_webhook(
        db: AsyncSession,
        user_id: str,
        webhook_url: str,
        payload: Dict[str, Any],
        event_type: str,
        service_name: str,
        idempotency_key: Optional[str] = None
    ) -> str:
        """
        Queue a webhook for delivery.

        Returns the webhook queue entry ID.
        """
        from ..models import WebhookQueue

        entry = WebhookQueue(
            user_id=user_id,
            webhook_url=webhook_url,
            payload=payload,
            event_type=event_type,
            service_name=service_name,
            idempotency_key=idempotency_key,
            status=WebhookStatus.PENDING.value,
            attempt_count=0,
            next_attempt_at=datetime.utcnow()
        )

        db.add(entry)
        await db.commit()
        await db.refresh(entry)

        logger.info(
            f"Webhook queued",
            extra={
                "webhook_id": str(entry.id),
                "event_type": event_type,
                "service": service_name
            }
        )

        return str(entry.id)

    @staticmethod
    async def deliver_webhook(
        webhook_url: str,
        payload: Dict[str, Any],
        headers: Optional[Dict[str, str]] = None
    ) -> tuple[bool, int, Optional[str]]:
        """
        Attempt to deliver a webhook.

        Returns:
            (success: bool, status_code: int, error_message: Optional[str])
        """
        default_headers = {
            "Content-Type": "application/json",
            "User-Agent": "OneRouter-Webhook/1.0",
            "X-Webhook-Timestamp": datetime.utcnow().isoformat()
        }

        if headers:
            default_headers.update(headers)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json=payload,
                    headers=default_headers,
                    timeout=WebhookRetryConfig.TIMEOUT_SECONDS
                )

                # 2xx status codes are success
                if 200 <= response.status_code < 300:
                    return True, response.status_code, None

                # 4xx errors (except 429) are permanent failures - don't retry
                if 400 <= response.status_code < 500 and response.status_code != 429:
                    return False, response.status_code, f"Client error: {response.status_code}"

                # 5xx or 429 are retryable
                return False, response.status_code, f"Server error: {response.status_code}"

        except httpx.TimeoutException:
            return False, 0, "Timeout"
        except httpx.ConnectError as e:
            return False, 0, f"Connection error: {str(e)}"
        except Exception as e:
            return False, 0, f"Unexpected error: {str(e)}"

    @staticmethod
    async def process_pending_webhooks(
        db: AsyncSession,
        batch_size: int = 50
    ) -> Dict[str, int]:
        """
        Process pending webhooks that are due for delivery.

        This should be called by a background worker/cron job.

        Returns counts of processed webhooks by status.
        """
        from ..models import WebhookQueue

        results = {
            "delivered": 0,
            "failed": 0,
            "retrying": 0,
            "exhausted": 0
        }

        # Get pending webhooks that are due
        query = select(WebhookQueue).where(
            and_(
                WebhookQueue.status.in_([WebhookStatus.PENDING.value, WebhookStatus.RETRYING.value]),
                WebhookQueue.next_attempt_at <= datetime.utcnow()
            )
        ).limit(batch_size)

        result = await db.execute(query)
        webhooks = result.scalars().all()

        for webhook in webhooks:
            success, status_code, error = await WebhookRetryService.deliver_webhook(
                webhook_url=webhook.webhook_url,
                payload=webhook.payload,
                headers={"X-Webhook-ID": str(webhook.id)}
            )

            webhook.attempt_count += 1
            webhook.last_attempt_at = datetime.utcnow()
            webhook.last_status_code = status_code
            webhook.last_error = error

            if success:
                webhook.status = WebhookStatus.DELIVERED.value
                webhook.delivered_at = datetime.utcnow()
                results["delivered"] += 1
                logger.info(
                    "Webhook delivered",
                    extra={"webhook_id": str(webhook.id), "attempts": webhook.attempt_count}
                )

            elif webhook.attempt_count >= WebhookRetryConfig.MAX_RETRIES:
                webhook.status = WebhookStatus.EXHAUSTED.value
                results["exhausted"] += 1
                logger.warning(
                    "Webhook exhausted max retries",
                    extra={
                        "webhook_id": str(webhook.id),
                        "attempts": webhook.attempt_count,
                        "last_error": error
                    }
                )

            else:
                webhook.status = WebhookStatus.RETRYING.value
                webhook.next_attempt_at = WebhookRetryService.calculate_next_retry(webhook.attempt_count)
                results["retrying"] += 1
                logger.info(
                    "Webhook scheduled for retry",
                    extra={
                        "webhook_id": str(webhook.id),
                        "attempt": webhook.attempt_count,
                        "next_attempt": webhook.next_attempt_at.isoformat()
                    }
                )

        await db.commit()
        return results

    @staticmethod
    async def get_webhook_status(
        webhook_id: str,
        db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """Get the status of a queued webhook."""
        from ..models import WebhookQueue

        result = await db.execute(
            select(WebhookQueue).where(WebhookQueue.id == webhook_id)
        )
        webhook = result.scalar_one_or_none()

        if not webhook:
            return None

        return {
            "id": str(webhook.id),
            "status": webhook.status,
            "event_type": webhook.event_type,
            "attempt_count": webhook.attempt_count,
            "next_attempt_at": webhook.next_attempt_at.isoformat() if webhook.next_attempt_at else None,
            "last_attempt_at": webhook.last_attempt_at.isoformat() if webhook.last_attempt_at else None,
            "last_status_code": webhook.last_status_code,
            "last_error": webhook.last_error,
            "delivered_at": webhook.delivered_at.isoformat() if webhook.delivered_at else None
        }

    @staticmethod
    async def retry_webhook(
        webhook_id: str,
        db: AsyncSession
    ) -> bool:
        """Manually retry a failed or exhausted webhook."""
        from ..models import WebhookQueue

        result = await db.execute(
            select(WebhookQueue).where(WebhookQueue.id == webhook_id)
        )
        webhook = result.scalar_one_or_none()

        if not webhook:
            return False

        # Reset for retry
        webhook.status = WebhookStatus.PENDING.value
        webhook.next_attempt_at = datetime.utcnow()
        # Don't reset attempt_count to preserve history

        await db.commit()

        logger.info(
            "Webhook manually queued for retry",
            extra={"webhook_id": webhook_id}
        )

        return True

    @staticmethod
    async def get_failed_webhooks(
        db: AsyncSession,
        user_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get failed/exhausted webhooks for monitoring."""
        from ..models import WebhookQueue
        from sqlalchemy import desc

        query = select(WebhookQueue).where(
            WebhookQueue.status.in_([WebhookStatus.FAILED.value, WebhookStatus.EXHAUSTED.value])
        )

        if user_id:
            query = query.where(WebhookQueue.user_id == user_id)

        query = query.order_by(desc(WebhookQueue.created_at)).limit(limit)

        result = await db.execute(query)
        webhooks = result.scalars().all()

        return [
            {
                "id": str(wh.id),
                "event_type": wh.event_type,
                "service_name": wh.service_name,
                "status": wh.status,
                "attempt_count": wh.attempt_count,
                "last_error": wh.last_error,
                "created_at": wh.created_at.isoformat()
            }
            for wh in webhooks
        ]
