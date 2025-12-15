import json
import logging
import secrets
from typing import Dict, Any, Optional
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import ServiceCredential
from ..config import settings

# Initialize logger for this module
logger = logging.getLogger(__name__)

class CredentialManager:
    """
    Manages encryption and storage of service credentials.
    
    Notes on encryption key handling:
    - In development mode: A key is auto-generated in-memory if not provided
    - In production: An encryption key MUST be provided via ENCRYPTION_KEY env var
    - Keys should be 44-character base64-encoded Fernet keys (32 bytes)
    - Auto-generated keys will NOT persist across restarts; use a persistent key in production
    """

    def __init__(self):
        """Initialize credential manager with encryption key from settings or generate for dev."""
        key = getattr(settings, 'ENCRYPTION_KEY', None)
        is_production = settings.ENVIRONMENT == "production"
        
        if not key:
            if is_production:
                raise RuntimeError(
                    "ENCRYPTION_KEY environment variable is required for production. "
                    "Generate a persistent key using: from cryptography.fernet import Fernet; "
                    "print(Fernet.generate_key().decode()). "
                    "The key must be exactly 44 characters (base64-encoded 32 bytes)."
                )
            else:
                # Auto-generate key for development only
                key = Fernet.generate_key().decode('utf-8')
                logger.warning(
                    "Generated temporary encryption key for development mode. "
                    "This key will NOT persist across restarts. "
                    "For persistent storage, set ENCRYPTION_KEY environment variable."
                )
        elif isinstance(key, str) and len(key) != 44:
            # Invalid key length
            error_msg = (
                f"Invalid ENCRYPTION_KEY length ({len(key)}). "
                f"Expected 44 characters (base64-encoded 32-byte Fernet key). "
                f"Generate a valid key using: from cryptography.fernet import Fernet; "
                f"print(Fernet.generate_key().decode())"
            )
            if is_production:
                raise RuntimeError(error_msg)
            else:
                # For development, log warning and generate a valid key
                logger.warning(f"{error_msg} Generating temporary key for development.")
                key = Fernet.generate_key().decode('utf-8')

        if isinstance(key, str):
            key = key.encode()

        self.cipher = Fernet(key)

    def encrypt_credentials(self, credentials: Dict[str, Any]) -> str:
        """Encrypt credentials dictionary"""
        data = json.dumps(credentials, sort_keys=True)
        encrypted = self.cipher.encrypt(data.encode())
        return encrypted.decode()

    def decrypt_credentials(self, encrypted_data: str) -> Dict[str, Any]:
        """Decrypt credentials (for future use in Phase 2B)"""
        decrypted = self.cipher.decrypt(encrypted_data.encode())
        return json.loads(decrypted.decode())

    async def store_service_credentials(
        self,
        db: AsyncSession,
        user_id: str,
        service_name: str,
        credentials: Dict[str, str],
        features: Dict[str, bool],
        environment: str = "test"
    ) -> ServiceCredential:
        """Store encrypted service credentials in database"""

        # Encrypt the credentials
        encrypted_creds = self.encrypt_credentials(credentials)

        # Create database record
        credential = ServiceCredential(
            user_id=user_id,
            provider_name=service_name,
            environment=environment,
            encrypted_credential=encrypted_creds,
            features_config=features,
            is_active=True
        )

        db.add(credential)
        await db.commit()
        await db.refresh(credential)

        return credential

    async def get_user_credentials(
        self,
        db: AsyncSession,
        user_id: str,
        service_name: Optional[str] = None,
        environment: str = "test"
    ) -> list:
        """Get user's stored credentials (returns metadata, not decrypted data)"""
        from sqlalchemy import select

        query = select(ServiceCredential).where(
            ServiceCredential.user_id == user_id,
            ServiceCredential.environment == environment,
            ServiceCredential.is_active == True
        )

        if service_name:
            query = query.where(ServiceCredential.provider_name == service_name)

        result = await db.execute(query)
        credentials = result.scalars().all()

        return [{
            "id": str(cred.id),
            "service_name": cred.provider_name,
            "environment": cred.environment,
            "features": cred.features_config,
            "created_at": cred.created_at,
            "is_active": cred.is_active
        } for cred in credentials]

    def validate_credentials_format(self, service_name: str, credentials: Dict[str, str]) -> Dict[str, str]:
        """Validate credential format for a service"""
        errors = {}

        # Basic validation - check required fields exist and are not empty
        if service_name == "razorpay":
            if not credentials.get("RAZORPAY_KEY_ID"):
                errors["RAZORPAY_KEY_ID"] = "Required"
            if not credentials.get("RAZORPAY_KEY_SECRET"):
                errors["RAZORPAY_KEY_SECRET"] = "Required"

        elif service_name == "paypal":
            if not credentials.get("PAYPAL_CLIENT_ID"):
                errors["PAYPAL_CLIENT_ID"] = "Required"
            if not credentials.get("PAYPAL_CLIENT_SECRET"):
                errors["PAYPAL_CLIENT_SECRET"] = "Required"

        elif service_name == "stripe":
            if not credentials.get("STRIPE_SECRET_KEY"):
                errors["STRIPE_SECRET_KEY"] = "Required"

        elif service_name == "twilio":
            if not credentials.get("TWILIO_ACCOUNT_SID"):
                errors["TWILIO_ACCOUNT_SID"] = "Required"
            if not credentials.get("TWILIO_AUTH_TOKEN"):
                errors["TWILIO_AUTH_TOKEN"] = "Required"

        elif service_name == "aws_s3":
            if not credentials.get("AWS_ACCESS_KEY_ID"):
                errors["AWS_ACCESS_KEY_ID"] = "Required"
            if not credentials.get("AWS_SECRET_ACCESS_KEY"):
                errors["AWS_SECRET_ACCESS_KEY"] = "Required"
            if not credentials.get("AWS_S3_BUCKET"):
                errors["AWS_S3_BUCKET"] = "Required"

        return errors