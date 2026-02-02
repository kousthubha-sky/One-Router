from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import logging

from ..database import get_db
from ..auth.dependencies import get_current_user, get_api_user
from ..services.adapter_factory import AdapterFactory
from ..services.cost_tracker import cost_tracker
from ..services.credits_service import CreditsService
from ..models import ServiceCredential, TransactionLog, ApiKey
from ..models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_user_environment(db: AsyncSession, user_id: str) -> str:
    """Get user's current environment preference (test or live)"""
    try:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user and user.preferences:
            return user.preferences.get("current_environment", "test")
    except Exception as e:
        logger.warning(f"Could not get user environment preference: {e}")
    return "test"  # Default to test


class SMSRequest(BaseModel):
    """Request to send SMS message"""
    to: str = Field(..., description="Recipient phone number (E.164 format)")
    body: str = Field(..., min_length=1, max_length=1600, description="SMS message content")
    from_number: Optional[str] = Field(None, description="Override default from number")
    provider: Optional[str] = Field("twilio", description="Service provider (default: twilio)")
    idempotency_key: Optional[str] = Field(None, description="Prevent duplicate requests")


class SMSResponse(BaseModel):
    """Response after sending SMS"""
    message_id: str
    status: str
    service: str
    cost: float
    currency: str
    created_at: Optional[str] = None
    credits_deducted: bool = True
    credits_consumed: Optional[int] = None
    fee_details: Optional[Dict[str, Any]] = None


class EmailRequest(BaseModel):
    """Request to send email"""
    to: str = Field(..., description="Recipient email address")
    subject: str = Field(..., min_length=1, max_length=200, description="Email subject")
    html_body: Optional[str] = Field(None, description="HTML email body")
    text_body: Optional[str] = Field(None, description="Plain text email body")
    from_email: Optional[str] = Field(None, description="Override default from email")
    provider: Optional[str] = Field("resend", description="Service provider (default: resend)")
    idempotency_key: Optional[str] = Field(None, description="Prevent duplicate requests")


class EmailResponse(BaseModel):
    """Response after sending email"""
    email_id: str
    status: str
    service: str
    cost: float
    currency: str
    created_at: Optional[str] = None
    credits_deducted: bool = True
    credits_consumed: Optional[int] = None
    fee_details: Optional[Dict[str, Any]] = None


