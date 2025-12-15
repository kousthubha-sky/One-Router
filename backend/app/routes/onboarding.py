from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
import logging
from ..database import get_db
from ..auth.dependencies import get_current_user
from ..services.env_parser import EnvParserService, ServiceDetection
from ..services.credential_manager import CredentialManager
from ..config import settings

router = APIRouter()
env_parser = EnvParserService()
credential_manager = CredentialManager()

# Pydantic models for API requests/responses
class ParseResponse(BaseModel):
    detected_services: List[ServiceDetection]
    parsed_variables: int
    status: str
    errors: Optional[dict] = None

class ServiceConfig(BaseModel):
    service_name: str
    credentials: dict
    features: dict

class ConfigureRequest(BaseModel):
    services: List[ServiceConfig]

class StoredService(BaseModel):
    service_name: str
    status: str
    credential_id: str

class ConfigureResponse(BaseModel):
    stored_services: List[StoredService]
    message: str

@router.post("/parse", response_model=ParseResponse)
async def parse_env_file(
    file: UploadFile = File(...),
    user = Depends(get_current_user)
) -> ParseResponse:
    """Parse uploaded .env file and detect services"""
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith(('.env', '.txt')):
            raise HTTPException(status_code=400, detail="Only .env or .txt files are allowed")

        # Read file content
        content = await file.read()
        content_str = content.decode('utf-8')

        # Check file size
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE} bytes")

        # Validate .env syntax
        syntax_errors = env_parser.validate_env_syntax(content_str)
        if syntax_errors:
            return ParseResponse(
                detected_services=[],
                parsed_variables=0,
                status="error",
                errors=syntax_errors
            )

        # Parse environment variables
        env_vars = env_parser.parse_env_content(content_str)

        # Detect services
        detections = env_parser.detect_services(env_vars)

        return ParseResponse(
            detected_services=detections,
            parsed_variables=len(env_vars),
            status="success"
        )

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please use UTF-8.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.post("/parse-test", response_model=ParseResponse)
async def parse_env_file_test(
    file: UploadFile = File(...)
) -> ParseResponse:
    """Test endpoint without authentication for development"""
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith(('.env', '.txt')):
            raise HTTPException(status_code=400, detail="Only .env or .txt files are allowed")

        # Read file content
        content = await file.read()
        content_str = content.decode('utf-8')

        # Check file size
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE} bytes")

        # Validate .env syntax
        syntax_errors = env_parser.validate_env_syntax(content_str)
        if syntax_errors:
            return ParseResponse(
                detected_services=[],
                parsed_variables=0,
                status="error",
                errors=syntax_errors
            )

        # Parse environment variables
        env_vars = env_parser.parse_env_content(content_str)

        # Detect services
        detections = env_parser.detect_services(env_vars)

        return ParseResponse(
            detected_services=detections,
            parsed_variables=len(env_vars),
            status="success"
        )

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please use UTF-8.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

logger = logging.getLogger(__name__)

@router.post("/configure", response_model=ConfigureResponse)
async def configure_services(
    config: ConfigureRequest,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ConfigureResponse:
    """Store selected service credentials"""

    try:
        stored_services = []

        for service_config in config.services:
            service_name = service_config.service_name
            credentials = service_config.credentials
            features = service_config.features

            # Validate credentials format
            validation_errors = credential_manager.validate_credentials_format(service_name, credentials)
            if validation_errors:
                # Skip this service but continue with others
                logger.error(f"Error storing credentials for {service_name}: {validation_errors}")
                continue

            # Store credentials
            try:
                credential = await credential_manager.store_service_credentials(
                    db=db,
                    user_id=user["id"],
                    service_name=service_name,
                    credentials=credentials,
                    features=features,
                    environment="test"  # Default to test environment
                )

                stored_services.append(StoredService(
                    service_name=service_name,
                    status="connected",
                    credential_id=str(credential.id)
                ))

            except Exception as e:
                logger.error(f"Error storing credentials for {service_name}: {e}")
                continue

        if not stored_services:
            raise HTTPException(status_code=400, detail="No services were successfully configured")

        return ConfigureResponse(
            stored_services=stored_services,
            message=f"Successfully connected {len(stored_services)} services"
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error configuring services: {str(e)}")

@router.get("/services")
async def get_user_services(
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's configured services"""

    try:
        services = await credential_manager.get_user_credentials(
            db=db,
            user_id=user["id"],
            environment="test"
        )

        return {
            "services": services,
            "count": len(services)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching services: {str(e)}")