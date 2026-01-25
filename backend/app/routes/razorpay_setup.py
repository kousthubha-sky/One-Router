# backend/app/routes/razorpay_setup.py
"""
Razorpay setup and configuration with test/live segregation
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, Literal, Optional
from pydantic import BaseModel
import logging

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..services.credential_manager import CredentialManager
from ..adapters.razorpay import RazorpayAdapter

router = APIRouter(prefix="/api/razorpay", tags=["razorpay"])
logger = logging.getLogger(__name__)


class RazorpayCredentialsRequest(BaseModel):
    """Request to store Razorpay credentials"""
    environment: Literal["test", "live"]
    key_id: str
    key_secret: str
    webhook_secret: Optional[str] = None


class RazorpayStatusResponse(BaseModel):
    """Response showing Razorpay configuration status"""
    test: Dict[str, Any]  # {configured, verified, key_prefix}
    live: Dict[str, Any]
    active_environment: str  # Currently active environment


@router.post("/credentials")
async def store_razorpay_credentials(
    request: RazorpayCredentialsRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Store Razorpay credentials for test or live environment.
    
    - Test keys must start with 'rzp_test_'
    - Live keys must start with 'rzp_live_'
    """
    try:
        credential_manager = CredentialManager()
        
        # Store credentials
        credential = await credential_manager.store_razorpay_credentials(
            db=db,
            user_id=user["id"],
            environment=request.environment,
            key_id=request.key_id,
            key_secret=request.key_secret,
            webhook_secret=request.webhook_secret,
            features={"payments": True, "refunds": True}
        )
        
        logger.info(f"User {user['id']} stored Razorpay {request.environment} credentials")
        
        return {
            "success": True,
            "environment": request.environment,
            "message": f"Razorpay {request.environment} credentials stored successfully",
            "credential_id": str(credential.id)
        }
    
    except ValueError as e:
        logger.warning(f"Validation error for Razorpay credentials: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to store Razorpay credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to store credentials")


@router.post("/validate-credentials")
async def validate_razorpay_credentials(
    request: RazorpayCredentialsRequest,
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Validate Razorpay credentials by making a test API call.
    Does NOT store credentials, only validates them.
    """
    try:
        # Create adapter with provided credentials
        adapter = RazorpayAdapter(
            credentials={
                "RAZORPAY_KEY_ID": request.key_id,
                "RAZORPAY_KEY_SECRET": request.key_secret
            },
            environment=request.environment
        )
        
        # Validate credentials
        is_valid = await adapter.validate_credentials()
        
        if not is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid Razorpay {request.environment} credentials"
            )
        
        logger.info(f"User {user['id']} validated Razorpay {request.environment} credentials")
        
        return {
            "success": True,
            "valid": True,
            "environment": request.environment,
            "message": "Credentials are valid"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to validate Razorpay credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Validation failed")


@router.get("/status")
async def get_razorpay_status(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get Razorpay configuration status for current user.
    Shows which environments are configured and verified.
    """
    try:
        credential_manager = CredentialManager()
        
        # Check test environment
        test_creds = None
        try:
            test_creds = await credential_manager.get_razorpay_credentials(
                db=db,
                user_id=user["id"],
                environment="test"
            )
        except Exception as test_err:
            logger.error(f"Error loading test credentials: {str(test_err)}")
            # Continue - test might just not be configured
        
        # Check live environment
        live_creds = None
        try:
            live_creds = await credential_manager.get_razorpay_credentials(
                db=db,
                user_id=user["id"],
                environment="live"
            )
        except Exception as live_err:
            logger.error(f"Error loading live credentials: {str(live_err)}")
            # Continue - live might just not be configured
        
        # Determine active environment
        active_env = None
        try:
            active_env = await credential_manager.get_active_razorpay_environment(
                db=db,
                user_id=user["id"]
            )
        except Exception as active_err:
            logger.error(f"Error determining active environment: {str(active_err)}")
            active_env = "test"  # Default to test
        
        return {
            "success": True,
            "test": {
                "configured": test_creds is not None,
                "verified": test_creds and test_creds.get("webhook_verified", False) if isinstance(test_creds, dict) else False,
                "key_prefix": (test_creds.get("RAZORPAY_KEY_ID", "")[:15] + "...") if test_creds and isinstance(test_creds, dict) and test_creds.get("RAZORPAY_KEY_ID") else None
            },
            "live": {
                "configured": live_creds is not None,
                "verified": live_creds and live_creds.get("webhook_verified", False) if isinstance(live_creds, dict) else False,
                "key_prefix": (live_creds.get("RAZORPAY_KEY_ID", "")[:15] + "...") if live_creds and isinstance(live_creds, dict) and live_creds.get("RAZORPAY_KEY_ID") else None
            },
            "active_environment": active_env or "test"
        }    
    except Exception as e:
        logger.error(f"Failed to get Razorpay status: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to get status: {str(e)}")


@router.post("/verify-webhook")
async def verify_razorpay_webhook(
    body: Dict[str, str] = Body(...),
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Mark Razorpay webhook as verified for specified environment.
    Should be called after successfully testing webhook delivery.
    
    Body:
        environment: "test" or "live"
        webhook_url: URL being used for webhooks
    """
    try:
        environment = body.get("environment")
        webhook_url = body.get("webhook_url")
        
        if not environment or environment not in ["test", "live"]:
            raise HTTPException(status_code=400, detail="Invalid environment")
        
        if not webhook_url:
            raise HTTPException(status_code=400, detail="webhook_url required")
        
        credential_manager = CredentialManager()
        
        # Verify webhook
        success = await credential_manager.verify_razorpay_webhook(
            db=db,
            user_id=user["id"],
            environment=environment
        )
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"No Razorpay {environment} credentials found"
            )
        
        logger.info(f"User {user['id']} verified Razorpay {environment} webhook")
        
        return {
            "success": True,
            "environment": environment,
            "webhook_url": webhook_url,
            "message": "Webhook verified successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook verification failed")


@router.get("/can-go-live")
async def can_go_live_razorpay(
    user: Dict[str, Any] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Check if user is ready to switch to live mode for Razorpay.
    
    Requirements:
    1. Live keys must be configured (rzp_live_*)
    """
    try:
        credential_manager = CredentialManager()
        
        live_creds = await credential_manager.get_razorpay_credentials(
            db=db,
            user_id=user["id"],
            environment="live"
        )
        
        # For MVP: just check if live keys are configured
        can_go_live = live_creds is not None
        
        next_steps = []
        if not can_go_live:
            next_steps.append("Add live Razorpay keys")
        
        return {
            "success": True,
            "can_go_live": can_go_live,
            "checks": {
                "live_keys_configured": can_go_live
            },
            "next_steps": next_steps
        }
    
    except Exception as e:
        logger.error(f"Failed to check live readiness: {str(e)}")
        raise HTTPException(status_code=500, detail="Check failed")