@router.post("/sms", response_model=SMSResponse, status_code=status.HTTP_201_CREATED)
async def send_sms(
    request: SMSRequest,
    auth_data = Depends(get_api_user),
    db: AsyncSession = Depends(get_db)
) -> SMSResponse:
    """
    Send SMS message using configured Twilio account

    This endpoint sends SMS through your configured Twilio account with automatic
    cost tracking and transaction logging.
    """
    from datetime import datetime
    import time

    try:
        user_id = auth_data["id"]
        user = {"id": user_id}
        api_key_obj = auth_data["api_key"]

        # Get user's environment preference
        environment = await get_user_environment(db, user_id)

        # Check idempotency key first (no credit consumed for cached response)
        if request.idempotency_key:
            result = await db.execute(
                select(TransactionLog).where(
                    TransactionLog.user_id == user_id,
                    TransactionLog.idempotency_key == request.idempotency_key
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                return SMSResponse(
                    message_id=existing.transaction_id,
                    status=existing.status,
                    service=existing.service_name,
                    cost=existing.cost or 0.0,
                    currency="USD",
                    created_at=existing.created_at.isoformat() if existing.created_at else None
                )

        # Get Twilio credentials for user's current environment
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == "twilio",
                ServiceCredential.environment == environment,
                ServiceCredential.is_active == True
            )
        )
        creds_result = result.scalar_one_or_none()

        if not creds_result:
            raise HTTPException(
                status_code=400,
                detail=f"Twilio {environment} credentials not configured. Please add your credentials in dashboard."
            )

        # Decrypt credentials
        from ..services.credential_manager import CredentialManager
        cred_manager = CredentialManager()
        decrypted_creds = await cred_manager.get_credentials(db, user_id, "twilio", environment)

        # Create adapter
        adapter = AdapterFactory.create_adapter("twilio", decrypted_creds)

        # Prepare parameters
        params = {
            "to": request.to,
            "body": request.body
        }

        if request.from_number:
            params["from_number"] = request.from_number
        else:
            params["from_number"] = decrypted_creds.get("from_number")

        # Start timer
        start_time = time.time()

        # Send SMS FIRST (before consuming credit)
        sms_result = await adapter.execute("send_sms", params)

        # SMS sent successfully - now consume credits based on usage (₹0.10 per SMS)
        credits_deducted = True
        credit_result = {"success": True, "fee_details": None}
        try:
            credit_result = await CreditsService.consume_for_usage(
                user_id=user_id,
                service_type="sms",
                count=1,  # 1 SMS
                db=db
            )
            if not credit_result["success"]:
                credits_deducted = False
                logger.warning(
                    f"Credit deduction failed after SMS {sms_result.get('id')}: "
                    f"insufficient balance ({credit_result.get('current_balance', 0)})"
                )
            else:
                logger.info(
                    f"Consumed {credit_result.get('fee_details', {}).get('credits_consumed', '?')} credits "
                    f"for 1 SMS (fee: ₹{credit_result.get('fee_details', {}).get('fee_rupees', '?')})"
                )
        except Exception as credit_error:
            credits_deducted = False
            logger.exception("Credit deduction failed after SMS: %s", credit_error)
        # Calculate cost
        cost = await cost_tracker.calculate_cost("twilio", "send_sms", params)
        response_time_ms = int((time.time() - start_time) * 1000)

        # Log transaction
        transaction = TransactionLog(
            user_id=user_id,
            api_key_id=api_key_obj.id if api_key_obj else None,
            transaction_id=sms_result.get("id", ""),
            idempotency_key=request.idempotency_key,
            service_name="twilio",
            provider_txn_id=sms_result.get("id"),
            endpoint="/Messages.json",
            http_method="POST",
            request_payload=params,
            response_payload=sms_result,
            response_status=200,
            response_time_ms=response_time_ms,
            status="sent",
            cost=cost,
            currency="USD",
            environment=environment,
            created_at=datetime.utcnow()
        )

        db.add(transaction)
        await db.commit()

        return SMSResponse(
            message_id=sms_result.get("id", ""),
            status="sent",
            service="twilio",
            cost=cost,
            currency="USD",
            created_at=datetime.utcnow().isoformat(),
            credits_deducted=credits_deducted,
            credits_consumed=credit_result.get("fee_details", {}).get("credits_consumed") if credits_deducted and credit_result.get("fee_details") else None,
            fee_details=credit_result.get("fee_details") if credits_deducted and credit_result.get("fee_details") else None
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"SMS sending failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send SMS: {str(e)}"
        )


