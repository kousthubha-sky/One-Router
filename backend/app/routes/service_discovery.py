from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, Dict, Any
from ..services.registry import SERVICE_REGISTRY
from ..auth.dependencies import get_api_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/services")
async def list_services(
    category: Optional[str] = None,
    auth_data = Depends(get_api_user)
) -> Dict[str, Any]:
    """
    List all available services in the registry

    Query Parameters:
        category: Filter services by category (e.g., 'communications', 'payments')

    Returns:
        List of services with metadata
    """
    try:
        services = SERVICE_REGISTRY

        if category:
            services = {
                k: v for k, v in services.items()
                if v.get("category") == category
            }

        return {
            "services": [
                {
                    "name": name,
                    "category": config.get("category"),
                    "subcategory": config.get("subcategory"),
                    "features": list(config.get("endpoints", {}).keys()),
                    "pricing": config.get("pricing", {}),
                    "documentation_url": f"/docs/services/{name}"
                }
                for name, config in services.items()
            ]
        }

    except Exception as e:
        logger.error(f"Error listing services: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list services: {str(e)}")


@router.get("/services/{service_name}/schema")
async def get_service_schema(
    service_name: str,
    auth_data = Depends(get_api_user)
) -> Dict[str, Any]:
    """
    Get credential schema and endpoints for a specific service

    Path Parameters:
        service_name: Name of the service (e.g., 'twilio', 'resend')

    Returns:
        Service definition with credentials schema and available endpoints
    """
    if service_name not in SERVICE_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")

    service = SERVICE_REGISTRY[service_name]

    return {
        "service": service_name,
        "category": service.get("category"),
        "subcategory": service.get("subcategory"),
        "auth_type": service.get("auth_type"),
        "credentials_required": service.get("credentials_schema", {}),
        "endpoints": service.get("endpoints", {}),
        "webhooks": service.get("webhooks", {}),
        "rate_limits": service.get("rate_limits", {}),
        "pricing": service.get("pricing", {})
    }


@router.get("/services/categories")
async def list_categories(
    auth_data = Depends(get_api_user)
) -> Dict[str, Any]:
    """
    List all available service categories

    Returns:
        List of categories with their services
    """
    try:
        categories = {}

        for service_name, config in SERVICE_REGISTRY.items():
            category = config.get("category", "other")
            if category not in categories:
                categories[category] = []
            categories[category].append({
                "name": service_name,
                "subcategory": config.get("subcategory")
            })

        return {
            "categories": [
                {
                    "name": cat,
                    "services": services,
                    "count": len(services)
                }
                for cat, services in categories.items()
            ]
        }

    except Exception as e:
        logger.error(f"Error listing categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list categories: {str(e)}")


@router.get("/services/{service_name}/features")
async def get_service_features(
    service_name: str,
    auth_data = Depends(get_api_user)
) -> Dict[str, Any]:
    """
    Get available features/endpoints for a specific service

    Returns:
        List of features the service supports
    """
    if service_name not in SERVICE_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Service '{service_name}' not found")

    service = SERVICE_REGISTRY[service_name]
    endpoints = service.get("endpoints", {})

    return {
        "service": service_name,
        "features": [
            {
                "name": feature_name,
                "method": endpoint.get("method"),
                "path": endpoint.get("path"),
                "description": f"{endpoint.get('method')} {endpoint.get('path')}"
            }
            for feature_name, endpoint in endpoints.items()
        ]
    }
