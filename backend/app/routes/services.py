from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..models import ServiceCredential
from ..models.user import User
from ..services.credential_manager import CredentialManager

router = APIRouter()

class ServiceInfo(BaseModel):
    """Information about a connected service"""
    id: str
    service_name: str
    environment: str
    features: dict
    is_active: bool
    created_at: str
    credential_hint: str = ""  # Masked credential prefix for display (e.g., "rzp_test_Rrql***")

class ServicesResponse(BaseModel):
    """Response with all user's services"""
    services: List[ServiceInfo]
    has_services: bool
    total_count: int

class UpdateCredentialsRequest(BaseModel):
    """Request to update service credentials"""
    credentials: Dict[str, str]
    environment: str = "test"

@router.get("/services", response_model=ServicesResponse)
async def get_user_services(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    environment: str = "test",
    check_all: bool = False  # If true, check all environments (for has_services check)
):
    """
    Get all services connected by the user, filtered by environment

    Query Parameters:
    - environment: 'test' or 'live' (default: 'test')
    - check_all: If true, returns services from ALL environments (for dashboard redirect check)

    This endpoint is called by the dashboard to check:
    1. Does user have ANY services? (show onboarding vs dashboard) - use check_all=true
    2. Which services are connected? (display service cards)
    3. What features are enabled? (show feature toggles)
    4. Filter by environment: Only show test services in test mode, live in live mode
    """
    try:
        # Get user's preferred environment
        user_obj = await db.execute(select(User).where(User.id == user['id']))
        user_obj = user_obj.scalar_one_or_none()
        preferred_env = "test"
        if user_obj and user_obj.preferences:
            preferred_env = user_obj.preferences.get("current_environment", "test")

        # If default environment used, override with user's preference
        if environment == "test":
            environment = preferred_env

        # Validate environment parameter
        if environment not in ["test", "live"]:
            environment = "test"

        # Query services - either all environments or filtered
        if check_all:
            # For has_services check: get ALL active services regardless of environment
            result = await db.execute(
                select(ServiceCredential).where(
                    ServiceCredential.user_id == user["id"],
                    ServiceCredential.is_active
                )
            )
        else:
            # For display: filter by environment
            result = await db.execute(
                select(ServiceCredential).where(
                    ServiceCredential.user_id == user["id"],
                    ServiceCredential.is_active,
                    ServiceCredential.environment == environment
                )
            )
        credentials = result.scalars().all()
        
        # Helper to create masked credential hint
        def get_credential_hint(provider_name: str, decrypted_creds: dict) -> str:
            """Create a masked hint from credentials (e.g., 'rzp_test_Rrql***')"""
            try:
                if provider_name == "razorpay":
                    key_id = decrypted_creds.get("RAZORPAY_KEY_ID", "")
                    if key_id and len(key_id) > 8:
                        return f"{key_id[:12]}***"
                    return key_id[:8] + "***" if key_id else ""
                elif provider_name == "paypal":
                    client_id = decrypted_creds.get("PAYPAL_CLIENT_ID", "")
                    if client_id and len(client_id) > 8:
                        return f"{client_id[:12]}***"
                    return client_id[:8] + "***" if client_id else ""
                elif provider_name == "twilio":
                    sid = decrypted_creds.get("TWILIO_ACCOUNT_SID", "")
                    if sid and len(sid) > 8:
                        return f"{sid[:12]}***"
                    return sid[:8] + "***" if sid else ""
                return ""
            except Exception:
                return ""

        # Initialize credential manager for decryption
        credential_manager = CredentialManager()

        # Convert to response format
        services = []
        for cred in credentials:
            # Decrypt credentials to get hint (key ID only, not secrets)
            credential_hint = ""
            try:
                encrypted_bytes = bytes(cred.encrypted_credential)
                decrypted = credential_manager.decrypt_credentials(encrypted_bytes)
                credential_hint = get_credential_hint(cred.provider_name, decrypted)
            except Exception as e:
                print(f"Could not decrypt credentials for hint: {e}")
                credential_hint = "***configured***"

            services.append(ServiceInfo(
                id=str(cred.id),
                service_name=cred.provider_name,
                environment=cred.environment,
                features=cred.features_config or {},
                is_active=cred.is_active,
                created_at=cred.created_at.isoformat() if cred.created_at else "",
                credential_hint=credential_hint
            ))
        
        return ServicesResponse(
            services=services,
            has_services=len(services) > 0,
            total_count=len(services)
        )
        
    except Exception as e:
        print(f"Error fetching user services: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch services: {str(e)}")


