# backend/app/routes/twilio_setup.py
"""
Twilio setup and configuration with test/live segregation

Twilio Environment Model:
- Test credentials: Separate Account SID + Auth Token (from Twilio Console "Test Credentials")
- Live credentials: Production Account SID + Auth Token (from Twilio Console "Live Credentials")
- Magic number for testing: +15005550006
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Literal, Optional
from pydantic import BaseModel
import logging
import httpx

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..services.credential_manager import CredentialManager
from ..models import ServiceCredential

router = APIRouter(prefix="/api/twilio", tags=["twilio"])
logger = logging.getLogger(__name__)


@router.get("/ping")
async def ping():
    """Simple test endpoint - no auth required"""
    return {"status": "ok", "service": "twilio"}


class TwilioCredentialsRequest(BaseModel):
    """Request to store Twilio credentials"""
    environment: Literal["test", "live"]
    account_sid: str
    auth_token: str
    from_number: str  # Phone number to send SMS from (E.164 format)


class TwilioStatusResponse(BaseModel):
    """Response showing Twilio configuration status"""
    test: Dict[str, Any]  # {configured, verified, sid_prefix}
    live: Dict[str, Any]
    active_environment: str


@router.post("/credentials")
async def store_twilio_credentials(
    request: TwilioCredentialsRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Store Twilio credentials for test or live environment.

    - Account SID must start with 'AC'
    - From number should be in E.164 format (+1234567890)
    """
    logger.info(f"[TWILIO] store_twilio_credentials called for user {user.get('id')}, env={request.environment}")
    try:
        # Validate Account SID format
        if not request.account_sid.startswith("AC"):
            raise HTTPException(
                status_code=400,
                detail="Invalid Account SID. Must start with 'AC'"
            )

        # Validate from_number format (basic E.164 check)
        if not request.from_number.startswith("+"):
            raise HTTPException(
                status_code=400,
                detail="From number must be in E.164 format (e.g., +15005550006)"
            )

        credential_manager = CredentialManager()

        # Prepare credentials dict
        credentials = {
            "TWILIO_ACCOUNT_SID": request.account_sid,
            "TWILIO_AUTH_TOKEN": request.auth_token,
            "from_number": request.from_number
        }

        # Store credentials using the generic method
        credential = await credential_manager.store_service_credentials(
            db=db,
            user_id=user["id"],
            service_name="twilio",
            credentials=credentials,
            features={"sms": True, "voice": False},  # Start with SMS only
            environment=request.environment
        )

        logger.info(f"User {user['id']} stored Twilio {request.environment} credentials")

        return {
            "success": True,
            "environment": request.environment,
            "message": f"Twilio {request.environment} credentials stored successfully",
            "credential_id": str(credential.id)
        }

    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Validation error for Twilio credentials: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to store Twilio credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to store credentials")


@router.post("/validate-credentials")
async def validate_twilio_credentials(
    request: TwilioCredentialsRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Validate Twilio credentials by making a test API call.
    Does NOT store credentials, only validates them.
    """
    try:
        # Validate Account SID format
        if not request.account_sid.startswith("AC"):
            raise HTTPException(
                status_code=400,
                detail="Invalid Account SID. Must start with 'AC'"
            )

        # Validate credentials by calling Twilio API
        url = f"https://api.twilio.com/2010-04-01/Accounts/{request.account_sid}.json"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                url,
                auth=(request.account_sid, request.auth_token)
            )

            if response.status_code == 401:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid Twilio credentials - authentication failed"
                )
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=400,
                    detail=f"Twilio API error: {response.status_code}"
                )

            # Check account status
            account_data = response.json()
            account_status = account_data.get("status", "")

            if account_status not in ["active", "suspended"]:
                logger.warning(f"Twilio account status: {account_status}")

        logger.info(f"User {user['id']} validated Twilio {request.environment} credentials")

        return {
            "success": True,
            "valid": True,
            "environment": request.environment,
            "message": "Credentials are valid",
            "account_name": account_data.get("friendly_name", "")
        }

    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(status_code=500, detail="Twilio API timeout")
    except Exception as e:
        logger.error(f"Failed to validate Twilio credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Validation failed")


@router.get("/status")
async def get_twilio_status(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get Twilio configuration status for current user.
    Shows which environments are configured.
    """
    try:
        credential_manager = CredentialManager()

        # Check test environment
        test_creds = None
        try:
            test_creds = await credential_manager.get_credentials(
                db=db,
                user_id=user["id"],
                provider_name="twilio",
                environment="test"
            )
        except Exception as test_err:
            logger.debug(f"No test credentials: {str(test_err)}")

        # Check live environment
        live_creds = None
        try:
            live_creds = await credential_manager.get_credentials(
                db=db,
                user_id=user["id"],
                provider_name="twilio",
                environment="live"
            )
        except Exception as live_err:
            logger.debug(f"No live credentials: {str(live_err)}")

        # Determine active environment (prefer live if both exist)
        active_env = "test"
        if live_creds:
            active_env = "live"
        elif test_creds:
            active_env = "test"
        else:
            active_env = None

        return {
            "success": True,
            "test": {
                "configured": test_creds is not None,
                "sid_prefix": (test_creds.get("TWILIO_ACCOUNT_SID", "")[:10] + "...") if test_creds else None,
                "from_number": test_creds.get("from_number", "") if test_creds else None
            },
            "live": {
                "configured": live_creds is not None,
                "sid_prefix": (live_creds.get("TWILIO_ACCOUNT_SID", "")[:10] + "...") if live_creds else None,
                "from_number": live_creds.get("from_number", "") if live_creds else None
            },
            "active_environment": active_env
        }

    except Exception as e:
        logger.error(f"Failed to get Twilio status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.get("/can-go-live")
async def can_go_live_twilio(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Check if user is ready to switch to live mode for Twilio.

    Requirements:
    1. Live credentials must be configured
    """
    try:
        # Check if live credentials exist
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user["id"],
                ServiceCredential.provider_name == "twilio",
                ServiceCredential.environment == "live",
                ServiceCredential.is_active == True
            )
        )
        live_cred = result.scalar_one_or_none()

        can_go_live = live_cred is not None

        next_steps = []
        if not can_go_live:
            next_steps.append("Add live Twilio credentials")

        return {
            "success": True,
            "can_go_live": can_go_live,
            "checks": {
                "live_credentials_configured": can_go_live
            },
            "next_steps": next_steps
        }

    except Exception as e:
        logger.error(f"Failed to check Twilio live readiness: {str(e)}")
        raise HTTPException(status_code=500, detail="Check failed")


@router.delete("/credentials/{environment}")
async def delete_twilio_credentials(
    environment: Literal["test", "live"],
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete Twilio credentials for specified environment.
    """
    try:
        from sqlalchemy import update
        from datetime import datetime

        # Find and soft-delete the credential
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user["id"],
                ServiceCredential.provider_name == "twilio",
                ServiceCredential.environment == environment,
                ServiceCredential.is_active == True
            )
        )
        credential = result.scalar_one_or_none()

        if not credential:
            raise HTTPException(
                status_code=404,
                detail=f"No Twilio {environment} credentials found"
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

        logger.info(f"User {user['id']} deleted Twilio {environment} credentials")

        return {
            "success": True,
            "environment": environment,
            "message": f"Twilio {environment} credentials deleted"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Failed to delete Twilio credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Delete failed")
