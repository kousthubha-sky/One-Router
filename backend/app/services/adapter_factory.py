import httpx
import logging
from typing import Dict, Any, Optional, Tuple
from .registry import SERVICE_REGISTRY

logger = logging.getLogger(__name__)


class AdapterFactory:
    """Factory to auto-generate adapters from service registry definitions"""

    @staticmethod
    def create_adapter(service_name: str, credentials: Dict[str, str]):
        """
        Auto-generate adapter from service registry

        Args:
            service_name: Name of service (e.g., 'twilio', 'resend')
            credentials: Dictionary of credentials for the service

        Returns:
            Adapter instance (BasicAuthAdapter, BearerAuthAdapter, or OAuthAdapter)

        Raises:
            ValueError: If service not found or auth type unsupported
        """
        if service_name not in SERVICE_REGISTRY:
            raise ValueError(f"Service '{service_name}' not found in registry")

        service_def = SERVICE_REGISTRY[service_name]
        auth_type = service_def.get("auth_type", "basic")

        if auth_type == "basic":
            return BasicAuthAdapter(service_name, service_def, credentials)
        elif auth_type == "bearer":
            return BearerAuthAdapter(service_name, service_def, credentials)
        elif auth_type == "oauth":
            return OAuthAdapter(service_name, service_def, credentials)
        else:
            raise ValueError(f"Unsupported auth type: {auth_type}")


class BaseDynamicAdapter:
    """Base class for dynamically generated adapters"""

    def __init__(self, service_name: str, service_def: Dict[str, Any], credentials: Dict[str, str]):
        self.service_name = service_name
        self.service_def = service_def
        self.credentials = credentials
        self.base_url = service_def["base_url"]

    async def _get_base_url(self) -> str:
        return self.service_def["base_url"]

    async def _get_auth_headers(self) -> Dict[str, str]:
        """Override in subclasses"""
        return {}

    async def _map_response(self, response_data: Dict[str, Any], mapping: Dict[str, str]) -> Dict[str, Any]:
        """Map provider response to unified format using response_mapping from service definition"""
        result = {
            "service": self.service_name,
            "provider_data": response_data
        }

        for key, source_key in mapping.items():
            if source_key in response_data:
                result[key] = response_data[source_key]

        return result