@router.get("/services/{service_name}/status")
async def get_service_status(
    service_name: str,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if a specific service is connected
    
    Returns:
        {
            "connected": true/false,
            "environment": "test",
            "features": {...}
        }
    """
    try:
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user["id"],
                ServiceCredential.provider_name == service_name,
                ServiceCredential.is_active == True
            )
        )
        credential = result.scalar_one_or_none()
        
        if not credential:
            return {
                "connected": False,
                "service_name": service_name
            }
        
        return {
            "connected": True,
            "service_name": service_name,
            "environment": credential.environment,
            "features": credential.features_config or {},
            "created_at": credential.created_at.isoformat() if credential.created_at else ""
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/services/{service_name}/credentials")
async def update_service_credentials(
    service_name: str,
    request: UpdateCredentialsRequest,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update stored credentials for the specified service for the authenticated user.
    
    Parameters:
        request (UpdateCredentialsRequest): Object containing `credentials` (mapping of credential keys to values) and `environment` ("test" or "live") to apply.
    
    Returns:
        dict: Payload with keys `status` ("updated"), `service_name` (str), `environment` (str), and `message` (str) describing the result.
    
    Raises:
        HTTPException: 404 if no active credentials exist for the service; 400 if provided credentials fail validation; 500 for other failures during update.
    """
    try:
        user_id = str(user.get("id"))

        # Find the existing credential for this service and user
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == service_name,
                ServiceCredential.is_active == True
            )
        )
        credential = result.scalar_one_or_none()

        if not credential:
            raise HTTPException(status_code=404, detail=f"No active credentials found for {service_name}")

        # Validate the new credentials
        cred_manager = CredentialManager()
        validation_errors = cred_manager.validate_credentials_format(service_name, request.credentials)
        if validation_errors:
            raise HTTPException(status_code=400, detail=f"Invalid credentials: {validation_errors}")

        # Validate environment before persisting
        if request.environment not in ["test", "live"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid environment. Must be 'test' or 'live'"
            )

        # Encrypt and update the credentials
        encrypted_creds = cred_manager.encrypt_credentials(request.credentials)

        # Update the credential record
        await db.execute(
            update(ServiceCredential).where(
                ServiceCredential.id == credential.id
            ).values(
                encrypted_credential=encrypted_creds,
                environment=request.environment,
                updated_at=datetime.utcnow()
            )
        )

        await db.commit()

        return {
            "status": "updated",
            "service_name": service_name,
            "environment": request.environment,
            "message": f"Credentials for {service_name} updated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating credentials for {service_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update credentials: {str(e)}")


@router.delete("/services/{service_name}")
async def delete_service_credentials(
    service_name: str,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Disconnects a connected service for the current user by marking its credential record inactive.
    
    If no active credential exists for the given service and user, raises an HTTPException with status 404. On unexpected errors the function rolls back the DB transaction and raises an HTTPException with status 500.
    
    Parameters:
        service_name (str): The provider name to disconnect (e.g., "razorpay", "paypal").
    
    Returns:
        dict: {
            "status": "deleted",
            "service_name": <service_name>,
            "message": "<service_name> has been disconnected successfully"
        }
    
    Raises:
        HTTPException: 404 if no active credentials are found for the service.
        HTTPException: 500 if an unexpected error occurs while disconnecting the service.
    """
    try:
        user_id = str(user.get("id"))

        # Find the existing credential for this service and user
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == service_name,
                ServiceCredential.is_active == True
            )
        )
        credential = result.scalar_one_or_none()

        if not credential:
            raise HTTPException(
                status_code=404, 
                detail=f"No active credentials found for {service_name}. The service may already be disconnected."
            )

        # Soft delete by setting is_active to False
        await db.execute(
            update(ServiceCredential).where(
                ServiceCredential.id == credential.id
            ).values(
                is_active=False,
                updated_at=datetime.utcnow()
            )
        )

        await db.commit()

        return {
            "status": "deleted",
            "service_name": service_name,
            "message": f"{service_name} has been disconnected successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error deleting service {service_name}: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to disconnect service: {str(e)}"
        )


@router.delete("/services")
async def delete_all_services(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Soft-deletes all active service credentials for the current user by marking them inactive and updating their timestamps.
    
    Returns:
        dict: Payload containing:
            - status (str): `"deleted"` on success.
            - count (int): Number of credentials marked inactive.
            - message (str): Human-readable summary of the operation.
    """
    try:
        user_id = str(user.get("id"))

        # Find all active credentials for this user
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.is_active == True
            )
        )
        credentials = result.scalars().all()

        if not credentials:
            return {
                "status": "deleted",
                "count": 0,
                "message": "No active services to disconnect"
            }

        # Soft delete all credentials
        update_result = await db.execute(
            update(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.is_active == True
            ).values(
                is_active=False,
                updated_at=datetime.utcnow()
            )
        )

        deleted_count = update_result.rowcount
        await db.commit()

        return {
            "status": "deleted",
            "count": deleted_count,
            "message": f"All {deleted_count} services have been disconnected successfully"
        }

    except Exception as e:
        await db.rollback()
        print(f"Error deleting all services: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to disconnect services: {str(e)}"
        )


class SwitchAllEnvironmentsRequest(BaseModel):
    """Request to atomically switch all services to a target environment"""
    environment: str
    service_ids: List[str] = []


class VerifyEnvironmentRequest(BaseModel):
    """Request to verify environment switch success"""
    expected: str


class VerifyEnvironmentResponse(BaseModel):
    """Response indicating whether all services switched correctly"""
    all_switched: bool
    switched_count: int
    failed_count: int
    services: List[Dict[str, Any]]


