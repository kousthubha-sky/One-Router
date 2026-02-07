import logging
import time
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.services.adapter_factory import AdapterFactory
from app.services.credential_manager import CredentialManager
from app.services.registry import SERVICE_REGISTRY
from app.models import ServiceCredential, TransactionLog
from app.models.user import User

logger = logging.getLogger(__name__)


class FallbackManager:
    """Manages provider fallback and automatic failover"""

    def __init__(self, user_id: str, db: AsyncSession, environment: str = "test"):
        self.user_id = user_id
        self.db = db
        self.environment = environment
        self.credential_manager = CredentialManager()

    async def get_user_providers(self, service_type: str) -> List[Dict[str, Any]]:
        """
        Get configured providers for a service type with their priorities.

        Queries the database for active credentials, filters by service category,
        and reads priority ordering from user preferences.

        Args:
            service_type: Service category (e.g., 'communications', 'payments')

        Returns:
            List of providers sorted by priority
        """
        # Build a set of provider names that belong to this service_type
        category_providers = set()
        for service_name, config in SERVICE_REGISTRY.items():
            if config.get("category") == service_type:
                category_providers.add(service_name)

        # Query DB for user's active credentials in the current environment
        result = await self.db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == self.user_id,
                ServiceCredential.is_active == True,
                ServiceCredential.environment == self.environment
            )
        )
        credentials = result.scalars().all()

        # Also check the opposite environment as fallback
        opposite_env = "live" if self.environment == "test" else "test"
        result_fallback = await self.db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == self.user_id,
                ServiceCredential.is_active == True,
                ServiceCredential.environment == opposite_env
            )
        )
        fallback_credentials = result_fallback.scalars().all()

        # Collect all provider names the user has credentials for
        configured_providers = set()
        for cred in credentials:
            if cred.provider_name in category_providers:
                configured_providers.add(cred.provider_name)
        for cred in fallback_credentials:
            if cred.provider_name in category_providers:
                configured_providers.add(cred.provider_name)

        if not configured_providers:
            return []

        # Get user's priority preferences
        user_result = await self.db.execute(
            select(User.preferences).where(User.id == self.user_id)
        )
        preferences = user_result.scalar_one_or_none() or {}
        provider_priorities = preferences.get("provider_priorities", {}).get(service_type, {})

        # Build provider list with priorities
        providers = []
        for provider_name in configured_providers:
            priority = provider_priorities.get(provider_name, 99)
            providers.append({
                "provider": provider_name,
                "priority": priority,
                "enabled": True
            })

        # Sort by priority (lower = higher priority)
        return sorted(providers, key=lambda x: x["priority"])

    async def get_credentials(self, provider_name: str) -> Dict[str, str]:
        """
        Get user's decrypted credentials for a specific provider.

        Tries the preferred environment first, falls back to opposite.

        Args:
            provider_name: Name of the provider (e.g., 'twilio')

        Returns:
            Dictionary of decrypted credentials, or empty dict if not found
        """
        # Try preferred environment first
        creds = await self.credential_manager.get_credentials(
            db=self.db,
            user_id=self.user_id,
            provider_name=provider_name,
            environment=self.environment
        )
        if creds:
            return creds

        # Fall back to opposite environment
        opposite_env = "live" if self.environment == "test" else "test"
        creds = await self.credential_manager.get_credentials(
            db=self.db,
            user_id=self.user_id,
            provider_name=provider_name,
            environment=opposite_env
        )
        return creds or {}

    async def execute_with_fallback(
        self,
        service_type: str,
        action: str,
        params: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Try providers in order until one succeeds

        Args:
            service_type: Category of service (e.g., 'communications')
            action: Action to execute (e.g., 'send_sms', 'send_email')
            params: Parameters for the action

        Returns:
            Response from successful provider

        Raises:
            AllProvidersFailed: If all configured providers fail
        """
        providers = await self.get_user_providers(service_type)

        if not providers:
            raise NoProvidersConfigured(
                f"No {service_type} providers configured for user {self.user_id}"
            )

        last_error = None

        for provider in providers:
            if not provider.get("enabled"):
                logger.info(f"Skipping disabled provider: {provider['provider']}")
                continue

            try:
                logger.info(f"Attempting {service_type} with provider: {provider['provider']}")
                start_time = time.time()

                # Get credentials for this provider
                credentials = await self.get_credentials(provider["provider"])

                if not credentials:
                    logger.warning(f"No credentials found for {provider['provider']}")
                    continue

                # Create adapter using factory
                adapter = AdapterFactory.create_adapter(provider["provider"], credentials)

                # Execute the action
                result = await adapter.execute(action, params)

                response_time_ms = int((time.time() - start_time) * 1000)

                # Log successful provider usage
                await self.log_provider_success(
                    provider["provider"],
                    action,
                    params,
                    response_time_ms
                )

                logger.info(f"[OK] {service_type} successful with {provider['provider']} in {response_time_ms}ms")
                return result

            except Exception as e:
                last_error = e
                response_time_ms = int((time.time() - start_time) * 1000)
                logger.warning(
                    f"[FAIL] {provider['provider']} failed: {str(e)}, trying next..."
                )
                await self.log_provider_failure(
                    provider["provider"],
                    action,
                    str(e),
                    response_time_ms
                )
                continue

        # All providers failed
        raise AllProvidersFailed(
            f"All {service_type} providers failed. Last error: {str(last_error)}"
        )

    async def log_provider_success(
        self,
        provider: str,
        action: str,
        params: Dict[str, Any],
        response_time_ms: int = 0
    ):
        """Log successful provider usage to transaction_logs"""
        import uuid
        from datetime import datetime

        try:
            transaction = TransactionLog(
                user_id=self.user_id,
                transaction_id=f"fallback_{uuid.uuid4().hex[:16]}",
                service_name=provider,
                endpoint=f"/fallback/{action}",
                http_method="POST",
                request_payload=params,
                response_status=200,
                response_time_ms=response_time_ms,
                status="success",
                environment=self.environment,
                created_at=datetime.utcnow()
            )
            self.db.add(transaction)
            await self.db.commit()
        except Exception as e:
            logger.error(f"Failed to log provider success: {e}")

    async def log_provider_failure(
        self,
        provider: str,
        action: str,
        error: str,
        response_time_ms: int = 0
    ):
        """Log provider failure to transaction_logs"""
        import uuid
        from datetime import datetime

        try:
            transaction = TransactionLog(
                user_id=self.user_id,
                transaction_id=f"fallback_{uuid.uuid4().hex[:16]}",
                service_name=provider,
                endpoint=f"/fallback/{action}",
                http_method="POST",
                response_status=500,
                response_time_ms=response_time_ms,
                status="failed",
                error_message=error,
                environment=self.environment,
                created_at=datetime.utcnow()
            )
            self.db.add(transaction)
            await self.db.commit()
        except Exception as e:
            logger.error(f"Failed to log provider failure: {e}")

    async def get_provider_health_status(
        self,
        service_type: str
    ) -> Dict[str, Dict[str, Any]]:
        """
        Get health status of all configured providers for a service type

        Args:
            service_type: Category of service

        Returns:
            Dictionary mapping provider names to their health status
        """
        providers = await self.get_user_providers(service_type)
        health_status = {}

        for provider in providers:
            if not provider.get("enabled"):
                health_status[provider["provider"]] = {
                    "status": "disabled",
                    "enabled": False
                }
                continue

            try:
                credentials = await self.get_credentials(provider["provider"])
                adapter = AdapterFactory.create_adapter(provider["provider"], credentials)

                # Validate credentials (basic health check)
                is_valid = await adapter.validate_credentials()

                health_status[provider["provider"]] = {
                    "status": "healthy" if is_valid else "unhealthy",
                    "enabled": True,
                    "priority": provider.get("priority", 1)
                }

            except Exception as e:
                health_status[provider["provider"]] = {
                    "status": "error",
                    "error": str(e),
                    "enabled": True,
                    "priority": provider.get("priority", 1)
                }

        return health_status


class AllProvidersFailed(Exception):
    """Raised when all configured providers fail"""
    pass


class NoProvidersConfigured(Exception):
    """Raised when no providers are configured for a service type"""
    pass
