"""
Unit Tests for Cost Tracker Service

Tests cost calculation logic - fast, no external dependencies.
"""

import pytest
from app.services.cost_tracker import CostTracker
from app.services.registry.service_definitions import SERVICE_REGISTRY


class TestCostTracker:
    """Unit tests for cost calculation logic"""

    @pytest.mark.asyncio
    async def test_calculate_twilio_sms_cost(self):
        """Test: Calculate cost for Twilio SMS"""
        cost = await self.tracker.calculate_cost(
            "twilio",
            "send_sms",
            {"to": "+1234567890", "body": "Test"}
        )

        assert cost == 0.0079  # $0.0079 per SMS

    @pytest.mark.asyncio
    async def test_calculate_resend_email_cost(self):
        """Test: Calculate cost for Resend email"""
        cost = await self.tracker.calculate_cost(
            "resend",
            "send_email",
            {"to": "test@example.com", "subject": "Test"}
        )

        assert cost == 0.0001  # $0.0001 per email

    @pytest.mark.asyncio
    async def test_calculate_unknown_action_cost(self):
        """Test: Return 0 for unknown actions"""
        cost = await self.tracker.calculate_cost(
            "twilio",
            "unknown_action",
            {}
        )

        assert cost == 0.0

    @pytest.mark.asyncio
    async def test_calculate_unknown_service_cost(self):
        """Test: Return 0 for unknown services"""
        cost = await self.tracker.calculate_cost(
            "unknown_service",
            "send_sms",
            {}
        )

        assert cost == 0.0

    @pytest.mark.asyncio
    async def test_get_action_pricing_twilio(self):
        """Test: Get pricing details for Twilio SMS"""
        pricing = await self.tracker.get_action_pricing("twilio", "send_sms")

        assert pricing["available"] is True
        assert pricing["base_cost"] == 0.0079
        assert pricing["unit"] == "per_message"
        assert pricing["currency"] == "USD"

    @pytest.mark.asyncio
    async def test_get_action_pricing_none(self):
        """Test: Return None for non-existent pricing"""
        pricing = await self.tracker.get_action_pricing("unknown", "unknown")

        assert pricing == {}

    @pytest.mark.asyncio
    async def test_get_all_pricing(self):
        """Test: Get all pricing from registry"""
        all_pricing = await self.tracker.get_all_pricing()

        assert "twilio" in all_pricing
        assert "resend" in all_pricing
        assert "send_sms" in all_pricing["twilio"]["actions"]
        assert "send_email" in all_pricing["resend"]["actions"]

    @pytest.mark.asyncio
    async def test_estimate_monthly_cost_twilio(self):
        """Test: Estimate monthly cost for Twilio SMS"""
        estimated = self.tracker.estimate_monthly_cost(
            "twilio",
            "send_sms",
            1000  # 1000 SMS per month
        )

        assert estimated["estimated_monthly_cost"] == 7.9  # $7.90 for 1000 SMS
        assert estimated["currency"] == "USD"

    @pytest.mark.asyncio
    async def test_estimate_monthly_cost_resend(self):
        """Test: Estimate monthly cost for Resend emails"""
        estimated = self.tracker.estimate_monthly_cost(
            "resend",
            "send_email",
            10000  # 10000 emails per month
        )

        assert estimated["estimated_monthly_cost"] == 1.0  # $1.00 for 10000 emails
        assert estimated["currency"] == "USD"

    @pytest.mark.asyncio
    async def test_estimate_monthly_cost_zero_volume(self):
        """Test: Zero volume returns zero cost"""
        estimated = self.tracker.estimate_monthly_cost(
            "twilio",
            "send_sms",
            0
        )

        assert estimated["estimated_monthly_cost"] == 0.0

    @pytest.mark.asyncio
    async def test_pricing_currency_consistency(self):
        """Test: All pricing uses USD currency"""
        all_pricing = await self.tracker.get_all_pricing()

        for service, service_data in all_pricing.items():
            details = service_data["details"]
            for action, pricing in details.items():
                assert pricing["currency"] == "USD", \
                    f"{service}.{action} should use USD currency"

    @pytest.mark.asyncio
    async def test_cost_calculation_is_idempotent(self):
        """Test: Same parameters always return same cost"""
        params = {"to": "+1234567890", "body": "Test"}

        cost1 = await self.tracker.calculate_cost("twilio", "send_sms", params)
        cost2 = await self.tracker.calculate_cost("twilio", "send_sms", params)
        cost3 = await self.tracker.calculate_cost("twilio", "send_sms", params)

        assert cost1 == cost2 == cost3

    def setup_method(self):
        self.tracker = CostTracker()