@router.post("/services/switch-all-environments")
async def switch_all_environments_atomic(
    request: SwitchAllEnvironmentsRequest,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Atomically switch all (or specified) services to target environment.
    
    Uses database transaction to ensure all-or-nothing semantics:
    - If any service update fails, entire transaction rolls back
    - Prevents partial updates that could cause inconsistent state
    - Faster than sequential updates (single roundtrip)
    
    Args:
        request.environment: "test" or "live"
        request.service_ids: Optional list of service IDs to switch (empty = all)
    
    Returns:
        {
            "status": "switched",
            "environment": "live",
            "count": 5,
            "timestamp": "2025-12-25T10:30:00"
        }
    """
    try:
        user_id = str(user.get("id"))
        target_env = request.environment
        
        # Validate environment
        if target_env not in ["test", "live"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid environment. Must be 'test' or 'live'"
            )
        
        # If switching to live, verify user has live credentials configured
        if target_env == "live":
            result = await db.execute(
                select(ServiceCredential).where(
                    ServiceCredential.user_id == user_id,
                    ServiceCredential.provider_name == "razorpay",
                    ServiceCredential.environment == "live",
                    ServiceCredential.is_active == True
                )
            )
            live_creds = result.scalar_one_or_none()
            
            if not live_creds:
                raise HTTPException(
                    status_code=403,
                    detail="Cannot switch to live mode: Please configure live Razorpay credentials first"
                )
        
        # Use database transaction for atomicity
        async with db.begin_nested() as nested_transaction:
            # Build query for services to update
            query = select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.is_active == True
            )
            
            # Filter by specific service IDs if provided
            if request.service_ids and len(request.service_ids) > 0:
                query = query.where(
                    ServiceCredential.id.in_(request.service_ids)
                )
            
            # Fetch all matching services
            result = await db.execute(query)
            services_to_update = result.scalars().all()
            
            # If no services to update, that's OK - just update user preference instead
            if not services_to_update:
                # Update user's preferred environment even if no services exist yet
                # This allows users to set their environment preference before adding services
                user_record = await db.execute(
                    select(User).where(User.id == user_id)
                )
                user_obj = user_record.scalar_one_or_none()
                if user_obj:
                    if not user_obj.preferences:
                        user_obj.preferences = {}
                    user_obj.preferences["current_environment"] = target_env
                    await db.commit()
                
                return {
                    "status": "switched",
                    "environment": target_env,
                    "count": 0,
                    "message": "Environment preference updated (no services to migrate)",
                    "timestamp": datetime.utcnow().isoformat()
                }
            
            # Update all services in a single query for efficiency
            update_query = update(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.is_active == True
            )
            
            if request.service_ids and len(request.service_ids) > 0:
                update_query = update_query.where(
                    ServiceCredential.id.in_(request.service_ids)
                )
            
            update_query = update_query.values(
                environment=target_env,
                updated_at=datetime.utcnow()
            )
            
            result = await db.execute(update_query)
            updated_count = result.rowcount
            
            # Also update user's preferred environment
            user_record = await db.execute(
                select(User).where(User.id == user_id)
            )
            user_obj = user_record.scalar_one_or_none()
            if user_obj:
                if not user_obj.preferences:
                    user_obj.preferences = {}
                user_obj.preferences["current_environment"] = target_env
        
        # Commit the transaction
        await db.commit()
        
        return {
            "status": "switched",
            "environment": target_env,
            "count": updated_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error switching all environments: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to switch environments: {str(e)}"
        )


@router.post("/services/verify-environment", response_model=VerifyEnvironmentResponse)
async def verify_environment_switch(
    request: VerifyEnvironmentRequest,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify that all services are in the expected environment.
    
    Called after environment switch to confirm atomicity.
    If any service is in a different environment, returns failure.
    
    Args:
        request.expected: Expected environment ("test" or "live")
    
    Returns:
        {
            "all_switched": true/false,
            "switched_count": 5,
            "failed_count": 0,
            "services": [
                {"id": "...", "provider_name": "razorpay", "environment": "live", "switched": true},
                ...
            ]
        }
    """
    try:
        user_id = str(user.get("id"))
        expected_env = request.expected
        
        # Validate expected environment
        if expected_env not in ["test", "live"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid environment. Must be 'test' or 'live'"
            )
        
        # Fetch all active services for user
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.is_active == True
            )
        )
        services = result.scalars().all()
        
        if not services:
            return VerifyEnvironmentResponse(
                all_switched=True,
                switched_count=0,
                failed_count=0,
                services=[]
            )
        
        # Check each service
        switched_count = 0
        failed_count = 0
        service_details = []
        
        for service in services:
            is_switched = service.environment == expected_env
            if is_switched:
                switched_count += 1
            else:
                failed_count += 1
            
            service_details.append({
                "id": str(service.id),
                "name": service.provider_name,
                "environment": service.environment,
                "switched": is_switched
            })
        
        all_switched = failed_count == 0
        
        return VerifyEnvironmentResponse(
            all_switched=all_switched,
            switched_count=switched_count,
            failed_count=failed_count,
            services=service_details
        )
        
    except Exception as e:
        print(f"Error verifying environment switch: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to verify environment: {str(e)}"
        )