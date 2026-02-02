"""
Role-Based Access Control (RBAC) Service
Manages user roles and permissions.
"""

from enum import Enum
from typing import List, Set, Optional, Dict, Any
from functools import wraps
from fastapi import HTTPException, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..auth.dependencies import get_current_user


class Role(str, Enum):
    """User roles with increasing privilege levels."""
    USER = "user"              # Default - can use API
    DEVELOPER = "developer"    # Can manage API keys, credentials
    ADMIN = "admin"            # Can view all users, system settings
    SUPER_ADMIN = "super_admin"  # Full access including destructive operations


class Permission(str, Enum):
    """Fine-grained permissions."""
    # API Usage
    API_READ = "api:read"
    API_WRITE = "api:write"

    # API Keys
    API_KEYS_READ = "api_keys:read"
    API_KEYS_WRITE = "api_keys:write"
    API_KEYS_DELETE = "api_keys:delete"

    # Credentials
    CREDENTIALS_READ = "credentials:read"
    CREDENTIALS_WRITE = "credentials:write"
    CREDENTIALS_DELETE = "credentials:delete"

    # Credits
    CREDITS_READ = "credits:read"
    CREDITS_PURCHASE = "credits:purchase"

    # Analytics
    ANALYTICS_READ = "analytics:read"
    ANALYTICS_EXPORT = "analytics:export"

    # Webhooks
    WEBHOOKS_READ = "webhooks:read"
    WEBHOOKS_WRITE = "webhooks:write"

    # Admin
    ADMIN_USERS_READ = "admin:users:read"
    ADMIN_USERS_WRITE = "admin:users:write"
    ADMIN_SETTINGS_READ = "admin:settings:read"
    ADMIN_SETTINGS_WRITE = "admin:settings:write"
    ADMIN_AUDIT_READ = "admin:audit:read"

    # GDPR
    GDPR_EXPORT = "gdpr:export"
    GDPR_DELETE = "gdpr:delete"


# Role to permissions mapping
ROLE_PERMISSIONS: Dict[Role, Set[Permission]] = {
    Role.USER: {
        Permission.API_READ,
        Permission.API_WRITE,
        Permission.API_KEYS_READ,
        Permission.CREDENTIALS_READ,
        Permission.CREDITS_READ,
        Permission.ANALYTICS_READ,
        Permission.WEBHOOKS_READ,
        Permission.GDPR_EXPORT,
    },
    Role.DEVELOPER: {
        # Inherits USER permissions
        Permission.API_READ,
        Permission.API_WRITE,
        Permission.API_KEYS_READ,
        Permission.API_KEYS_WRITE,
        Permission.API_KEYS_DELETE,
        Permission.CREDENTIALS_READ,
        Permission.CREDENTIALS_WRITE,
        Permission.CREDENTIALS_DELETE,
        Permission.CREDITS_READ,
        Permission.CREDITS_PURCHASE,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_EXPORT,
        Permission.WEBHOOKS_READ,
        Permission.WEBHOOKS_WRITE,
        Permission.GDPR_EXPORT,
        Permission.GDPR_DELETE,
    },
    Role.ADMIN: {
        # Inherits DEVELOPER permissions + admin read
        Permission.API_READ,
        Permission.API_WRITE,
        Permission.API_KEYS_READ,
        Permission.API_KEYS_WRITE,
        Permission.API_KEYS_DELETE,
        Permission.CREDENTIALS_READ,
        Permission.CREDENTIALS_WRITE,
        Permission.CREDENTIALS_DELETE,
        Permission.CREDITS_READ,
        Permission.CREDITS_PURCHASE,
        Permission.ANALYTICS_READ,
        Permission.ANALYTICS_EXPORT,
        Permission.WEBHOOKS_READ,
        Permission.WEBHOOKS_WRITE,
        Permission.ADMIN_USERS_READ,
        Permission.ADMIN_SETTINGS_READ,
        Permission.ADMIN_AUDIT_READ,
        Permission.GDPR_EXPORT,
        Permission.GDPR_DELETE,
    },
    Role.SUPER_ADMIN: {
        # All permissions
        *Permission.__members__.values()
    },
}


class RBACService:
    """Service for checking user permissions."""

    @staticmethod
    def get_user_role(user: Dict[str, Any]) -> Role:
        """Get the role for a user."""
        role_str = user.get("role", "user")
        try:
            return Role(role_str)
        except ValueError:
            return Role.USER

    @staticmethod
    def get_role_permissions(role: Role) -> Set[Permission]:
        """Get all permissions for a role."""
        return ROLE_PERMISSIONS.get(role, set())

    @staticmethod
    def has_permission(user: Dict[str, Any], permission: Permission) -> bool:
        """Check if user has a specific permission."""
        role = RBACService.get_user_role(user)
        permissions = RBACService.get_role_permissions(role)
        return permission in permissions

    @staticmethod
    def has_any_permission(user: Dict[str, Any], permissions: List[Permission]) -> bool:
        """Check if user has any of the specified permissions."""
        role = RBACService.get_user_role(user)
        user_permissions = RBACService.get_role_permissions(role)
        return bool(user_permissions.intersection(permissions))

    @staticmethod
    def has_all_permissions(user: Dict[str, Any], permissions: List[Permission]) -> bool:
        """Check if user has all of the specified permissions."""
        role = RBACService.get_user_role(user)
        user_permissions = RBACService.get_role_permissions(role)
        return all(p in user_permissions for p in permissions)

    @staticmethod
    async def get_user_with_role(
        user_id: str,
        db: AsyncSession
    ) -> Optional[Dict[str, Any]]:
        """Get user with their role from database."""
        from ..models import User

        result = await db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()

        if not user:
            return None

        return {
            "id": str(user.id),
            "email": user.email,
            "role": user.role if hasattr(user, 'role') else "user",
            "preferences": user.preferences or {}
        }


def require_permission(permission: Permission):
    """
    Decorator/dependency to require a specific permission.

    Usage:
        @router.get("/admin/users")
        async def get_users(user = Depends(require_permission(Permission.ADMIN_USERS_READ))):
            ...
    """
    async def permission_checker(
        user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        if not RBACService.has_permission(user, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied. Required: {permission.value}"
            )
        return user

    return permission_checker


def require_any_permission(*permissions: Permission):
    """Require any of the specified permissions."""
    async def permission_checker(
        user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        if not RBACService.has_any_permission(user, list(permissions)):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied. Required one of: {[p.value for p in permissions]}"
            )
        return user

    return permission_checker


def require_role(role: Role):
    """
    Require a specific role or higher.

    Usage:
        @router.post("/admin/settings")
        async def update_settings(user = Depends(require_role(Role.ADMIN))):
            ...
    """
    role_hierarchy = [Role.USER, Role.DEVELOPER, Role.ADMIN, Role.SUPER_ADMIN]

    async def role_checker(
        user: Dict[str, Any] = Depends(get_current_user)
    ) -> Dict[str, Any]:
        user_role = RBACService.get_user_role(user)
        user_level = role_hierarchy.index(user_role) if user_role in role_hierarchy else 0
        required_level = role_hierarchy.index(role)

        if user_level < required_level:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{role.value}' or higher required. Your role: {user_role.value}"
            )
        return user

    return role_checker
