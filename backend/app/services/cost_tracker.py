import logging
from typing import Dict, Any
from .registry import SERVICE_REGISTRY

logger = logging.getLogger(__name__)


class CostTracker:
    """Tracks costs based on service registry pricing"""

    def __init__(self):
        self.service_registry = SERVICE_REGISTRY

    async def calculate_cost(
        self,
        service_name: str,
        action: str,
        params: Dict[str, Any] = None
    ) -> float:
        """
        Calculate cost for a service action

        Args:
            service_name: Name of the service (e.g., 'twilio', 'resend')
            action: Action being performed (e.g., 'send_sms', 'send_email')
            params: Parameters for the action (for quantity-based pricing)

        Returns:
            Cost in USD
        """
        if service_name not in self.service_registry:
            logger.warning(f"Service '{service_name}' not in registry, cost = 0.0")
            return 0.0

        service_def = self.service_registry[service_name]
        pricing = service_def.get("pricing", {})
        action_pricing = pricing.get(action)

        if not action_pricing:
            # No pricing defined for this action
            return 0.0

        base_cost = action_pricing.get("base", 0.0)
        unit = action_pricing.get("unit", "per_request")

        # Different pricing models
        if unit == "per_message" or unit == "per_email" or unit == "per_request":
            return base_cost
        elif unit == "per_minute":
            return base_cost
        elif unit == "per_mb":
            # Calculate based on message size if provided
            size_mb = params.get("size_mb", 1.0) if params else 1.0
            return base_cost * size_mb
        else:
            return base_cost

    async def get_action_pricing(
        self,
        service_name: str,
        action: str
    ) -> Dict[str, Any]:
        """
        Get pricing information for a specific action

        Args:
            service_name: Name of service
            action: Action name

        Returns:
            Pricing details
        """
        if service_name not in self.service_registry:
            return {}

        service_def = self.service_registry[service_name]
        pricing = service_def.get("pricing", {})
        action_pricing = pricing.get(action)

        if not action_pricing:
            return {"available": False}

        return {
            "available": True,
            "base_cost": action_pricing.get("base"),
            "unit": action_pricing.get("unit"),
            "currency": action_pricing.get("currency", "USD")
        }

    async def get_all_pricing(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all pricing information from the registry

        Returns:
            Dictionary mapping service names to their pricing
        """
        all_pricing = {}

        for service_name, service_def in self.service_registry.items():
            service_pricing = service_def.get("pricing", {})
            all_pricing[service_name] = {
                "category": service_def.get("category"),
                "actions": list(service_pricing.keys()),
                "details": service_pricing
            }

        return all_pricing

    def estimate_monthly_cost(
        self,
        service_name: str,
        action: str,
        expected_usage: int
    ) -> Dict[str, Any]:
        """
        Estimate monthly cost based on expected usage

        Args:
            service_name: Name of service
            action: Action being performed
            expected_usage: Expected number of operations per month

        Returns:
            Cost estimate breakdown
        """
        if service_name not in self.service_registry:
            return {"error": "Service not found"}

        service_def = self.service_registry[service_name]
        pricing = service_def.get("pricing", {})
        action_pricing = pricing.get(action)

        if not action_pricing:
            return {"error": "Pricing not defined for this action"}

        base_cost = action_pricing.get("base", 0.0)
        monthly_cost = base_cost * expected_usage

        return {
            "service": service_name,
            "action": action,
            "expected_usage": expected_usage,
            "unit_cost": base_cost,
            "currency": action_pricing.get("currency", "USD"),
            "estimated_monthly_cost": monthly_cost,
            "cost_breakdown": {
                "daily": monthly_cost / 30,
                "weekly": monthly_cost / 4,
                "yearly": monthly_cost * 12
            }
        }


cost_tracker = CostTracker()
