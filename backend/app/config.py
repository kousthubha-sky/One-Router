import os
import base64
from typing import Optional
from dotenv import load_dotenv
from cryptography.fernet import Fernet

# Load environment variables
load_dotenv()


class Settings:
    """Application settings"""

    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # Database
    DATABASE_URL: str

    # Clerk Authentication
    CLERK_SECRET_KEY: str = os.getenv("CLERK_SECRET_KEY", "")

    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_BASE_URL: str = os.getenv("API_BASE_URL", "http://localhost:8000")

    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ENCRYPTION_KEY: str = os.getenv("ENCRYPTION_KEY", "")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Rate Limiting
    DEFAULT_RATE_LIMIT_MINUTE: int = 60
    DEFAULT_RATE_LIMIT_DAY: int = 10000

    # Admin Configuration
    ADMIN_USER_IDS: list = []  # Will be populated from env var

    # File Upload
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".env", ".txt"}

    # Session Management
    SESSION_TTL_SECONDS: int = int(
        os.getenv("SESSION_TTL_SECONDS", "3600")
    )  # 1 hour default

    # Idempotency Settings
    IDEMPOTENCY_KEY_TTL_HOURS: int = int(
        os.getenv("IDEMPOTENCY_KEY_TTL_HOURS", "24")
    )  # 24 hours default
    IDEMPOTENCY_KEY_REQUIRED_ENDPOINTS: list = [
        "POST /v1/payments/orders",
        "POST /v1/refunds",
        "POST /v1/subscriptions",
    ]

    # Razorpay Configuration (for OneRouter's own payment processing)
    RAZORPAY_KEY_ID: str = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")
    RAZORPAY_WEBHOOK_SECRET: str = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")
    # Feature flag for Razorpay requirement: defaults to True in production, False in development.
    # Can be overridden with RAZORPAY_REQUIRED env var. Production enforcement is also applied in validate().
    RAZORPAY_REQUIRED: bool = os.getenv(
        "RAZORPAY_REQUIRED",
        "true" if os.getenv("ENVIRONMENT", "development") == "production" else "false"
    ).lower() == "true"

    def __init__(self):
        """Initialize settings and validate/generate encryption key"""
        # Load admin user IDs from environment variable (comma-separated)
        admin_ids_env = os.getenv("ADMIN_USER_IDS", "")
        self.ADMIN_USER_IDS = [
            uid.strip() for uid in admin_ids_env.split(",") if uid.strip()
        ]

        self._validate_and_setup_encryption_key()
        # handeling the issue of missing Connection string
        DB_URL = os.getenv("DATABASE_URL")
        
        if DB_URL:
            self.DATABASE_URL = DB_URL
        else:
            print("No connection string found for DB")
            exit()

    def _validate_and_setup_encryption_key(self):
        """Validate or generate encryption key based on environment"""
        if not self.ENCRYPTION_KEY:
            if self.ENVIRONMENT == "development":
                # Generate a new AES256 key for development
                import os

                key_bytes = os.urandom(32)
                self.ENCRYPTION_KEY = base64.b64encode(key_bytes).decode("utf-8")
                print(f"Generated development AES256 encryption key")
            else:
                raise RuntimeError(
                    "ENCRYPTION_KEY environment variable is required for production. "
                    "Generate a key using: import base64, os; print(base64.b64encode(os.urandom(32)).decode())"
                )
        else:
            # Validate provided key
            try:
                # Try to decode from base64
                key_bytes = base64.urlsafe_b64decode(self.ENCRYPTION_KEY)
                if len(key_bytes) != 32:
                    raise ValueError(
                        f"Invalid encryption key: must be 32 bytes (base64 encoded). "
                        f"Got {len(key_bytes)} bytes. Generate a valid key using: "
                        f"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
                    )
                # Verify it's a valid Fernet key by testing it
                Fernet(
                    self.ENCRYPTION_KEY.encode()
                    if isinstance(self.ENCRYPTION_KEY, str)
                    else self.ENCRYPTION_KEY
                )
            except Exception as e:
                raise ValueError(
                    f"Invalid ENCRYPTION_KEY format: {str(e)}. "
                    f"Must be a valid base64-encoded Fernet key. Generate one using: "
                    f"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
                )

    def validate(self):
        """Validate required settings"""
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL is required")

        if not self.CLERK_SECRET_KEY:
            raise ValueError("CLERK_SECRET_KEY is required")

        if not self.ENCRYPTION_KEY:
            raise ValueError("ENCRYPTION_KEY is required")

        # Validate Razorpay credentials if enabled (required in production, optional in development)
        if self.RAZORPAY_REQUIRED or self.ENVIRONMENT == "production":
            missing_razorpay = []
            
            if not self.RAZORPAY_KEY_ID:
                missing_razorpay.append("RAZORPAY_KEY_ID")
            if not self.RAZORPAY_KEY_SECRET:
                missing_razorpay.append("RAZORPAY_KEY_SECRET")
            if not self.RAZORPAY_WEBHOOK_SECRET:
                missing_razorpay.append("RAZORPAY_WEBHOOK_SECRET")
            
            if missing_razorpay:
                missing_vars = ", ".join(missing_razorpay)
                raise ValueError(
                    f"Razorpay payment processing is enabled but the following required "
                    f"environment variables are missing: {missing_vars}. "
                    f"Set these environment variables or set RAZORPAY_REQUIRED=false to disable Razorpay."
                )

        return True


# Global settings instance
settings = Settings()