@router.get("/sms/{message_id}")
async def get_sms_status(
    message_id: str,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get SMS delivery status by message ID

    Returns the current status of a previously sent SMS message.
    """
    try:
        # Get user ID (handle both dict and object formats)
        user_id = user.get("id") if isinstance(user, dict) else user.id

        # Get user's environment preference
        environment = await get_user_environment(db, str(user_id))

        # Get credentials
        from ..services.credential_manager import CredentialManager
        cred_manager = CredentialManager()
        decrypted_creds = await cred_manager.get_credentials(db, str(user_id), "twilio", environment)

        # Create adapter
        adapter = AdapterFactory.create_adapter("twilio", decrypted_creds)

        # Get SMS status
        result = await adapter.execute("get_sms", {"message_id": message_id})

        return {
            "message_id": message_id,
            "status": result.get("status"),
            "service": "twilio",
            "provider_data": result.get("provider_data", {})
        }

    except Exception as e:
        logger.error(f"Failed to get SMS status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get SMS status: {str(e)}"
        )


@router.post("/email", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
async def send_email(
    request: EmailRequest,
    auth_data = Depends(get_api_user),
    db: AsyncSession = Depends(get_db)
) -> EmailResponse:
    """
    Send email using configured Resend account

    This endpoint sends emails through your configured Resend account with automatic
    cost tracking and transaction logging.
    """
    from datetime import datetime
    import time

    try:
        user_id = auth_data["id"]
        api_key_obj = auth_data["api_key"]

        # Get user's environment preference
        environment = await get_user_environment(db, str(user_id))

        # Check idempotency key first (no credit consumed for cached response)
        if request.idempotency_key:
            result = await db.execute(
                select(TransactionLog).where(
                    TransactionLog.user_id == user_id,
                    TransactionLog.idempotency_key == request.idempotency_key
                )
            )
            existing = result.scalar_one_or_none()

            if existing:
                return EmailResponse(
                    email_id=existing.transaction_id,
                    status=existing.status,
                    service=existing.service_name,
                    cost=existing.cost or 0.0,
                    currency="USD",
                    created_at=existing.created_at.isoformat() if existing.created_at else None
                )

        # Get Resend credentials - Resend uses single API key (always stored as "live")
        # Unlike Twilio/Stripe, Resend doesn't have test/live key split
        resend_env = "live"  # Resend single key model
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == "resend",
                ServiceCredential.environment == resend_env,
                ServiceCredential.is_active == True
            )
        )
        creds_result = result.scalar_one_or_none()

        if not creds_result:
            raise HTTPException(
                status_code=400,
                detail="Resend credentials not configured. Please add your API key in dashboard."
            )

        # Decrypt credentials
        from ..services.credential_manager import CredentialManager
        cred_manager = CredentialManager()
        decrypted_creds = await cred_manager.get_credentials(db, str(user_id), "resend", resend_env)

        # Create adapter
        adapter = AdapterFactory.create_adapter("resend", decrypted_creds)

        # Prepare parameters
        params = {
            "to": request.to,
            "subject": request.subject
        }

        if request.html_body:
            params["html_body"] = request.html_body
        elif request.text_body:
            params["text_body"] = request.text_body
        else:
            raise HTTPException(
                status_code=400,
                detail="Either html_body or text_body is required"
            )

        if request.from_email:
            params["from_email"] = request.from_email
        else:
            params["from_email"] = decrypted_creds.get("from_email")

        # Start timer
        start_time = time.time()

        # Send email FIRST (before consuming credit)
        email_result = await adapter.execute("send_email", params)

        # Email sent successfully - now consume credits based on usage (₹0.001 per email)
        credits_deducted = True
        credit_result = {"success": True, "fee_details": None}
        try:
            credit_result = await CreditsService.consume_for_usage(
                user_id=str(user_id),
                service_type="email",
                count=1,  # 1 email
                db=db
            )
            if not credit_result["success"]:
                credits_deducted = False
                logger.warning(
                    f"Credit deduction failed after email {email_result.get('id')}: "
                    f"insufficient balance ({credit_result.get('current_balance', 0)})"
                )
            else:
                logger.info(
                    f"Consumed {credit_result.get('fee_details', {}).get('credits_consumed', '?')} credits "
                    f"for 1 email (fee: ₹{credit_result.get('fee_details', {}).get('fee_rupees', '?')})"
                )
        except Exception as credit_error:
            credits_deducted = False
            logger.error(f"Credit deduction failed after email: {credit_error}")

        # Calculate cost
        cost = await cost_tracker.calculate_cost("resend", "send_email", params)
        response_time_ms = int((time.time() - start_time) * 1000)

        # Log transaction
        transaction = TransactionLog(
            user_id=user_id,
            api_key_id=api_key_obj.id if api_key_obj else None,
            transaction_id=email_result.get("id", ""),
            idempotency_key=request.idempotency_key,
            service_name="resend",
            provider_txn_id=email_result.get("id"),
            endpoint="/emails",
            http_method="POST",
            request_payload=params,
            response_payload=email_result,
            response_status=200,
            response_time_ms=response_time_ms,
            status="sent",
            cost=cost,
            currency="USD",
            environment=environment,
            created_at=datetime.utcnow()
        )

        db.add(transaction)
        await db.commit()

        return EmailResponse(
            email_id=email_result.get("id", ""),
            status="sent",
            service="resend",
            cost=cost,
            currency="USD",
            created_at=datetime.utcnow().isoformat(),
            credits_deducted=credits_deducted,
            credits_consumed=credit_result.get("fee_details", {}).get("credits_consumed") if credits_deducted and credit_result.get("fee_details") else None,
            fee_details=credit_result.get("fee_details") if credits_deducted and credit_result.get("fee_details") else None
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Email sending failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send email: {str(e)}"
        )


@router.get("/email/{email_id}")
async def get_email_status(
    email_id: str,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get email delivery status by email ID

    Returns the current status of a previously sent email.
    """
    try:
        # Get email status from transaction log
        result = await db.execute(
            select(TransactionLog).where(
                TransactionLog.user_id == user.id,
                TransactionLog.transaction_id == email_id,
                TransactionLog.service_name == "resend"
            )
        )
        transaction = result.scalar_one_or_none()

        if not transaction:
            raise HTTPException(
                status_code=404,
                detail="Email not found"
            )

        return {
            "email_id": email_id,
            "status": transaction.status,
            "service": "resend",
            "created_at": transaction.created_at.isoformat() if transaction.created_at else None,
            "provider_data": transaction.provider_txn_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get email status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get email status: {str(e)}"
        )
