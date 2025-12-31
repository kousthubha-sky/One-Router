"""
Unit Tests for Service Registry

Tests service definitions and schema validation.
"""

import pytest
from app.services.registry.service_definitions import SERVICE_REGISTRY


class TestServiceRegistry:
    """Unit tests for service registry definitions"""

    def test_twilio_service_definition_exists(self):
        """Test: Twilio service is defined"""
        assert "twilio" in SERVICE_REGISTRY
        assert SERVICE_REGISTRY["twilio"]["category"] == "communications"
        assert SERVICE_REGISTRY["twilio"]["subcategory"] == "sms"

    def test_resend_service_definition_exists(self):
        """Test: Resend service is defined"""
        assert "resend" in SERVICE_REGISTRY
        assert SERVICE_REGISTRY["resend"]["category"] == "communications"
        assert SERVICE_REGISTRY["resend"]["subcategory"] == "email"

    def test_twilio_credentials_schema(self):
        """Test: Twilio has required credentials"""
        creds = SERVICE_REGISTRY["twilio"]["credentials_schema"]

        assert "account_sid" in creds
        assert creds["account_sid"]["type"] == "string"
        assert creds["account_sid"]["required"] is True

        assert "auth_token" in creds
        assert creds["auth_token"]["type"] == "string"
        assert creds["auth_token"]["required"] is True
        assert creds["auth_token"]["secret"] is True

        assert "from_number" in creds
        assert creds["from_number"]["type"] == "phone"
        assert creds["from_number"]["required"] is True

    def test_resend_credentials_schema(self):
        """Test: Resend has required credentials"""
        creds = SERVICE_REGISTRY["resend"]["credentials_schema"]

        assert "api_key" in creds
        assert creds["api_key"]["type"] == "string"
        assert creds["api_key"]["required"] is True
        assert creds["api_key"]["secret"] is True

        assert "from_email" in creds
        assert creds["from_email"]["type"] == "email"
        assert creds["from_email"]["required"] is True

    def test_twilio_endpoints(self):
        """Test: Twilio has SMS endpoints"""
        endpoints = SERVICE_REGISTRY["twilio"]["endpoints"]

        assert "send_sms" in endpoints
        assert endpoints["send_sms"]["method"] == "POST"
        assert "Messages.json" in endpoints["send_sms"]["path"]

        assert "get_sms" in endpoints
        assert endpoints["get_sms"]["method"] == "GET"

    def test_resend_endpoints(self):
        """Test: Resend has email endpoints"""
        endpoints = SERVICE_REGISTRY["resend"]["endpoints"]

        assert "send_email" in endpoints
        assert endpoints["send_email"]["method"] == "POST"
        assert endpoints["send_email"]["path"] == "/emails"

    def test_twilio_pricing(self):
        """Test: Twilio has pricing defined"""
        pricing = SERVICE_REGISTRY["twilio"]["pricing"]

        assert "send_sms" in pricing
        assert pricing["send_sms"]["base"] == 0.0079
        assert pricing["send_sms"]["unit"] == "per_message"
        assert pricing["send_sms"]["currency"] == "USD"

    def test_resend_pricing(self):
        """Test: Resend has pricing defined"""
        pricing = SERVICE_REGISTRY["resend"]["pricing"]

        assert "send_email" in pricing
        assert pricing["send_email"]["base"] == 0.0001
        assert pricing["send_email"]["unit"] == "per_email"
        assert pricing["send_email"]["currency"] == "USD"

    def test_twilio_webhook_config(self):
        """Test: Twilio has webhook verification"""
        webhooks = SERVICE_REGISTRY["twilio"]["webhooks"]

        assert "signature_header" in webhooks
        assert webhooks["signature_header"] == "X-Twilio-Signature"
        assert webhooks["verification_method"] == "sha256_hmac"
        assert "message.sent" in webhooks["events"]

    def test_resend_webhook_config(self):
        """Test: Resend has webhook verification"""
        webhooks = SERVICE_REGISTRY["resend"]["webhooks"]

        assert "signature_header" in webhooks
        assert webhooks["signature_header"] == "Resend-Signature"
        assert "email.sent" in webhooks["events"]

    def test_twilio_rate_limits(self):
        """Test: Twilio has rate limits defined"""
        rate_limits = SERVICE_REGISTRY["twilio"]["rate_limits"]

        assert "requests_per_second" in rate_limits
        assert rate_limits["requests_per_second"] == 10

    def test_resend_rate_limits(self):
        """Test: Resend has rate limits defined"""
        rate_limits = SERVICE_REGISTRY["resend"]["rate_limits"]

        assert "requests_per_second" in rate_limits
        assert rate_limits["requests_per_second"] == 10

    def test_all_required_fields_present_twilio(self):
        """Test: Twilio has all required fields"""
        required = ["category", "subcategory", "auth_type", "base_url",
                    "credentials_schema", "endpoints", "pricing", "webhooks"]

        twilio = SERVICE_REGISTRY["twilio"]
        for field in required:
            assert field in twilio, f"Missing field: {field}"

    def test_all_required_fields_present_resend(self):
        """Test: Resend has all required fields"""
        required = ["category", "subcategory", "auth_type", "base_url",
                    "credentials_schema", "endpoints", "pricing", "webhooks"]

        resend = SERVICE_REGISTRY["resend"]
        for field in required:
            assert field in resend, f"Missing field: {field}"

    def test_endpoint_parameter_mapping_twilio(self):
        """Test: Twilio endpoint has parameter mapping"""
        endpoint = SERVICE_REGISTRY["twilio"]["endpoints"]["send_sms"]

        assert "params" in endpoint
        assert "To" in endpoint["params"]
        assert "From" in endpoint["params"]
        assert "Body" in endpoint["params"]

    def test_endpoint_response_mapping_twilio(self):
        """Test: Twilio endpoint has response mapping"""
        endpoint = SERVICE_REGISTRY["twilio"]["endpoints"]["send_sms"]

        assert "response_mapping" in endpoint
        assert "id" in endpoint["response_mapping"]
        assert "status" in endpoint["response_mapping"]
        assert endpoint["response_mapping"]["id"] == "sid"
