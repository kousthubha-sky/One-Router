#!/usr/bin/env python3
"""
Background cleanup job for expired idempotency keys.
Run this periodically (e.g., via cron or scheduled task) to clean up expired records.
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.database import async_session
from app.services.idempotency_service import IdempotencyService


async def cleanup_expired_idempotency_keys():
    """Clean up expired idempotency keys from the database"""
    async with async_session() as db:
        service = IdempotencyService()

        try:
            deleted_count = await service.cleanup_expired_keys(db)
            print(f"Cleaned up {deleted_count} expired idempotency keys")

            # Commit the transaction
            await db.commit()

        except Exception as e:
            print(f"Error during cleanup: {e}")
            await db.rollback()


if __name__ == "__main__":
    asyncio.run(cleanup_expired_idempotency_keys())