# backend/app/routes/resend_setup.py
"""
Resend setup and configuration for email services

Resend Environment Model:
- ONE API key for all environments (no separate test/live keys)
- Test mode is implicit: use onboarding@resend.dev as sender before domain verification
- Test recipients: delivered@resend.dev, bounced@resend.dev, complained@resend.dev
- Once domain is verified, you can send to real addresses from your custom domain
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Dict, Any, Optional
from pydantic import BaseModel
import logging
import httpx

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..services.credential_manager import CredentialManager
from ..models import ServiceCredential

router = APIRouter(prefix="/api/resend", tags=["resend"])
logger = logging.getLogger(__name__)


@router.get("/ping")
async def ping():
    """Simple test endpoint - no auth required"""
    return {"status": "ok", "service": "resend"}


class ResendCredentialsRequest(BaseModel):
    """Request to store Resend credentials - single API key for all environments"""
    api_key: str
    from_email: str  # Sender email (use onboarding@resend.dev for testing)


class ResendStatusResponse(BaseModel):
    """Response showing Resend configuration status"""
    test: Dict[str, Any]
    live: Dict[str, Any]
    active_environment: str


@router.post("/credentials")
async def store_resend_credentials(
    request: ResendCredentialsRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Store Resend credentials.

    Resend uses ONE API key for all environments:
    - For testing: use onboarding@resend.dev as from_email, send to delivered@resend.dev
    - For production: verify your domain and use your custom from_email
    """
    logger.info(f"[RESEND] store_resend_credentials called for user {user.get('id')}")
    try:
        # Validate API key format
        if not request.api_key.startswith("re_"):
            raise HTTPException(
                status_code=400,
                detail="Invalid API key. Must start with 're_'"
            )

        # Validate email format
        if "@" not in request.from_email or "." not in request.from_email:
            raise HTTPException(
                status_code=400,
                detail="Invalid email address format"
            )

        credential_manager = CredentialManager()

        # Prepare credentials dict
        credentials = {
            "RESEND_API_KEY": request.api_key,
            "from_email": request.from_email
        }

        # Store credentials - Resend uses single key, store as "live" since it works for production
        # The "test mode" is implicit based on domain verification status
        credential = await credential_manager.store_service_credentials(
            db=db,
            user_id=user["id"],
            service_name="resend",
            credentials=credentials,
            features={"email": True},
            environment="live"  # Resend has single key, not test/live split
        )

        logger.info(f"User {user['id']} stored Resend credentials")

        return {
            "success": True,
            "message": "Resend credentials stored successfully",
            "credential_id": str(credential.id),
            "note": "Use onboarding@resend.dev as sender for testing, or verify your domain for production"
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Validation error for Resend credentials: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to store Resend credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to store credentials")


@router.post("/validate-credentials")
async def validate_resend_credentials(
    request: ResendCredentialsRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Validate Resend credentials by making a test API call.
    Does NOT store credentials, only validates them.
    Also checks domain verification status.
    """
    try:
        # Validate API key format
        if not request.api_key.startswith("re_"):
            raise HTTPException(
                status_code=400,
                detail="Invalid API key. Must start with 're_'"
            )

        # Validate email format
        if "@" not in request.from_email or "." not in request.from_email:
            raise HTTPException(
                status_code=400,
                detail="Invalid email address format"
            )

        # Validate credentials by calling Resend API (get domains)
        url = "https://api.resend.com/domains"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                headers={
                    "Authorization": f"Bearer {request.api_key}",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code == 401:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid Resend API key - authentication failed"
                )
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Resend API error: {response.status_code}"
                )

            # Get domains info
            domains_data = response.json()
            domains = domains_data.get("data", [])
            verified_domains = [d for d in domains if d.get("status") == "verified"]

        logger.info(f"User {user['id']} validated Resend credentials")

        # Check if from_email domain is verified
        from_domain = request.from_email.split("@")[1] if "@" in request.from_email else ""
        is_verified = any(d.get("name") == from_domain for d in verified_domains)
        is_resend_dev = request.from_email.endswith("@resend.dev")

        return {
            "success": True,
            "valid": True,
            "message": "Credentials are valid",
            "domains": {
                "total": len(domains),
                "verified": len(verified_domains)
            },
            "from_email_status": "verified" if is_verified else ("sandbox" if is_resend_dev else "unverified"),
            "can_send_production": is_verified,
            "tip": "Use onboarding@resend.dev for testing, or verify your domain for production" if not is_verified else None
        }

    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(status_code=500, detail="Resend API timeout")
    except Exception as e:
        logger.error(f"Failed to validate Resend credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Validation failed")


@router.get("/status")
async def get_resend_status(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get Resend configuration status for current user.
    Resend uses a single API key (no test/live split).
    Returns structure compatible with frontend's ResendStatus interface.
    """
    try:
        credential_manager = CredentialManager()

        # Resend uses single key - check "live" environment (where we store it)
        creds = None
        try:
            creds = await credential_manager.get_credentials(
                db=db,
                user_id=user["id"],
                provider_name="resend",
                environment="live"
            )
        except Exception as err:
            logger.debug(f"No Resend credentials: {str(err)}")

        def get_api_key_prefix(credentials):
            if not credentials:
                return None
            api_key = credentials.get("RESEND_API_KEY") or credentials.get("api_key", "")
            return (api_key[:10] + "...") if api_key else None

        from_email = creds.get("from_email", "") if creds else None
        is_sandbox = from_email.endswith("@resend.dev") if from_email else False
        api_key_prefix = get_api_key_prefix(creds)

        # Return structure compatible with frontend ResendStatus interface
        # Resend is unified, so test/live show the same config
        return {
            "success": True,
            "test": {
                "configured": creds is not None,
                "api_key_prefix": api_key_prefix,
                "from_email": from_email
            },
            "live": {
                "configured": creds is not None,
                "api_key_prefix": api_key_prefix,
                "from_email": from_email
            },
            "active_environment": "live" if creds else None,
            "is_unified": True,
            "mode": "sandbox" if is_sandbox else "production" if creds else None,
            "note": "Resend uses one API key. Use onboarding@resend.dev for testing, verify domain for production."
        }

    except Exception as e:
        logger.error(f"Failed to get Resend status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/can-send-production")
async def can_send_production_resend(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Check if user can send production emails with Resend.

    For production sending:
    1. Credentials must be configured
    2. Domain should be verified (checked via API)
    """
    try:
        credential_manager = CredentialManager()

        # Check if credentials exist
        creds = None
        try:
            creds = await credential_manager.get_credentials(
                db=db,
                user_id=user["id"],
                provider_name="resend",
                environment="live"
            )
        except Exception:
            pass

        if not creds:
            return {
                "success": True,
                "can_send_production": False,
                "reason": "No Resend credentials configured",
                "next_steps": ["Add Resend API key and from email"]
            }

        from_email = creds.get("from_email", "")
        is_sandbox = from_email.endswith("@resend.dev")

        if is_sandbox:
            return {
                "success": True,
                "can_send_production": False,
                "reason": "Using sandbox sender (onboarding@resend.dev)",
                "next_steps": ["Verify your domain in Resend dashboard", "Update from_email to your verified domain"]
            }

        return {
            "success": True,
            "can_send_production": True,
            "from_email": from_email,
            "note": "Ensure your domain is verified in Resend dashboard"
        }

    except Exception as e:
        logger.error(f"Failed to check Resend production readiness: {str(e)}")
        raise HTTPException(status_code=500, detail="Check failed")


@router.delete("/credentials")
async def delete_resend_credentials(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete Resend credentials.
    """
    try:
        from datetime import datetime

        # Find and soft-delete the credential
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user["id"],
                ServiceCredential.provider_name == "resend",
                ServiceCredential.is_active == True
            )
        )
        credential = result.scalar_one_or_none()

        if not credential:
            raise HTTPException(
                status_code=404,
                detail="No Resend credentials found"
            )

        # Soft delete
        await db.execute(
            update(ServiceCredential).where(
                ServiceCredential.id == credential.id
            ).values(
                is_active=False,
                updated_at=datetime.utcnow()
            )
        )
        await db.commit()

        logger.info(f"User {user['id']} deleted Resend credentials")

        return {
            "success": True,
            "message": "Resend credentials deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete Resend credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Delete failed")