class BasicAuthAdapter(BaseDynamicAdapter):
    """Adapter for services using Basic Authentication (e.g., Twilio)"""

    def __init__(self, service_name: str, service_def: Dict[str, Any], credentials: Dict[str, str]):
        super().__init__(service_name, service_def, credentials)
        self._auth: Optional[Tuple[str, str]] = None

    def _get_auth(self) -> Optional[Tuple[str, str]]:
        """Get (username, password) tuple for Basic Auth"""
        if self._auth is None:
            username = self.credentials.get("account_sid", self.credentials.get("api_key", ""))
            password = self.credentials.get("auth_token", self.credentials.get("api_secret", ""))
            self._auth = (username, password) if username and password else None
        return self._auth

    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an action (send SMS, get message, etc.)

        Args:
            action: Name of action from service_def["endpoints"]
            params: Parameters for the action

        Returns:
            Unified response dict
        """
        if action not in self.service_def["endpoints"]:
            raise ValueError(f"Action '{action}' not found for service '{self.service_name}'")

        endpoint = self.service_def["endpoints"][action]

        # Build URL
        url = self.service_def["base_url"] + endpoint["path"]

        # Replace placeholders in URL with credentials
        url = url.format(**self.credentials)

        # Map parameters using endpoint["params"] mapping
        payload = {}
        for api_key, param_key in endpoint["params"].items():
            if param_key in params:
                payload[api_key] = params[param_key]
            elif param_key in self.credentials:
                payload[api_key] = self.credentials[param_key]

        # Get auth tuple
        auth = self._get_auth()
        if not auth:
            raise Exception(f"Invalid credentials for {self.service_name}")

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                if endpoint["method"] == "GET":
                    response = await client.get(url, auth=auth)
                elif endpoint["method"] == "POST":
                    # Twilio uses form-encoded data
                    response = await client.post(url, data=payload, auth=auth)
                else:
                    raise ValueError(f"Unsupported method: {endpoint['method']}")

                response.raise_for_status()
                response_data = response.json()

                # Map response using response_mapping
                return await self._map_response(response_data, endpoint.get("response_mapping", {}))

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error for {self.service_name}.{action}: {e.response.status_code}")
            raise Exception(f"{self.service_name} API error: {e.response.status_code}")
        except httpx.TimeoutException:
            logger.error(f"Timeout for {self.service_name}.{action}")
            raise Exception(f"{self.service_name} API request timed out")
        except Exception as e:
            logger.error(f"Error executing {self.service_name}.{action}: {str(e)}")
            raise

    async def validate_credentials(self) -> bool:
        """Validate credentials by making a minimal API call"""
        try:
            # Try to get account info (lightweight check)
            account_sid = self.credentials.get("account_sid")
            auth_token = self.credentials.get("auth_token")

            if account_sid and auth_token:
                url = f"{self.base_url}/Accounts/{account_sid}.json"

                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(url, auth=(account_sid, auth_token))
                    return response.status_code == 200

            return False

        except Exception as e:
            logger.warning(f"Credentials validation failed for {self.service_name}: {e}")
            return False


class BearerAuthAdapter(BaseDynamicAdapter):
    """Adapter for services using Bearer Token Authentication (e.g., Resend)"""

    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get Bearer token headers"""
        api_key = self.credentials.get("api_key", "")
        return {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute an action with Bearer auth

        Args:
            action: Name of action from service_def["endpoints"]
            params: Parameters for the action

        Returns:
            Unified response dict
        """
        if action not in self.service_def["endpoints"]:
            raise ValueError(f"Action '{action}' not found for service '{self.service_name}'")

        endpoint = self.service_def["endpoints"][action]

        # Build URL
        url = self.service_def["base_url"] + endpoint["path"]

        # Replace placeholders in URL with credentials (if any)
        url = url.format(**self.credentials)

        # Map parameters using endpoint["params"] mapping
        payload = {}
        for api_key, param_key in endpoint["params"].items():
            if param_key in params:
                payload[api_key] = params[param_key]
            elif param_key in self.credentials:
                payload[api_key] = self.credentials[param_key]

        # Get headers
        headers = await self._get_auth_headers()

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                if endpoint["method"] == "POST":
                    response = await client.post(url, json=payload, headers=headers)
                elif endpoint["method"] == "GET":
                    response = await client.get(url, headers=headers)
                else:
                    raise ValueError(f"Unsupported method: {endpoint['method']}")

                response.raise_for_status()
                response_data = response.json()

                # Map response using response_mapping
                return await self._map_response(response_data, endpoint.get("response_mapping", {}))

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error for {self.service_name}.{action}: {e.response.status_code}")
            raise Exception(f"{self.service_name} API error: {e.response.status_code}")
        except httpx.TimeoutException:
            logger.error(f"Timeout for {self.service_name}.{action}")
            raise Exception(f"{self.service_name} API request timed out")
        except Exception as e:
            logger.error(f"Error executing {self.service_name}.{action}: {str(e)}")
            raise

    async def validate_credentials(self) -> bool:
        """Validate Bearer token credentials"""
        try:
            # Most Bearer auth services don't have a lightweight endpoint
            # We'll do basic validation on API key format
            api_key = self.credentials.get("api_key", "")

            # Basic validation: check if API key exists and has correct format
            if not api_key or len(api_key) < 10:
                return False

            return True

        except Exception as e:
            logger.warning(f"Credentials validation failed for {self.service_name}: {e}")
            return False


class OAuthAdapter(BaseDynamicAdapter):
    """Adapter for services using OAuth authentication (placeholder for future)"""

    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get OAuth headers"""
        access_token = self.credentials.get("access_token", "")
        return {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    async def execute(self, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("OAuth adapter not yet implemented")

    async def validate_credentials(self) -> bool:
        raise NotImplementedError("OAuth adapter not yet implemented")
