import os
import logging
import httpx
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import jwt
from cryptography.hazmat.primitives import serialization
import base64
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models import User

security = HTTPBearer()
logger = logging.getLogger(__name__)

class ClerkAuth:
    def __init__(self):
        self.secret_key = os.getenv("CLERK_SECRET_KEY")
        self._initialized = False
        # Don't validate here - defer to when auth is actually used

        # Clerk's public key endpoint
        self.jwks_url = "https://api.clerk.com/v1/jwks"

    def _validate(self):
        """Validate that Clerk secret key is configured (called when auth is actually used)"""
        if self._initialized:
            return

        if not self.secret_key:
            raise ValueError(
                "CLERK_SECRET_KEY is not set. "
                "Please set a valid Clerk secret key in your .env file."
            )
        self._initialized = True

    async def get_public_key(self, kid: str) -> str:
        """Fetch the public key from Clerk's JWKS endpoint"""
        async with httpx.AsyncClient() as client:
            response = await client.get(self.jwks_url)
            response.raise_for_status()
            jwks = response.json()

        for key in jwks["keys"]:
            if key["kid"] == kid:
                # Convert JWK to PEM format
                n = base64.urlsafe_b64decode(key["n"] + "==")
                e = base64.urlsafe_b64decode(key["e"] + "==")

                from jwt.algorithms import RSAAlgorithm
                public_key = RSAAlgorithm.from_jwk(key)
                return public_key

        raise ValueError(f"Public key with kid {kid} not found")

    async def verify_token(self, token: str) -> dict:
        """Verify and decode a Clerk JWT token"""
        self._validate()  # Validate on first actual use

        if not token:
            raise HTTPException(status_code=401, detail="No token provided")

        try:
            # For development: decode without verification if using test/placeholder key
            if self.secret_key.startswith("sk_test_") or "placeholder" in self.secret_key.lower():
                try:
                    # Just decode without verification in development with test keys
                    payload = jwt.decode(token, options={"verify_signature": False})
                    # SECURITY: Don't log full payload - only log that token was decoded
                    logger.debug("Token decoded in development mode", extra={"sub": payload.get("sub", "unknown")[:8]})
                    return payload
                except jwt.DecodeError as e:
                    logger.debug("JWT decode error in development mode")
                    raise HTTPException(status_code=401, detail="Invalid token format")

            # For production: verify with Clerk's public keys
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")

            if not kid:
                raise HTTPException(status_code=401, detail="Invalid token: missing kid")

            # Get public key
            public_key = await self.get_public_key(kid)

            # Verify and decode token
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=self.secret_key,
                issuer="https://clerk.your-domain.com"
            )

            return payload

        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.InvalidTokenError as e:
            raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

    async def get_user_profile(self, user_id: str) -> dict:
        """Fetch full user profile from Clerk API"""
        self._validate()

        # Clerk API endpoint for user profile
        url = f"https://api.clerk.com/v1/users/{user_id}"
        logger.debug("Fetching user profile from Clerk API")

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers={
                        "Authorization": f"Bearer {self.secret_key}",
                        "Content-Type": "application/json"
                    }
                )
                logger.debug(f"Clerk API response", extra={"status_code": response.status_code})

                if response.status_code == 401:
                    # SECURITY: Don't log any part of the secret key
                    logger.error("Clerk authentication failed - check CLERK_SECRET_KEY configuration")
                    return {}
                elif response.status_code == 404:
                    logger.warning("User not found in Clerk", extra={"user_id_prefix": user_id[:8] if user_id else "unknown"})
                    return {}
                elif response.status_code == 403:
                    logger.error("Clerk API returned forbidden - check API permissions")
                    return {}

                response.raise_for_status()
                user_data = response.json()
                logger.debug("Successfully fetched user data from Clerk")

                # Extract user information
                email_addresses = user_data.get("email_addresses", [])
                primary_email = None
                if email_addresses:
                    # Find primary email or use first one
                    for email_addr in email_addresses:
                        if email_addr.get("id"):  # Has an ID, likely valid
                            primary_email = email_addr.get("email_address")
                            break
                    if not primary_email and email_addresses:
                        primary_email = email_addresses[0].get("email_address")

                first_name = user_data.get("first_name", "")
                last_name = user_data.get("last_name", "")
                full_name = " ".join(filter(None, [first_name, last_name])).strip()
                if not full_name:
                    full_name = user_data.get("username") or user_data.get("id")

                return {
                    "id": user_data.get("id"),
                    "email": primary_email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "name": full_name,
                    "username": user_data.get("username"),
                    "image_url": user_data.get("image_url")
                }

        except httpx.TimeoutException:
            logger.error("Timeout fetching user profile from Clerk API")
            return {}
        except httpx.HTTPError as e:
            logger.error("HTTP error fetching user profile from Clerk", extra={"error_type": type(e).__name__})
            return {}
        except Exception as e:
            logger.error("Unexpected error fetching user profile", extra={"error_type": type(e).__name__})
            return {}

# Global auth instance
clerk_auth = ClerkAuth()