import pytest
import asyncio
import os
import sys
from typing import AsyncGenerator
from unittest.mock import Mock, AsyncMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import get_db
from app.models import User, ApiKey, ServiceCredential
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import select
from datetime import datetime, timedelta


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_db():
    """Create test database session"""
    from app.database import async_session

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def test_user(test_db: AsyncSession):
    """Create test user with API key"""
    from uuid import uuid4
    import secrets

    user_id = str(uuid4())
    
    user = User(
        id=user_id,
        email="test@example.com",
        name="Test User",
        clerk_user_id="test_clerk_user_123",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    test_db.add(user)
    await test_db.flush()

    api_key = ApiKey(
        user_id=user_id,
        key_name="Test API Key",
        key_hash=secrets.token_hex(16),
        key_prefix="unf_test",
        environment="test",
        is_active=True,
        rate_limit_per_min=100,
        rate_limit_per_day=10000,
        expires_at=datetime.utcnow() + timedelta(days=365),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    test_db.add(api_key)
    await test_db.flush()
    await test_db.commit()
    
    yield {
        "id": user_id,
        "email": user.email,
        "api_key": api_key.key_hash,
        "api_key_id": str(api_key.id)
    }


@pytest.fixture
async def test_credentials(test_db: AsyncSession, test_user: dict):
    """Create test service credentials for Twilio and Resend"""
    
    from app.services.credential_manager import CredentialManager
    import json

    cred_manager = CredentialManager()
    
    # Mock Twilio credentials
    twilio_creds = {
        "account_sid": "test_account_sid",
        "auth_token": "test_auth_token",
        "from_number": "+1234567890"
    }
    
    encrypted_twilio = cred_manager.encrypt_credentials(twilio_creds)
    
    twilio_service = ServiceCredential(
        user_id=test_user["id"],
        service_name="twilio",
        environment="test",
        credentials_encrypted=encrypted_twilio,
        features_config={"sms": {"enabled": True}},
        is_active=True
    )
    test_db.add(twilio_service)
    
    # Mock Resend credentials
    resend_creds = {
        "api_key": "test_resend_api_key",
        "from_email": "test@example.com"
    }
    
    encrypted_resend = cred_manager.encrypt_credentials(resend_creds)
    
    resend_service = ServiceCredential(
        user_id=test_user["id"],
        service_name="resend",
        environment="test",
        credentials_encrypted=encrypted_resend,
        features_config={"email": {"enabled": True}},
        is_active=True
    )
    test_db.add(resend_service)
    
    await test_db.flush()
    await test_db.commit()
    
    yield {
        "twilio": twilio_creds,
        "resend": resend_creds
    }


@pytest.fixture
def mock_twilio_response():
    """Mock successful Twilio SMS response"""
    return {
        "sid": "SMtest123456",
        "status": "queued",
        "date_created": "2024-12-30T12:00:00Z"
    }


@pytest.fixture
def mock_resend_response():
    """Mock successful Resend email response"""
    return {
        "id": "email_test123456"
    }


@pytest.fixture
def override_auth(test_user: dict):
    """Override authentication dependency for tests"""
    from app.auth.dependencies import get_current_user, get_api_user
    
    async def mock_get_current_user():
        return {
            "id": test_user["id"],
            "email": test_user["email"],
            "name": "Test User",
            "clerk_user_id": "test_clerk_user_123"
        }
    
    async def mock_get_api_user():
        from app.models import ApiKey
        return ApiKey(
            id=test_user["api_key_id"],
            key_name="Test API Key",
            is_active=True
        )
    
    return {
        "get_current_user": mock_get_current_user,
        "get_api_user": mock_get_api_user
    }
