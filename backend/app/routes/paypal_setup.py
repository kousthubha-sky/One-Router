# backend/app/routes/paypal_setup.py
"""
PayPal setup and configuration with sandbox/live segregation
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Literal, Optional
from pydantic import BaseModel
import logging

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..services.credential_manager import CredentialManager
from ..adapters.paypal import PayPalAdapter
from ..models import ServiceCredential

router = APIRouter(prefix="/api/paypal", tags=["paypal"])
logger = logging.getLogger(__name__)


class PayPalCredentialsRequest(BaseModel):
    """Request to store PayPal credentials"""
    environment: Literal["test", "live"]
    client_id: str
    client_secret: str
    webhook_id: Optional[str] = None


class PayPalStatusResponse(BaseModel):
    """Response showing PayPal configuration status"""
    test: Dict[str, Any]  # {configured, verified, client_id_prefix}
    live: Dict[str, Any]
    active_environment: str


@router.post("/credentials")
async def store_paypal_credentials(
    request: PayPalCredentialsRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Store PayPal credentials for sandbox or live environment.

    - Test/sandbox credentials work with PayPal sandbox
    - Live credentials work with PayPal production
    """
    try:
        credential_manager = CredentialManager()

        # Map environment to PayPal mode
        paypal_mode = "sandbox" if request.environment == "test" else "live"

        # Store credentials using generic method
        credential = await credential_manager.store_service_credentials(
            db=db,
            user_id=user["id"],
            service_name="paypal",
            environment=request.environment,
            credentials={
                "PAYPAL_CLIENT_ID": request.client_id,
                "PAYPAL_CLIENT_SECRET": request.client_secret,
                "PAYPAL_MODE": paypal_mode,
                "PAYPAL_WEBHOOK_ID": request.webhook_id or ""
            },
            features={"payments": True, "subscriptions": True}
        )

        logger.info(f"User {user['id']} stored PayPal {request.environment} credentials")

        return {
            "success": True,
            "environment": request.environment,
            "message": f"PayPal {request.environment} credentials stored successfully",
            "credential_id": str(credential.id)
        }

    except ValueError as e:
        logger.warning(f"Validation error for PayPal credentials: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to store PayPal credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to store credentials")


@router.post("/validate-credentials")
async def validate_paypal_credentials(
    request: PayPalCredentialsRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Validate PayPal credentials by attempting to get an access token.
    Does NOT store credentials, only validates them.
    """
    try:
        paypal_mode = "sandbox" if request.environment == "test" else "live"

        # Create adapter with provided credentials
        adapter = PayPalAdapter(
            credentials={
                "PAYPAL_CLIENT_ID": request.client_id,
                "PAYPAL_CLIENT_SECRET": request.client_secret,
                "PAYPAL_MODE": paypal_mode
            }
        )

        # Validate credentials by getting access token
        is_valid = await adapter.validate_credentials()

        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid PayPal {request.environment} credentials"
            )

        logger.info(f"User {user['id']} validated PayPal {request.environment} credentials")

        return {
            "success": True,
            "valid": True,
            "environment": request.environment,
            "message": "Credentials are valid"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to validate PayPal credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Validation failed")


@router.get("/status")
async def get_paypal_status(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get PayPal configuration status for current user.
    Shows which environments are configured.
    """
    try:
        credential_manager = CredentialManager()

        # Check test/sandbox environment
        test_creds = None
        try:
            test_creds = await credential_manager.get_credentials(
                db=db,
                user_id=user["id"],
                provider_name="paypal",
                environment="test"
            )
        except Exception as test_err:
            logger.debug(f"No PayPal test credentials: {str(test_err)}")

        # Check live environment
        live_creds = None
        try:
            live_creds = await credential_manager.get_credentials(
                db=db,
                user_id=user["id"],
                provider_name="paypal",
                environment="live"
            )
        except Exception as live_err:
            logger.debug(f"No PayPal live credentials: {str(live_err)}")

        # Get user's active environment preference
        active_env = "test"
        try:
            from ..models import User
            result = await db.execute(select(User).where(User.id == user["id"]))
            user_obj = result.scalar_one_or_none()
            if user_obj and user_obj.preferences:
                active_env = user_obj.preferences.get("current_environment", "test")
        except Exception:
            pass

        return {
            "success": True,
            "test": {
                "configured": test_creds is not None,
                "verified": False,  # PayPal doesn't have webhook verification like Razorpay
                "client_id_prefix": (test_creds.get("PAYPAL_CLIENT_ID", "")[:12] + "...") if test_creds and isinstance(test_creds, dict) and test_creds.get("PAYPAL_CLIENT_ID") else None
            },
            "live": {
                "configured": live_creds is not None,
                "verified": False,
                "client_id_prefix": (live_creds.get("PAYPAL_CLIENT_ID", "")[:12] + "...") if live_creds and isinstance(live_creds, dict) and live_creds.get("PAYPAL_CLIENT_ID") else None
            },
            "active_environment": active_env
        }
    except Exception as e:
        logger.error(f"Failed to get PayPal status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/can-go-live")
async def can_go_live_paypal(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Check if user is ready to switch to live mode for PayPal.

    Requirements:
    1. Live credentials must be configured
    """
    try:
        # Check if live credentials exist
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user["id"],
                ServiceCredential.provider_name == "paypal",
                ServiceCredential.environment == "live",
                ServiceCredential.is_active == True
            )
        )
        live_cred = result.scalar_one_or_none()

        can_go_live = live_cred is not None

        next_steps = []
        if not can_go_live:
            next_steps.append("Add live PayPal credentials")

        return {
            "success": True,
            "can_go_live": can_go_live,
            "checks": {
                "live_credentials_configured": can_go_live
            },
            "next_steps": next_steps
        }

    except Exception as e:
        logger.error(f"Failed to check PayPal live readiness: {str(e)}")
        raise HTTPException(status_code=500, detail="Check failed")
