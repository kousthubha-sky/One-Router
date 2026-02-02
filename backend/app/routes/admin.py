"""
Admin Routes
Administrative endpoints for user management, audit logs, and system settings.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..services.rbac_service import (
    require_permission, require_role,
    Permission, Role, RBACService
)
from ..services.audit_service import AuditService, AuditAction
from ..services.gdpr_service import GDPRService
from ..responses import success_response, paginated_response

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# =============================================================================
# AUDIT LOGS
# =============================================================================

@router.get("/audit-logs")
async def get_audit_logs(
    request: Request,
    limit: int = 100,
    offset: int = 0,
    user_id_filter: Optional[str] = None,
    action_filter: Optional[str] = None,
    response_format: str = "legacy",
    user=Depends(require_permission(Permission.ADMIN_AUDIT_READ)),
    db: AsyncSession = Depends(get_db)
):
    """
    Get audit logs (admin only).

    Query params:
        user_id_filter: Filter by user ID
        action_filter: Filter by action type
    """
    # Log this admin action
    await AuditService.log(
        db=db,
        user_id=user["id"],
        action=AuditAction.ADMIN_USER_VIEWED,
        resource_type="audit_logs",
        request=request,
        details={"filters": {"user_id": user_id_filter, "action": action_filter}}
    )

    result = await AuditService.get_admin_logs(
        db=db,
        limit=limit,
        offset=offset,
        user_id_filter=user_id_filter,
        action_filter=action_filter
    )

    if response_format == "standard":
        return paginated_response(
            data=result["logs"],
            total=result["total"],
            limit=limit,
            offset=offset,
            request_id=getattr(request.state, "request_id", "")
        )

    return result


@router.get("/audit-logs/user/{target_user_id}")
async def get_user_audit_logs(
    target_user_id: str,
    request: Request,
    limit: int = 100,
    offset: int = 0,
    user=Depends(require_permission(Permission.ADMIN_AUDIT_READ)),
    db: AsyncSession = Depends(get_db)
):
    """Get audit logs for a specific user (admin only)."""
    await AuditService.log(
        db=db,
        user_id=user["id"],
        action=AuditAction.ADMIN_USER_VIEWED,
        resource_type="user_audit_logs",
        resource_id=target_user_id,
        request=request
    )

    return await AuditService.get_user_logs(
        db=db,
        user_id=target_user_id,
        limit=limit,
        offset=offset
    )


# =============================================================================
# USER MANAGEMENT
# =============================================================================

@router.get("/users")
async def list_users(
    request: Request,
    limit: int = 50,
    offset: int = 0,
    user=Depends(require_permission(Permission.ADMIN_USERS_READ)),
    db: AsyncSession = Depends(get_db)
):
    """List all users (admin only)."""
    from sqlalchemy import select, func
    from ..models import User

    await AuditService.log(
        db=db,
        user_id=user["id"],
        action=AuditAction.ADMIN_USER_VIEWED,
        resource_type="users_list",
        request=request
    )

    # Get total count
    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar() or 0

    # Get users
    result = await db.execute(
        select(User).limit(limit).offset(offset)
    )
    users = result.scalars().all()

    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "role": getattr(u, "role", "user"),
                "created_at": u.created_at.isoformat() if u.created_at else None
            }
            for u in users
        ],
        "total": total,
        "limit": limit,
        "offset": offset
    }


class UpdateUserRoleRequest(BaseModel):
    role: str


@router.patch("/users/{target_user_id}/role")
async def update_user_role(
    target_user_id: str,
    request_body: UpdateUserRoleRequest,
    request: Request,
    user=Depends(require_permission(Permission.ADMIN_USERS_WRITE)),
    db: AsyncSession = Depends(get_db)
):
    """Update a user's role (admin only)."""
    from sqlalchemy import select, update
    from ..models import User

    # Validate role
    try:
        new_role = Role(request_body.role)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Must be one of: {[r.value for r in Role]}"
        )

    # Cannot promote to super_admin unless you are super_admin
    if new_role == Role.SUPER_ADMIN:
        user_role = RBACService.get_user_role(user)
        if user_role != Role.SUPER_ADMIN:
            raise HTTPException(
                status_code=403,
                detail="Only super admins can promote to super admin"
            )

    # Update user role
    await db.execute(
        update(User).where(User.id == target_user_id).values(role=new_role.value)
    )
    await db.commit()

    await AuditService.log(
        db=db,
        user_id=user["id"],
        action=AuditAction.ADMIN_USER_MODIFIED,
        resource_type="user",
        resource_id=target_user_id,
        request=request,
        details={"new_role": new_role.value}
    )

    return {"status": "updated", "user_id": target_user_id, "new_role": new_role.value}


