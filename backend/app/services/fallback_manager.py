import logging
from typing import List, Dict, Any, Optional
from app.services.adapter_factory import AdapterFactory
from app.services.registry import SERVICE_REGISTRY

logger = logging.getLogger(__name__)


class FallbackManager:
    """Manages provider fallback and automatic failover"""

    def __init__(self, user_id: str, db):
        self.user_id = user_id
        self.db = db

    async def get_user_providers(self, service_type: str) -> List[Dict[str, Any]]:
        """
        Get configured providers for a service type with their priorities

        Args:
            service_type: Service category (e.g., 'communications')

        Returns:
            List of providers sorted by priority
        """
        # TODO: Implement database query to get user's provider configurations
        # For now, return default providers from registry
        providers = []

        for service_name, config in SERVICE_REGISTRY.items():
            if config.get("category") == service_type:
                providers.append({
                    "provider": service_name,
                    "priority": 1,  # Default priority
                    "enabled": True
                })

        # Sort by priority
        return sorted(providers, key=lambda x: x["priority"])

    async def get_credentials(self, provider_name: str) -> Dict[str, str]:
        """
        Get user's credentials for a specific provider

        Args:
            provider_name: Name of the provider (e.g., 'twilio')

        Returns:
            Dictionary of credentials
        """
        # TODO: Implement database query to get user's encrypted credentials
        # For now, return empty dict
        return {}

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

                # Get credentials for this provider
                credentials = await self.get_credentials(provider["provider"])

                if not credentials:
                    logger.warning(f"No credentials found for {provider['provider']}")
                    continue

                # Create adapter using factory
                adapter = AdapterFactory.create_adapter(provider["provider"], credentials)

                # Execute the action
                result = await adapter.execute(action, params)

                # Log successful provider usage
                await self.log_provider_success(
                    provider["provider"],
                    action,
                    params
                )

                logger.info(f"✅ {service_type} successful with {provider['provider']}")
                return result

            except Exception as e:
                last_error = e
                logger.warning(
                    f"❌ {provider['provider']} failed: {str(e)}, trying next..."
                )
                await self.log_provider_failure(
                    provider["provider"],
                    action,
                    str(e)
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
        params: Dict[str, Any]
    ):
        """Log successful provider usage"""
        # TODO: Implement database logging
        logger.info(f"Provider {provider} succeeded for action {action}")
        pass

    async def log_provider_failure(
        self,
        provider: str,
        action: str,
        error: str
    ):
        """Log provider failure"""
        # TODO: Implement database logging
        logger.warning(f"Provider {provider} failed for action {action}: {error}")
        pass

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
