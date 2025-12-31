"""
Integration Tests for Communications API

Tests API endpoints with mocked external services - fast, no real server needed.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, AsyncMock, patch
from app.main import app


class TestCommunicationsAPIIntegration:
    """Integration tests for communications API with mocked services"""

    @pytest.fixture
    def client(self):
        """Create test client with mocked auth"""
        from app.models import ApiKey
        from app.auth.dependencies import get_api_user

        def mock_get_api_user():
            return ApiKey(
                id="test-key-id",
                key_name="Test Key",
                is_active=True,
                user_id="test-user-123"
            )

        app.dependency_overrides[get_api_user] = mock_get_api_user
        yield TestClient(app)
        app.dependency_overrides = {}

    def test_send_sms_success(self, client):
        """Test: Send SMS endpoint returns success (with mocked service)"""
        with patch('app.routes.communications.AdapterFactory') as mock_factory:
            mock_adapter = Mock()
            mock_adapter.execute = AsyncMock(return_value={
                "id": "SM123",
                "status": "queued"
            })
            mock_factory.create_adapter.return_value = mock_adapter

            with patch('app.routes.communications.get_user_credentials') as mock_creds:
                mock_creds.return_value = {
                    "account_sid": "AC123",
                    "auth_token": "token",
                    "from_number": "+1234567890"
                }

                response = client.post(
                    "/v1/sms",
                    json={
                        "to": "+1234567890",
                        "body": "Test message"
                    }
                )

        assert response.status_code == 201
        data = response.json()
        assert "message_id" in data
        assert data["status"] == "sent"
        assert data["service"] == "twilio"

    def test_send_email_success(self, client):
        """Test: Send email endpoint returns success (with mocked service)"""
        with patch('app.routes.communications.AdapterFactory') as mock_factory:
            mock_adapter = Mock()
            mock_adapter.execute = AsyncMock(return_value={
                "id": "email123",
                "status": "queued"
            })
            mock_factory.create_adapter.return_value = mock_adapter

            with patch('app.routes.communications.get_user_credentials') as mock_creds:
                mock_creds.return_value = {
                    "api_key": "resend_key",
                    "from_email": "test@example.com"
                }

                response = client.post(
                    "/v1/email",
                    json={
                        "to": "recipient@example.com",
                        "subject": "Test Subject",
                        "html_body": "<h1>Test</h1>"
                    }
                )

        assert response.status_code == 201
        data = response.json()
        assert "email_id" in data
        assert data["status"] == "sent"
        assert data["service"] == "resend"

    def test_send_sms_missing_to(self, client):
        """Test: Send SMS without 'to' parameter returns validation error"""
        response = client.post(
            "/v1/sms",
            json={"body": "Test message"}
        )

        assert response.status_code == 422  # Validation error

    def test_send_email_missing_to(self, client):
        """Test: Send email without 'to' parameter returns validation error"""
        response = client.post(
            "/v1/email",
            json={
                "subject": "Test",
                "html_body": "<h1>Test</h1>"
            }
        )

        assert response.status_code == 422  # Validation error

    def test_send_sms_invalid_phone_format(self, client):
        """Test: Send SMS with invalid phone number"""
        with patch('app.routes.communications.AdapterFactory') as mock_factory:
            mock_adapter = Mock()
            mock_adapter.execute = AsyncMock(side_effect=Exception("Invalid phone"))
            mock_factory.create_adapter.return_value = mock_adapter

            with patch('app.routes.communications.get_user_credentials') as mock_creds:
                mock_creds.return_value = {
                    "account_sid": "AC123",
                    "auth_token": "token",
                    "from_number": "+1234567890"
                }

                response = client.post(
                    "/v1/sms",
                    json={
                        "to": "invalid-phone",
                        "body": "Test"
                    }
                )

        assert response.status_code == 500

    def test_send_email_no_body(self, client):
        """Test: Send email without body fails"""
        response = client.post(
            "/v1/email",
            json={
                "to": "test@example.com",
                "subject": "Test"
            }
        )

        assert response.status_code == 422


class TestServiceDiscoveryAPIIntegration:
    """Integration tests for service discovery API"""

    @pytest.fixture
    def client(self):
        """Create test client with mocked auth"""
        from app.models import ApiKey
        from app.auth.dependencies import get_api_user

        def mock_get_api_user():
            return ApiKey(
                id="test-key-id",
                key_name="Test Key",
                is_active=True,
                user_id="test-user-123"
            )

        app.dependency_overrides[get_api_user] = mock_get_api_user
        yield TestClient(app)
        app.dependency_overrides = {}

    def test_list_all_services(self, client):
        """Test: List all available services"""
        response = client.get("/v1/services")

        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        assert len(data["services"]) > 0

    def test_list_services_by_category(self, client):
        """Test: List services filtered by category"""
        response = client.get("/v1/services?category=communications")

        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        for service in data["services"]:
            assert service["category"] == "communications"

    def test_get_service_schema_twilio(self, client):
        """Test: Get Twilio service schema"""
        response = client.get("/v1/services/twilio/schema")

        assert response.status_code == 200
        data = response.json()
        assert "credentials_required" in data
        assert "endpoints" in data

    def test_get_service_schema_resend(self, client):
        """Test: Get Resend service schema"""
        response = client.get("/v1/services/resend/schema")

        assert response.status_code == 200
        data = response.json()
        assert "credentials_required" in data
        assert "endpoints" in data

    def test_get_service_features_twilio(self, client):
        """Test: Get Twilio service features"""
        response = client.get("/v1/services/twilio/features")

        assert response.status_code == 200
        data = response.json()
        assert "features" in data
        assert len(data["features"]) > 0
        assert "send_sms" in data["features"]

    def test_get_unknown_service_schema(self, client):
        """Test: Get schema for unknown service returns 404"""
        response = client.get("/v1/services/unknown/schema")

        assert response.status_code == 404