# =============================================================================
# GDPR ENDPOINTS
# =============================================================================

@router.get("/gdpr/export")
async def export_my_data(
    request: Request,
    user=Depends(require_permission(Permission.GDPR_EXPORT)),
    db: AsyncSession = Depends(get_db)
):
    """
    Export all your personal data (GDPR Right to Access).

    Returns a JSON file containing all data associated with your account.
    """
    export_data = await GDPRService.export_user_data(
        user_id=user["id"],
        db=db,
        request=request
    )

    return export_data


class DeleteDataRequest(BaseModel):
    confirm: bool
    keep_audit_logs: bool = True


@router.post("/gdpr/delete")
async def delete_my_data(
    request_body: DeleteDataRequest,
    request: Request,
    user=Depends(require_permission(Permission.GDPR_DELETE)),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete all your personal data (GDPR Right to Erasure).

    This action is IRREVERSIBLE. All data will be permanently deleted.
    """
    if not request_body.confirm:
        raise HTTPException(
            status_code=400,
            detail="You must confirm deletion by setting confirm=true"
        )

    result = await GDPRService.delete_user_data(
        user_id=user["id"],
        db=db,
        request=request,
        keep_audit_logs=request_body.keep_audit_logs
    )

    return result


@router.post("/gdpr/anonymize")
async def anonymize_my_data(
    request: Request,
    user=Depends(require_permission(Permission.GDPR_DELETE)),
    db: AsyncSession = Depends(get_db)
):
    """
    Anonymize your personal data (alternative to deletion).

    Removes personally identifiable information while keeping
    anonymized transaction records.
    """
    result = await GDPRService.anonymize_user_data(
        user_id=user["id"],
        db=db
    )

    await AuditService.log(
        db=db,
        user_id=user["id"],
        action=AuditAction.GDPR_REQUEST,
        resource_type="user",
        request=request,
        details={"action": "anonymize"}
    )

    return result


# =============================================================================
# WEBHOOK MANAGEMENT
# =============================================================================

@router.get("/webhooks/failed")
async def get_failed_webhooks(
    request: Request,
    limit: int = 100,
    user=Depends(require_permission(Permission.ADMIN_SETTINGS_READ)),
    db: AsyncSession = Depends(get_db)
):
    """Get failed webhooks for monitoring (admin only)."""
    from ..services.webhook_retry_service import WebhookRetryService

    failed = await WebhookRetryService.get_failed_webhooks(
        db=db,
        limit=limit
    )

    return {"failed_webhooks": failed, "count": len(failed)}


@router.post("/webhooks/{webhook_id}/retry")
async def retry_webhook(
    webhook_id: str,
    request: Request,
    user=Depends(require_permission(Permission.ADMIN_SETTINGS_WRITE)),
    db: AsyncSession = Depends(get_db)
):
    """Manually retry a failed webhook (admin only)."""
    from ..services.webhook_retry_service import WebhookRetryService

    success = await WebhookRetryService.retry_webhook(
        webhook_id=webhook_id,
        db=db
    )

    if not success:
        raise HTTPException(status_code=404, detail="Webhook not found")

    await AuditService.log(
        db=db,
        user_id=user["id"],
        action=AuditAction.ADMIN_SETTINGS_CHANGED,
        resource_type="webhook",
        resource_id=webhook_id,
        request=request,
        details={"action": "manual_retry"}
    )

    return {"status": "queued", "webhook_id": webhook_id}


@router.post("/webhooks/process-pending")
async def process_pending_webhooks(
    request: Request,
    batch_size: int = 50,
    user=Depends(require_permission(Permission.ADMIN_SETTINGS_WRITE)),
    db: AsyncSession = Depends(get_db)
):
    """
    Process pending webhooks (admin/cron job).

    This endpoint should be called periodically by a cron job or background worker
    to process webhooks that failed initial delivery and are due for retry.

    POST /api/admin/webhooks/process-pending?batch_size=50
    """
    from ..services.webhook_retry_service import WebhookRetryService

    results = await WebhookRetryService.process_pending_webhooks(
        db=db,
        batch_size=batch_size
    )

    await AuditService.log(
        db=db,
        user_id=user["id"],
        action=AuditAction.ADMIN_SETTINGS_CHANGED,
        resource_type="webhook_processor",
        request=request,
        details={"results": results}
    )

    return {
        "status": "processed",
        "results": results,
        "message": f"Processed {sum(results.values())} webhooks"
    }
