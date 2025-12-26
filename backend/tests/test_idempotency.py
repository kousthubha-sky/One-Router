"""
Tests for idempotency key deduplication functionality.

Tests database-backed idempotency service, hash validation, response caching,
and error handling for conflicts and expirations.
"""

import pytest
import json
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock

from app.services.idempotency_service import IdempotencyService
from app.exceptions import IdempotencyKeyConflictException, IdempotencyKeyExpiredException
from app.models import IdempotencyKey


class TestIdempotencyService:
    """Test IdempotencyService functionality"""

    @pytest.fixture
    def service(self):
        """Create IdempotencyService instance"""
        return IdempotencyService()

    @pytest.fixture
    def mock_db(self):
        """Create mock database session"""
        return AsyncMock()

    def test_compute_request_hash(self, service):
        """Test SHA256 hash computation"""
        request_body = '{"amount": 100.00, "currency": "INR"}'
        hash1 = service._compute_request_hash(request_body)
        hash2 = service._compute_request_hash(request_body)

        # Same input should produce same hash
        assert hash1 == hash2
        assert len(hash1) == 64  # SHA256 produces 64 character hex string

        # Different input should produce different hash
        different_body = '{"amount": 200.00, "currency": "INR"}'
        hash3 = service._compute_request_hash(different_body)
        assert hash1 != hash3

    def test_get_expires_at(self, service):
        """Test expiration timestamp calculation"""
        expires_at = service._get_expires_at()
        expected_expiry = datetime.utcnow() + timedelta(hours=24)

        # Should be approximately 24 hours from now
        assert abs((expires_at - expected_expiry).total_seconds()) < 10  # Within 10 seconds

    def test_is_idempotency_required(self, service):
        """Test endpoint requirement checking"""
        # Required endpoints
        assert service.is_idempotency_required("POST /v1/payments/orders") == True
        assert service.is_idempotency_required("/v1/payments/orders") == True  # Without method
        assert service.is_idempotency_required("POST /v1/refunds") == True
        assert service.is_idempotency_required("POST /v1/subscriptions") == True

        # Not required endpoints (different paths)
        assert service.is_idempotency_required("GET /v1/payments/orders") == True  # Same path, different method - still required
        assert service.is_idempotency_required("POST /v1/analytics") == False
        assert service.is_idempotency_required("/v1/webhooks") == False

    @pytest.mark.asyncio
    async def test_store_idempotency_response_new_key(self, service, mock_db):
        """Test storing response for new idempotency key"""
        api_key_id = "test_api_key_123"
        idempotency_key = "idem_test_123"
        endpoint = "/v1/payments/orders"
        request_body = '{"amount": 100.00}'
        response_body = {"transaction_id": "txn_123", "status": "success"}
        response_status = 200

        # Mock empty result (no existing key)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        await service.store_idempotency_response(
            mock_db, api_key_id, idempotency_key, endpoint,
            request_body, response_body, response_status
        )

        # Should have added new record to database
        mock_db.add.assert_called_once()
        added_record = mock_db.add.call_args[0][0]

        assert isinstance(added_record, IdempotencyKey)
        assert added_record.api_key_id == api_key_id
        assert added_record.idempotency_key == idempotency_key
        assert added_record.endpoint == endpoint
        assert added_record.request_hash == service._compute_request_hash(request_body)
        assert added_record.response_body == json.dumps(response_body)
        assert added_record.response_status_code == response_status

    @pytest.mark.asyncio
    async def test_store_idempotency_response_existing_key(self, service, mock_db):
        """Test updating response for existing idempotency key"""
        api_key_id = "test_api_key_123"
        idempotency_key = "idem_test_123"
        request_body = '{"amount": 100.00}'
        response_body = {"transaction_id": "txn_123", "status": "success"}
        response_status = 200

        # Mock existing record for get_idempotency_response call
        existing_record = MagicMock()
        existing_record.response_body = json.dumps({"old": "response"})
        existing_record.response_status_code = 200
        existing_record.request_hash = service._compute_request_hash(request_body)
        existing_record.created_at = datetime.utcnow()

        # Mock the result for the first query (get_idempotency_response)
        mock_result_get = MagicMock()
        mock_result_get.scalar_one_or_none.return_value = existing_record

        # Mock the result for the second query (store operation)
        mock_result_store = MagicMock()
        mock_result_store.scalar_one_or_none.return_value = None

        # Set up db.execute to return different results for different calls
        mock_db.execute.side_effect = [mock_result_get, mock_result_store]

        await service.store_idempotency_response(
            mock_db, api_key_id, idempotency_key, "/v1/payments/orders",
            request_body, response_body, response_status
        )

        # Should not add new record, should update existing
        mock_db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_get_idempotency_response_found(self, service, mock_db):
        """Test retrieving cached response"""
        api_key_id = "test_api_key_123"
        idempotency_key = "idem_test_123"
        response_body = {"transaction_id": "txn_123", "status": "success"}

        # Mock database record
        mock_record = MagicMock()
        mock_record.response_body = json.dumps(response_body)
        mock_record.response_status_code = 200
        mock_record.request_hash = "hash123"
        mock_record.created_at = datetime.utcnow()

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_record
        mock_db.execute.return_value = mock_result

        result = await service.get_idempotency_response(mock_db, api_key_id, idempotency_key)

        assert result is not None
        assert result['response_body'] == response_body
        assert result['response_status_code'] == 200
        assert result['request_hash'] == "hash123"
        assert 'created_at' in result

    @pytest.mark.asyncio
    async def test_get_idempotency_response_not_found(self, service, mock_db):
        """Test retrieving non-existent cached response"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await service.get_idempotency_response(mock_db, "api_key", "idem_key")
        assert result is None

    @pytest.mark.asyncio
    async def test_validate_request_hash_success(self, service, mock_db):
        """Test successful hash validation"""
        api_key_id = "test_api_key_123"
        idempotency_key = "idem_test_123"
        request_body = '{"amount": 100.00}'

        # Mock record with matching hash
        mock_record = MagicMock()
        mock_record.request_hash = service._compute_request_hash(request_body)
        mock_record.expires_at = datetime.utcnow() + timedelta(hours=1)

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_record
        mock_db.execute.return_value = mock_result

        # Should not raise exception
        result = await service.validate_request_hash(mock_db, api_key_id, idempotency_key, request_body)
        assert result is True

    @pytest.mark.asyncio
    async def test_validate_request_hash_conflict(self, service, mock_db):
        """Test hash validation with conflicting request"""
        api_key_id = "test_api_key_123"
        idempotency_key = "idem_test_123"
        original_body = '{"amount": 100.00}'
        different_body = '{"amount": 200.00}'

        # Mock record with different hash
        mock_record = MagicMock()
        mock_record.request_hash = service._compute_request_hash(original_body)
        mock_record.expires_at = datetime.utcnow() + timedelta(hours=1)

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_record
        mock_db.execute.return_value = mock_result

        # Should raise conflict exception
        with pytest.raises(IdempotencyKeyConflictException) as exc_info:
            await service.validate_request_hash(mock_db, api_key_id, idempotency_key, different_body)

        assert idempotency_key in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_validate_request_hash_expired(self, service, mock_db):
        """Test hash validation with expired key"""
        api_key_id = "test_api_key_123"
        idempotency_key = "idem_test_123"
        request_body = '{"amount": 100.00}'

        # Mock expired record
        mock_record = MagicMock()
        mock_record.request_hash = service._compute_request_hash(request_body)
        mock_record.expires_at = datetime.utcnow() - timedelta(hours=1)  # Expired

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_record
        mock_db.execute.return_value = mock_result

        # Should raise expired exception
        with pytest.raises(IdempotencyKeyExpiredException) as exc_info:
            await service.validate_request_hash(mock_db, api_key_id, idempotency_key, request_body)

        assert idempotency_key in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_cleanup_expired_keys(self, service, mock_db):
        """Test cleanup of expired idempotency keys"""
        # Mock delete operation
        mock_result = MagicMock()
        mock_result.rowcount = 5  # 5 keys deleted
        mock_db.execute.return_value = mock_result

        deleted_count = await service.cleanup_expired_keys(mock_db)

        assert deleted_count == 5
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_end_to_end_idempotency_flow(self, service, mock_db):
        """Test complete idempotency flow"""
        api_key_id = "test_api_key_123"
        idempotency_key = "idem_test_123"
        endpoint = "/v1/payments/orders"
        request_body = '{"amount": 100.00, "currency": "INR"}'
        response_body = {"transaction_id": "txn_123", "status": "success"}

        # Step 1: No existing response
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result

        result = await service.get_idempotency_response(mock_db, api_key_id, idempotency_key)
        assert result is None

        # Step 2: Validate hash (new key - should pass)
        is_valid = await service.validate_request_hash(mock_db, api_key_id, idempotency_key, request_body)
        assert is_valid is True

        # Step 3: Store response - reset mock for store operation
        mock_db.reset_mock()
        mock_result_store = MagicMock()
        mock_result_store.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result_store

        await service.store_idempotency_response(
            mock_db, api_key_id, idempotency_key, endpoint,
            request_body, response_body, 200
        )

        # Step 4: Retrieve cached response
        # Mock the stored record
        mock_record = MagicMock()
        mock_record.response_body = json.dumps(response_body)
        mock_record.response_status_code = 200
        mock_record.request_hash = service._compute_request_hash(request_body)
        mock_record.created_at = datetime.utcnow()
        mock_record.expires_at = datetime.utcnow() + timedelta(hours=1)  # Not expired

        mock_result_get = MagicMock()
        mock_result_get.scalar_one_or_none.return_value = mock_record
        mock_db.execute.return_value = mock_result_get

        cached_result = await service.get_idempotency_response(mock_db, api_key_id, idempotency_key)
        assert cached_result is not None
        assert cached_result['response_body'] == response_body
        assert cached_result['response_status_code'] == 200

        # Step 5: Validate hash again (should still pass)
        is_valid_again = await service.validate_request_hash(mock_db, api_key_id, idempotency_key, request_body)
        assert is_valid_again is True