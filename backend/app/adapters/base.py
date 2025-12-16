from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseAdapter(ABC):
    """Abstract base class with generic API proxy support"""

    def __init__(self, credentials: Dict[str, str]):
        self.credentials = credentials
        self.base_url = None

    @abstractmethod
    async def _get_base_url(self) -> str:
        """Return service base URL"""
        pass

    async def call_api(
        self,
        endpoint: str,
        method: str = "POST",
        payload: Dict[str, Any] = None,
        params: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Generic API proxy - call ANY gateway endpoint

        Example:
            adapter.call_api("/v1/subscriptions/sub_123/pause", method="POST")
        """
        base_url = await self._get_base_url()
        full_url = f"{base_url}{endpoint}"

        # Prepare request
        headers = await self._get_auth_headers()

        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == "GET":
                response = await client.get(full_url, params=params, headers=headers)
            elif method == "POST":
                response = await client.post(full_url, json=payload, headers=headers)
            elif method == "PATCH":
                response = await client.patch(full_url, json=payload, headers=headers)
            elif method == "DELETE":
                response = await client.delete(full_url, headers=headers)
            else:
                raise Exception(f"Unsupported method: {method}")

            response.raise_for_status()
            return response.json()

    @abstractmethod
    async def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers for API calls"""
        pass
        self.base_url = None

    @abstractmethod
    async def _get_base_url(self) -> str:
        """Return service base URL"""
        pass

    @abstractmethod
    async def validate_credentials(self) -> bool:
        """Validate stored credentials work"""
        pass

    async def normalize_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Convert unified request to provider format"""
        pass

    async def normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Convert provider response to unified format"""
        pass

    @abstractmethod
    async def get_order(self, order_id: str) -> Dict[str, Any]:
        """Get order details"""
        pass

    async def normalize_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """Convert unified request to provider format"""
        return request

    async def normalize_response(self, response: Dict[str, Any]) -> Dict[str, Any]:
        """Convert provider response to unified format"""
        return response