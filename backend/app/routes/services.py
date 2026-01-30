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
    environment: str  # The environment of this credential (test/live)
    active_environment: str = ""  # The user's selected active environment for this service
    features: dict
    is_active: bool
    created_at: str
    credential_hint: str = ""  # Masked credential prefix for display (e.g., "rzp_test_Rrql***")
    is_unified: bool = False  # Whether this service uses unified credentials (no test/live split)
    has_test_credentials: bool = False
    has_live_credentials: bool = False
    can_switch: bool = True  # Whether environment can be switched

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

        # Unified services (single API key, no test/live split) - always show regardless of environment
        UNIFIED_SERVICES = ["resend"]

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
            # For display: filter by environment OR include unified services
            from sqlalchemy import or_
            result = await db.execute(
                select(ServiceCredential).where(
                    ServiceCredential.user_id == user["id"],
                    ServiceCredential.is_active,
                    or_(
                        ServiceCredential.environment == environment,
                        ServiceCredential.provider_name.in_(UNIFIED_SERVICES)
                    )
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
                elif provider_name == "resend":
                    api_key = decrypted_creds.get("RESEND_API_KEY") or decrypted_creds.get("api_key", "")
                    if api_key and len(api_key) > 8:
                        return f"{api_key[:10]}***"
                    return api_key[:6] + "***" if api_key else ""
                return ""
            except Exception:
                return ""

        # Initialize credential manager for decryption
        credential_manager = CredentialManager()

        # Unified services list
        unified_services = ["resend"]

        # Get user's per-service environment preferences
        service_envs = {}
        if user_obj and user_obj.preferences:
            service_envs = user_obj.preferences.get("service_environments", {})

        # Get ALL credentials to determine what environments are available per service
        all_creds_result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user["id"],
                ServiceCredential.is_active == True
            )
        )
        all_creds = all_creds_result.scalars().all()

        # Build a map of service -> available environments
        service_creds_map = {}
        for c in all_creds:
            if c.provider_name not in service_creds_map:
                service_creds_map[c.provider_name] = {"test": False, "live": False}
            service_creds_map[c.provider_name][c.environment] = True

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

            # Determine active environment for this service
            is_unified = cred.provider_name.lower() in unified_services
            if is_unified:
                active_env = "live"  # Unified services are always "live"
            else:
                # Per-service setting > global setting
                active_env = service_envs.get(cred.provider_name.lower(), preferred_env)

            # Get available credentials info
            creds_info = service_creds_map.get(cred.provider_name, {"test": False, "live": False})

            services.append(ServiceInfo(
                id=str(cred.id),
                service_name=cred.provider_name,
                environment=cred.environment,
                active_environment=active_env,
                features=cred.features_config or {},
                is_active=cred.is_active,
                created_at=cred.created_at.isoformat() if cred.created_at else "",
                credential_hint=credential_hint,
                is_unified=is_unified,
                has_test_credentials=creds_info["test"],
                has_live_credentials=creds_info["live"],
                can_switch=not is_unified and (creds_info["test"] and creds_info["live"])
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


@router.get("/services/can-go-live")
async def can_go_live(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Check if user can switch to live mode.

    Returns which services have live credentials configured and which are missing.
    Only services with test credentials need live credentials to switch.

    Returns:
        {
            "can_go_live": true/false,
            "services_with_live": ["razorpay"],
            "services_missing_live": ["paypal"],
            "message": "Configure live credentials for: paypal"
        }
    """
    try:
        user_id = str(user.get("id"))

        # Get all services with test credentials (these need live creds to switch)
        test_services_result = await db.execute(
            select(ServiceCredential.provider_name).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.environment == "test",
                ServiceCredential.is_active == True
            ).distinct()
        )
        test_services = [row[0] for row in test_services_result.fetchall()]

        # Get all services with live credentials
        live_services_result = await db.execute(
            select(ServiceCredential.provider_name).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.environment == "live",
                ServiceCredential.is_active == True
            ).distinct()
        )
        live_services = [row[0] for row in live_services_result.fetchall()]

        # Find services missing live credentials
        missing_live = [s for s in test_services if s not in live_services]

        can_go_live = len(missing_live) == 0

        return {
            "can_go_live": can_go_live,
            "services_with_test": test_services,
            "services_with_live": live_services,
            "services_missing_live": missing_live,
            "message": f"Configure live credentials for: {', '.join(missing_live)}" if missing_live else "Ready to go live"
        }

    except Exception as e:
        print(f"Error checking can-go-live: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check live readiness: {str(e)}"
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
        
        # If switching to live, verify user has live credentials for all test services
        if target_env == "live":
            # Get all services with test credentials
            test_services_result = await db.execute(
                select(ServiceCredential.provider_name).where(
                    ServiceCredential.user_id == user_id,
                    ServiceCredential.environment == "test",
                    ServiceCredential.is_active == True
                ).distinct()
            )
            test_services = [row[0] for row in test_services_result.fetchall()]

            # Get all services with live credentials
            live_services_result = await db.execute(
                select(ServiceCredential.provider_name).where(
                    ServiceCredential.user_id == user_id,
                    ServiceCredential.environment == "live",
                    ServiceCredential.is_active == True
                ).distinct()
            )
            live_services = [row[0] for row in live_services_result.fetchall()]

            # Find services missing live credentials
            missing_live = [s for s in test_services if s not in live_services]

            if missing_live:
                raise HTTPException(
                    status_code=403,
                    detail=f"Cannot switch to live mode: Please configure live credentials for: {', '.join(missing_live)}"
                )
        
        # Environment switching should ONLY update user preference
        # NOT change the environment of credentials (they stay as test/live separately)
        # The system uses credentials matching the user's current_environment preference

        # Update user's preferred environment
        user_record = await db.execute(
            select(User).where(User.id == user_id)
        )
        user_obj = user_record.scalar_one_or_none()
        if user_obj:
            if not user_obj.preferences:
                user_obj.preferences = {}
            user_obj.preferences["current_environment"] = target_env
            # Flag the JSONB column as modified so SQLAlchemy detects the change
            flag_modified(user_obj, "preferences")

        # Commit the transaction
        await db.commit()

        return {
            "status": "switched",
            "environment": target_env,
            "message": f"Environment switched to {target_env}",
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


# ============================================
# Per-Service Environment Toggle
# ============================================

class ServiceEnvironmentToggleRequest(BaseModel):
    """Request to toggle a specific service's environment"""
    environment: str  # "test" or "live"


class ServiceEnvironmentResponse(BaseModel):
    """Response for per-service environment settings"""
    service_name: str
    active_environment: str
    has_test_credentials: bool
    has_live_credentials: bool


# Unified services that don't have test/live split
UNIFIED_SERVICES = ["resend"]


@router.post("/services/{service_name}/environment")
async def set_service_environment(
    service_name: str,
    request: ServiceEnvironmentToggleRequest,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Set the active environment for a specific service.

    This allows users to have different services in different environments.
    For example: Razorpay in live mode, Twilio in test mode.

    The per-service setting takes precedence over the global environment toggle.

    Parameters:
        service_name: The service to configure (e.g., "razorpay", "twilio")
        request.environment: "test" or "live"

    Returns:
        Updated service environment configuration
    """
    try:
        user_id = str(user.get("id"))
        target_env = request.environment.lower()

        if target_env not in ["test", "live"]:
            raise HTTPException(
                status_code=400,
                detail="Environment must be 'test' or 'live'"
            )

        # Unified services don't support environment switching
        if service_name.lower() in UNIFIED_SERVICES:
            raise HTTPException(
                status_code=400,
                detail=f"{service_name} uses unified credentials and doesn't support test/live switching"
            )

        # Check if user has credentials for the target environment
        result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == service_name.lower(),
                ServiceCredential.environment == target_env,
                ServiceCredential.is_active == True
            )
        )
        target_cred = result.scalar_one_or_none()

        if not target_cred:
            raise HTTPException(
                status_code=400,
                detail=f"No {target_env} credentials configured for {service_name}. Please add {target_env} credentials first."
            )

        # Get the user record to update preferences
        user_result = await db.execute(select(User).where(User.id == user_id))
        user_obj = user_result.scalar_one_or_none()

        if not user_obj:
            raise HTTPException(status_code=404, detail="User not found")

        # Update user preferences with per-service environment
        preferences = user_obj.preferences or {}
        if "service_environments" not in preferences:
            preferences["service_environments"] = {}

        preferences["service_environments"][service_name.lower()] = target_env

        # Update user
        await db.execute(
            update(User).where(User.id == user_id).values(
                preferences=preferences,
                updated_at=datetime.utcnow()
            )
        )
        flag_modified(user_obj, "preferences")
        await db.commit()

        # Check what credentials exist for this service
        all_creds_result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == service_name.lower(),
                ServiceCredential.is_active == True
            )
        )
        all_creds = all_creds_result.scalars().all()

        has_test = any(c.environment == "test" for c in all_creds)
        has_live = any(c.environment == "live" for c in all_creds)

        return {
            "success": True,
            "service_name": service_name,
            "active_environment": target_env,
            "has_test_credentials": has_test,
            "has_live_credentials": has_live,
            "message": f"{service_name} switched to {target_env} mode"
        }

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Error setting service environment: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to set service environment: {str(e)}"
        )


@router.get("/services/{service_name}/environment")
async def get_service_environment(
    service_name: str,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current environment setting for a specific service.

    Returns:
        - active_environment: The environment this service is using
        - has_test_credentials: Whether test credentials exist
        - has_live_credentials: Whether live credentials exist
        - is_unified: Whether this is a unified service (no test/live split)
    """
    try:
        user_id = str(user.get("id"))
        is_unified = service_name.lower() in UNIFIED_SERVICES

        # Get user preferences
        user_result = await db.execute(select(User).where(User.id == user_id))
        user_obj = user_result.scalar_one_or_none()

        preferences = user_obj.preferences if user_obj else {}
        global_env = preferences.get("current_environment", "test")
        service_envs = preferences.get("service_environments", {})

        # Per-service setting takes precedence over global
        active_env = service_envs.get(service_name.lower(), global_env)

        # For unified services, always return "live" (they don't have test/live split)
        if is_unified:
            active_env = "live"

        # Check what credentials exist
        all_creds_result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.provider_name == service_name.lower(),
                ServiceCredential.is_active == True
            )
        )
        all_creds = all_creds_result.scalars().all()

        has_test = any(c.environment == "test" for c in all_creds)
        has_live = any(c.environment == "live" for c in all_creds)

        return {
            "service_name": service_name,
            "active_environment": active_env,
            "has_test_credentials": has_test,
            "has_live_credentials": has_live,
            "is_unified": is_unified,
            "global_environment": global_env
        }

    except Exception as e:
        print(f"Error getting service environment: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get service environment: {str(e)}"
        )


@router.get("/services/environments")
async def get_all_service_environments(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get environment settings for all connected services.

    Returns a map of service_name -> environment configuration
    """
    try:
        user_id = str(user.get("id"))

        # Get user preferences
        user_result = await db.execute(select(User).where(User.id == user_id))
        user_obj = user_result.scalar_one_or_none()

        preferences = user_obj.preferences if user_obj else {}
        global_env = preferences.get("current_environment", "test")
        service_envs = preferences.get("service_environments", {})

        # Get all user's credentials
        all_creds_result = await db.execute(
            select(ServiceCredential).where(
                ServiceCredential.user_id == user_id,
                ServiceCredential.is_active == True
            )
        )
        all_creds = all_creds_result.scalars().all()

        # Group by service
        services_map = {}
        for cred in all_creds:
            service_name = cred.provider_name
            if service_name not in services_map:
                services_map[service_name] = {
                    "has_test": False,
                    "has_live": False
                }
            if cred.environment == "test":
                services_map[service_name]["has_test"] = True
            elif cred.environment == "live":
                services_map[service_name]["has_live"] = True

        # Build response
        result = {}
        for service_name, cred_info in services_map.items():
            is_unified = service_name in UNIFIED_SERVICES

            # Determine active environment
            if is_unified:
                active_env = "live"
            else:
                active_env = service_envs.get(service_name, global_env)

            result[service_name] = {
                "active_environment": active_env,
                "has_test_credentials": cred_info["has_test"],
                "has_live_credentials": cred_info["has_live"],
                "is_unified": is_unified,
                "can_switch_to_test": cred_info["has_test"] and not is_unified,
                "can_switch_to_live": cred_info["has_live"] and not is_unified
            }

        return {
            "global_environment": global_env,
            "services": result
        }

    except Exception as e:
        print(f"Error getting all service environments: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get service environments: {str(e)}"
        )