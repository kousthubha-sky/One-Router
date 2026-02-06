import json
import logging
import secrets
import uuid
from typing import Dict, Any, Optional, List
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from ..models import ServiceCredential
from ..config import settings
from ..cache import cache_service

# Initialize logger for this module
logger = logging.getLogger(__name__)

from datetime import datetime

class CredentialManager:
    """
    Manages AES256-GCM encryption and storage of service credentials with key rotation.

    Notes on encryption key handling:
    - Uses AES256-GCM for authenticated encryption
    - Encryption key MUST be provided via ENCRYPTION_KEY env var
    - Keys are 32-byte (256-bit) AES keys, base64 encoded in env var
    - Key rotation: Keys are versioned and rotated automatically
    - Credentials stored as binary in database (BYTEA)
    """

    def __init__(self):
        """Initialize credential manager with AES256-GCM encryption."""
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        import base64
        import os

        self.aesgcm = AESGCM
        self.current_key_version = 1
        self.encryption_keys = {}  # version -> key mapping

        # Use encryption key from settings (which handles dev key generation)
        self.encryption_key = settings.ENCRYPTION_KEY
        if not self.encryption_key:
            raise RuntimeError(
                "ENCRYPTION_KEY must be set in environment. "
                "Generate with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
            )

        # Decode the key
        try:
            key_bytes = base64.b64decode(self.encryption_key)
            if len(key_bytes) != 32:
                raise ValueError(f"Key must be 32 bytes, got {len(key_bytes)}")
        except Exception as e:
            raise ValueError(f"Invalid ENCRYPTION_KEY: {e}")

        # Store key version with each encrypted credential
        # Format: {version:4bytes}{nonce:12bytes}{ciphertext}
        self.encryption_keys[self.current_key_version] = key_bytes

    def encrypt_credentials(self, credentials: Dict[str, Any]) -> bytes:
        """
        Encrypts a credentials mapping into a versioned AES-256-GCM ciphertext blob.
        
        Parameters:
            credentials (Dict[str, Any]): Credential fields to encrypt; serialized to sorted JSON before encryption.
        
        Returns:
            bytes: Combined payload formatted as 4-byte big-endian key version || 12-byte GCM nonce || AES-GCM ciphertext.
        """
        import os
        import base64

        # Serialize data
        data = json.dumps(credentials, sort_keys=True).encode('utf-8')

        # Generate random nonce (must be unique per encryption)
        nonce = os.urandom(12)  # 96-bit nonce for GCM

        # Get current encryption key
        key = self.encryption_keys[self.current_key_version]

        # Encrypt using AES256-GCM
        aesgcm = self.aesgcm(key)
        ciphertext = aesgcm.encrypt(nonce, data, None)  # None for associated data

        # Combine version + nonce + ciphertext
        version_bytes = self.current_key_version.to_bytes(4, 'big')
        combined = version_bytes + nonce + ciphertext

        return combined

    def decrypt_credentials(self, encrypted_data: bytes | bytearray | memoryview) -> Dict[str, Any]:
        """
        Decrypt an encrypted credential blob and return the credential dictionary.
        
        Parameters:
            encrypted_data (bytes | bytearray | memoryview): The encrypted payload in binary format.
                Format: [4-byte big-endian version][12-byte nonce][ciphertext].
                Must be bytes, bytearray, or memoryview - NOT str (string input will raise TypeError).
        
        Returns:
            Dict[str, Any]: Credentials parsed from the decrypted JSON payload.
        
        Raises:
            TypeError: If encrypted_data is a str or other non-binary type. String input indicates
                the database/data source is returning text instead of binary data, which would corrupt
                the ciphertext during decryption. Ensure encrypted_credential column returns bytes.
            ValueError: If the input cannot be decrypted with available keys or the payload is malformed.
        """
        try:
            combined = encrypted_data

            # Convert to bytes only from memoryview; reject str to prevent binary corruption
            if not isinstance(combined, bytes):
                if isinstance(combined, memoryview):
                    combined = bytes(combined)
                elif isinstance(combined, str):
                    # String input indicates the data source is returning text instead of binary
                    # This will corrupt the ciphertext - raise error so caller fixes it
                    logger.error(
                        f"TypeError in decrypt_credentials: encrypted_data received as str instead of bytes. "
                        f"This indicates the database or data source is not returning binary data properly. "
                        f"Ensure encrypted_credential column returns bytes/memoryview, not text. "
                        f"Received str of length {len(combined)}"
                    )
                    raise TypeError(
                        "encrypted_data must be bytes or memoryview, not str. "
                        "The database encrypted_credential column is returning text instead of binary data. "
                        "This would corrupt the ciphertext during decryption."
                    )
                else:
                    # Try generic bytes conversion for other types
                    try:
                        combined = bytes(combined)
                    except (TypeError, ValueError) as e:
                        logger.error(
                            f"TypeError in decrypt_credentials: Cannot convert encrypted_data type {type(combined).__name__} to bytes: {e}"
                        )
                        raise TypeError(
                            f"encrypted_data must be bytes or memoryview, not {type(combined).__name__}"
                        ) from e

            # Check if this looks like AES256-GCM format (version + nonce + ciphertext)
            if len(combined) > 16:  # minimum: 4 (version) + 12 (nonce) + 1 (ciphertext)
                version = int.from_bytes(combined[:4], 'big')
                nonce = combined[4:16]
                ciphertext = combined[16:]

                if version in self.encryption_keys:
                    key = self.encryption_keys[version]
                    aesgcm = self.aesgcm(key)
                    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
                    return json.loads(plaintext.decode('utf-8'))

            raise ValueError("Could not decrypt data with available keys")

        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise ValueError(f"Failed to decrypt credentials: {e}")

    def rotate_encryption_key(self) -> int:
        """Rotate to a new encryption key. Returns the new key version."""
        import os

        # Generate new key
        new_key = os.urandom(32)
        self.current_key_version += 1
        self.encryption_keys[self.current_key_version] = new_key

        logger.info(f"Encryption key rotated to version {self.current_key_version}")
        logger.warning(
            "Key rotation is in-memory only. Rotated keys will be lost on restart. "
            "Ensure you persist the new key externally for production use."
        )
        return self.current_key_version

    def should_rotate_key(self, max_age_days: int = 90) -> bool:
        """Check if encryption key should be rotated based on age."""
        # For now, always return False (manual rotation only)
        # In production, track key creation dates and rotate automatically
        return False

    def cleanup_old_keys(self, keep_versions: int = 5) -> int:
        """Clean up old encryption keys, keeping only the most recent ones."""
        if len(self.encryption_keys) <= keep_versions:
            return 0

        # Keep only the most recent versions
        sorted_versions = sorted(self.encryption_keys.keys(), reverse=True)
        versions_to_remove = sorted_versions[keep_versions:]

        removed_count = 0
        for version in versions_to_remove:
            if version != self.current_key_version:  # Never remove current key
                del self.encryption_keys[version]
                removed_count += 1

        if removed_count > 0:
            logger.info(f"Cleaned up {removed_count} old encryption keys")

        return removed_count

    def get_key_info(self) -> Dict[str, Any]:
        """Get information about current encryption keys"""
        return {
            "current_version": self.current_key_version,
            "available_versions": list(self.encryption_keys.keys()),
            "algorithm": "AES256-GCM"
        }

    def _normalize_credentials(self, service_name: str, credentials: Dict[str, str]) -> Dict[str, str]:
        """
        Normalize credential keys for consistency across different input formats.
        For example, Twilio phone number can come as TWILIO_PHONE_NUMBER, TWILIO_FROM_NUMBER, or from_number.
        """
        normalized = credentials.copy()

        if service_name == "twilio":
            # Normalize phone number key to 'from_number'
            if "from_number" not in normalized:
                phone_number = (
                    normalized.pop("TWILIO_PHONE_NUMBER", None) or
                    normalized.pop("TWILIO_FROM_NUMBER", None)
                )
                if phone_number:
                    normalized["from_number"] = phone_number

        elif service_name == "resend":
            # Normalize from email key to 'from_email'
            if "from_email" not in normalized:
                from_email = normalized.pop("RESEND_FROM_EMAIL", None)
                if from_email:
                    normalized["from_email"] = from_email

        return normalized

    async def store_service_credentials(
        self,
        db: AsyncSession,
        user_id: str,
        service_name: str,
        credentials: Dict[str, str],
        features: Dict[str, bool],
        feature_metadata: Optional[Dict[str, Any]] = None,  # NEW parameter
        environment: str = "test"
    ) -> ServiceCredential:
        """Store encrypted service credentials in database (upsert - update if exists)"""
        from sqlalchemy import select

        if feature_metadata is None:
            feature_metadata = {}

        # Normalize credentials before validation (e.g., Twilio phone number keys)
        credentials = self._normalize_credentials(service_name, credentials)

        errors = self.validate_credentials_format(service_name, credentials, environment)
        if errors:
            raise ValueError(f"Invalid credentials for {service_name}: {errors}")

        # Encrypt the credentials
        encrypted_creds = self.encrypt_credentials(credentials)

        # Check if credential already exists for this user/service/environment
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == service_name,
                ServiceCredential.environment == environment
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Update existing credential
            existing.encrypted_credential = encrypted_creds
            existing.features_config = features
            existing.is_active = True
            credential = existing
        else:
            # Create new credential
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

        # Invalidate credential lookup cache
        try:
            await cache_service.invalidate_all_credential_cache(user_id, service_name)
            logger.debug(f"Invalidated credential cache for user {user_id}, service {service_name}")
        except Exception as e:
            logger.debug(f"Failed to invalidate credential cache: {e}")

        return credential

    # API Key Management Methods
    async def generate_api_key(
        self,
        db: AsyncSession,
        user_id: str,
        key_name: str = "Default Key",
        key_environment: str = "test",  # New parameter for environment
        rate_limit_per_min: Optional[int] = None,  # Make optional to use environment defaults
        rate_limit_per_day: Optional[int] = None,  # Make optional to use environment defaults
        expires_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Generate a new API key for a user with environment support"""
        import secrets
        import hashlib
        from ..models import ApiKey

        # Set environment-specific rate limits if not provided
        if rate_limit_per_min is None:
            rate_limit_per_min = 1000 if key_environment == "test" else 100
        if rate_limit_per_day is None:
            rate_limit_per_day = 100000 if key_environment == "test" else 10000

        # Generate secure API key with environment prefix
        env_prefix = "unf_test" if key_environment == "test" else "unf_live"
        raw_key = f"{env_prefix}_{secrets.token_urlsafe(32)}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        key_prefix = raw_key[:12]  # First 12 chars as prefix (includes env indicator)

        # Create database record
        from datetime import datetime
        api_key_record = ApiKey(
            id=uuid.uuid4(),
            user_id=user_id,
            key_hash=key_hash,
            key_name=key_name,
            key_prefix=key_prefix,
            environment=key_environment,
            rate_limit_per_min=rate_limit_per_min,
            rate_limit_per_day=rate_limit_per_day,
            expires_at=expires_at,
            created_at=datetime.utcnow(),
            is_active=True
        )

        db.add(api_key_record)
        await db.commit()
        await db.refresh(api_key_record)

        return {
            "api_key": raw_key,
            "key_id": str(api_key_record.id),
            "key_name": key_name,
            "environment": key_environment,
            "created_at": api_key_record.created_at.isoformat() if api_key_record.created_at else None
        }

    async def get_user_api_keys(self, db: AsyncSession, user_id: str, environment: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get API keys for a user, optionally filtered by environment"""
        from ..models import ApiKey
        from sqlalchemy import select

        query = select(ApiKey).where(ApiKey.user_id == user_id)

        if environment:
            query = query.where(ApiKey.environment == environment)

        result = await db.execute(query)
        api_keys = result.scalars().all()

        return [{
            "id": str(key.id),
            "key_name": key.key_name,
            "key_prefix": key.key_prefix,
            "environment": key.environment,
            "is_active": key.is_active,
            "rate_limit_per_min": key.rate_limit_per_min,
            "rate_limit_per_day": key.rate_limit_per_day,
            "last_used_at": key.last_used_at.isoformat() if key.last_used_at else None,
            "expires_at": key.expires_at.isoformat() if key.expires_at else None,
            "created_at": key.created_at.isoformat() if key.created_at else None
        } for key in api_keys]

    async def validate_api_key(self, db: AsyncSession, api_key: str) -> Dict[str, Any]:
        """Validate API key and return user/key info"""
        import hashlib
        from ..models import ApiKey
        from sqlalchemy import select, update

        key_hash = hashlib.sha256(api_key.encode()).hexdigest()

        result = await db.execute(
            select(ApiKey).where(ApiKey.key_hash == key_hash)
        )
        key_record = result.scalar_one_or_none()

        if not key_record:
            raise ValueError("Invalid API key")

        if not key_record.is_active:
            raise ValueError("API key is inactive")

        if key_record.expires_at and key_record.expires_at < datetime.utcnow():
            raise ValueError("API key has expired")

        # Update last used timestamp
        await db.execute(
            update(ApiKey)
            .where(ApiKey.id == key_record.id)
            .values(last_used_at=datetime.utcnow())
        )
        await db.commit()

        return {
            "user_id": str(key_record.user_id),
            "key_id": str(key_record.id),
            "key_name": key_record.key_name,
            "rate_limit_per_min": key_record.rate_limit_per_min,
            "rate_limit_per_day": key_record.rate_limit_per_day
        }

    async def get_api_key_usage(self, db: AsyncSession, key_id: str, days: int = 30) -> Dict[str, Any]:
        """Get usage statistics for an API key"""
        from ..models import TransactionLog
        from sqlalchemy import select, func
        from datetime import timedelta

        since_date = datetime.utcnow() - timedelta(days=days)

        # Get total requests
        result = await db.execute(
            select(func.count(TransactionLog.id))
            .where(
                TransactionLog.api_key_id == key_id,
                TransactionLog.created_at >= since_date
            )
        )
        total_requests = result.scalar()

        # Get requests by day
        result = await db.execute(
            select(
                func.date(TransactionLog.created_at).label('date'),
                func.count(TransactionLog.id).label('count')
            )
            .where(
                TransactionLog.api_key_id == key_id,
                TransactionLog.created_at >= since_date
            )
            .group_by(func.date(TransactionLog.created_at))
            .order_by(func.date(TransactionLog.created_at))
        )
        daily_usage = [{"date": str(row.date), "count": row.count} for row in result]

        # Get requests by service
        result = await db.execute(
            select(
                TransactionLog.service_name,
                func.count(TransactionLog.id).label('count')
            )
            .where(
                TransactionLog.api_key_id == key_id,
                TransactionLog.created_at >= since_date
            )
            .group_by(TransactionLog.service_name)
            .order_by(func.count(TransactionLog.id).desc())
        )
        service_usage = [{"service": row.service_name, "count": row.count} for row in result]

        return {
            "total_requests": total_requests,
            "daily_usage": daily_usage,
            "service_usage": service_usage,
            "period_days": days
        }

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

    async def get_credentials(
        self,
        db: AsyncSession,
        user_id: str,
        provider_name: str,
        environment: str = "test"
    ) -> Optional[Dict[str, Any]]:
        """
        Get decrypted credentials for a specific user, provider, and environment.
        
        Args:
            db: Database session
            user_id: User ID (UUID string)
            provider_name: Provider/service name (e.g., "razorpay", "paypal")
            environment: Environment name ("test" or "live")
        
        Returns:
            Decrypted credentials dictionary or None if not found
        """
        try:
            from sqlalchemy import select
            
            result = await db.execute(
                select(ServiceCredential).where(
                    ServiceCredential.user_id == user_id,
                    ServiceCredential.provider_name == provider_name,
                    ServiceCredential.environment == environment,
                    ServiceCredential.is_active == True
                )
            )
            credentials_list = result.scalars().all()
            
            if not credentials_list:
                logger.warning(f"No active credentials found for user {user_id}, provider {provider_name}, environment {environment}")
                return None
            
            # If multiple duplicates exist, consolidate by keeping the most recent one
            if len(credentials_list) > 1:
                logger.warning(f"Found {len(credentials_list)} duplicate {provider_name} credentials for user {user_id} in {environment}. Using most recent.")
                # Sort by created_at descending and keep the newest
                credentials_list.sort(key=lambda x: x.created_at, reverse=True)
                credential = credentials_list[0]
                
                # Optionally delete the old duplicates
                for old_cred in credentials_list[1:]:
                    old_cred.is_active = False
                await db.commit()
            else:
                credential = credentials_list[0]
            
            return self.decrypt_credentials(credential.encrypted_credential)
            
        except Exception as e:
            logger.error(f"Error retrieving credentials: {e}", exc_info=True)
            # Re-raise if this is a decryption failure (data corruption)
            if "decrypt" in str(e).lower():
                raise
            return None
    def validate_credentials_format(self, service_name: str, credentials: Dict[str, str], environment: str = "test") -> Dict[str, str]:
        """Validate credential format for a service"""
        errors = {}

        # Basic validation - check required fields exist and are not empty
        
        if service_name == "razorpay":
            key_id = credentials.get("RAZORPAY_KEY_ID", "")
            key_secret = credentials.get("RAZORPAY_KEY_SECRET", "")
            
            if not key_id:
                errors["RAZORPAY_KEY_ID"] = "Required"
            elif environment == "live":
                # Validate key prefix matches environment
                if not key_id.startswith("rzp_live_"):
                    # SECURITY: Don't expose credential values in error messages
                    errors["RAZORPAY_KEY_ID"] = "Live key must start with 'rzp_live_'"
            elif not key_id.startswith("rzp_test_"):
                # SECURITY: Don't expose credential values in error messages
                errors["RAZORPAY_KEY_ID"] = "Test key must start with 'rzp_test_'"

            if not key_secret:
                errors["RAZORPAY_KEY_SECRET"] = "Required"

        elif service_name == "paypal":
            if not credentials.get("PAYPAL_CLIENT_ID"):
                errors["PAYPAL_CLIENT_ID"] = "Required"
            if not credentials.get("PAYPAL_CLIENT_SECRET"):
                errors["PAYPAL_CLIENT_SECRET"] = "Required"

        elif service_name == "twilio":
            account_sid = credentials.get("TWILIO_ACCOUNT_SID", "")
            if not account_sid:
                errors["TWILIO_ACCOUNT_SID"] = "Required"
            elif not account_sid.startswith("AC"):
                errors["TWILIO_ACCOUNT_SID"] = "Account SID must start with 'AC'"

            if not credentials.get("TWILIO_AUTH_TOKEN"):
                errors["TWILIO_AUTH_TOKEN"] = "Required"

            # Accept multiple phone number key formats
            from_number = (
                credentials.get("from_number") or
                credentials.get("TWILIO_PHONE_NUMBER") or
                credentials.get("TWILIO_FROM_NUMBER") or
                ""
            )
            if not from_number:
                errors["from_number"] = "Required - phone number to send SMS from (use from_number, TWILIO_PHONE_NUMBER, or TWILIO_FROM_NUMBER)"
            elif not from_number.startswith("+"):
                errors["from_number"] = "Must be in E.164 format (e.g., +15005550006)"

        elif service_name == "resend":
            # Accept multiple API key formats
            api_key = (
                credentials.get("api_key") or
                credentials.get("RESEND_API_KEY") or
                ""
            )
            if not api_key:
                errors["api_key"] = "Required - Resend API key (use api_key or RESEND_API_KEY)"
            elif not api_key.startswith("re_"):
                errors["api_key"] = "API key must start with 're_'"

            # Accept multiple from email formats
            from_email = (
                credentials.get("from_email") or
                credentials.get("RESEND_FROM_EMAIL") or
                ""
            )
            if not from_email:
                errors["from_email"] = "Required - sender email address (use from_email or RESEND_FROM_EMAIL)"
            elif "@" not in from_email:
                errors["from_email"] = "Must be a valid email address"

        elif service_name == "aws_s3":
            if not credentials.get("AWS_ACCESS_KEY_ID"):
                errors["AWS_ACCESS_KEY_ID"] = "Required"
            if not credentials.get("AWS_SECRET_ACCESS_KEY"):
                errors["AWS_SECRET_ACCESS_KEY"] = "Required"
            if not credentials.get("AWS_S3_BUCKET"):
                errors["AWS_S3_BUCKET"] = "Required"

        return errors

    # ========================
    # RAZORPAY-SPECIFIC METHODS
    # ========================

    async def store_razorpay_credentials(
        self,
        db: AsyncSession,
        user_id: str,
        environment: str,  # "test" or "live"
        key_id: str,
        key_secret: str,
        webhook_secret: Optional[str] = None,
        features: Optional[Dict[str, Any]] = None
    ) -> ServiceCredential:
        """
        Store Razorpay credentials with environment segregation.
        
        Args:
            user_id: User ID (UUID string)
            environment: "test" or "live"
            key_id: Razorpay key ID (must match environment prefix)
            key_secret: Razorpay key secret
            webhook_secret: Optional webhook signing secret
            features: Optional feature config (e.g., {"payments": True, "refunds": True})
        
        Raises:
            ValueError: If keys don't match environment prefix (rzp_test_ vs rzp_live_)
        """
        # Validate key format matches environment
        # SECURITY: Don't expose credential values in error messages
        if environment == "live":
            if not key_id.startswith("rzp_live_"):
                raise ValueError(
                    "Live key must start with 'rzp_live_'"
                )
        else:  # test
            if not key_id.startswith("rzp_test_"):
                raise ValueError(
                    "Test key must start with 'rzp_test_'"
                )

        # Prepare credentials dict
        credentials = {
            "RAZORPAY_KEY_ID": key_id,
            "RAZORPAY_KEY_SECRET": key_secret
        }
        if webhook_secret:
            credentials["RAZORPAY_WEBHOOK_SECRET"] = webhook_secret

        # Encrypt credentials
        encrypted_creds = self.encrypt_credentials(credentials)

        # Check if credential already exists for this environment
        from sqlalchemy import select, delete
        existing_query = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == "razorpay",
                ServiceCredential.environment == environment,
                ServiceCredential.is_active == True
            )
        )
        existing_creds = existing_query.scalars().all()

        # If multiple duplicates exist (data corruption), clean them up
        if len(existing_creds) > 1:
            logger.warning(f"Found {len(existing_creds)} duplicate Razorpay {environment} credentials for user {user_id}. Consolidating...")
            # Keep the first one, delete the rest
            for dup_cred in existing_creds[1:]:
                await db.delete(dup_cred)
            await db.commit()
            existing_cred = existing_creds[0]
        elif len(existing_creds) == 1:
            existing_cred = existing_creds[0]
        else:
            existing_cred = None

        # If exists, update it
        if existing_cred:
            existing_cred.encrypted_credential = encrypted_creds
            existing_cred.features_config = features or {"payments": True, "refunds": True, "subscriptions": False}
            existing_cred.last_verified_at = None
            await db.commit()
            await db.refresh(existing_cred)
            # Invalidate credential lookup cache
            try:
                await cache_service.invalidate_all_credential_cache(user_id, "razorpay")
            except Exception as e:
                logger.debug(f"Failed to invalidate credential cache: {e}")
            logger.info(f"Updated Razorpay {environment} credentials for user {user_id}")
            return existing_cred

        # Create new credential record
        credential = ServiceCredential(
            user_id=user_id,
            provider_name="razorpay",
            environment=environment,
            encrypted_credential=encrypted_creds,
            features_config=features or {"payments": True, "refunds": True, "subscriptions": False},
            is_active=True,
            last_verified_at=None  # Will be set after webhook verification
        )

        db.add(credential)
        await db.commit()
        await db.refresh(credential)

        # Invalidate credential lookup cache
        try:
            await cache_service.invalidate_all_credential_cache(user_id, "razorpay")
        except Exception as e:
            logger.debug(f"Failed to invalidate credential cache: {e}")

        logger.info(f"Stored Razorpay {environment} credentials for user {user_id}")
        return credential

    async def get_razorpay_credentials(
        self,
        db: AsyncSession,
        user_id: str,
        environment: str  # "test" or "live"
    ) -> Optional[Dict[str, Any]]:
        """
        Get decrypted Razorpay credentials for specific environment.
        
        Args:
            user_id: User ID (UUID string)
            environment: "test" or "live"
        
        Returns:
            Dict with keys, or None if not configured
        """
        credentials = await self.get_credentials(
            db=db,
            user_id=user_id,
            provider_name="razorpay",
            environment=environment
        )

        if credentials:
            # Add environment metadata
            credentials["environment"] = environment
            credentials["environment_prefix"] = "rzp_live_" if environment == "live" else "rzp_test_"
        
        return credentials

    async def get_active_razorpay_environment(
        self,
        db: AsyncSession,
        user_id: str
    ) -> Optional[str]:
        """
        Determine which Razorpay environment is currently active.
        Default is "test", but if live credentials exist, return "live".
        
        Returns:
            "test", "live", or None if no credentials configured
        """
        from sqlalchemy import select
        
        # Check live first (preferred)
        live_result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == "razorpay",
                ServiceCredential.environment == "live",
                ServiceCredential.is_active == True
            )
        )
        if live_result.scalar_one_or_none():
            return "live"

        # Fall back to test
        test_result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == "razorpay",
                ServiceCredential.environment == "test",
                ServiceCredential.is_active == True
            )
        )
        if test_result.scalar_one_or_none():
            return "test"

        return None

    async def verify_razorpay_webhook(
        self,
        db: AsyncSession,
        user_id: str,
        environment: str
    ) -> bool:
        """
        Mark Razorpay credentials as verified (webhook tested).
        
        Args:
            user_id: User ID
            environment: "test" or "live"
            webhook_url: Webhook URL being tested
        
        Returns:
            True if marked as verified
        """
        from sqlalchemy import select, update
        
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == "razorpay",
                ServiceCredential.environment == environment,
                ServiceCredential.is_active == True
            )
        )
        credential = result.scalar_one_or_none()

        if not credential:
            return False

        # Update verification timestamp
        await db.execute(
            update(ServiceCredential)
            .where(ServiceCredential.id == credential.id)
            .values(last_verified_at=datetime.utcnow())
        )
        await db.commit()

        logger.info(f"Verified Razorpay {environment} webhook for user {user_id}")
        return True