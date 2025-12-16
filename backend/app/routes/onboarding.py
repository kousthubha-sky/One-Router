from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

from ..database import get_db
from ..auth.dependencies import get_current_user
from ..services.env_parser import EnvParserService, ServiceDetection
from ..services.credential_manager import CredentialManager
from ..config import settings
import secrets
import time
import json
import os
from pathlib import Path

# Temporary storage for parsed env data (in production, use Redis/database)
# For development, persist to file to survive server restarts
SESSIONS_FILE = Path("parsed_sessions.json")
parsed_env_sessions = {}

def load_sessions():
    """Load sessions from file"""
    global parsed_env_sessions
    if SESSIONS_FILE.exists():
        try:
            with open(SESSIONS_FILE, 'r') as f:
                data = json.load(f)
                # Convert back to proper types
                parsed_env_sessions = {}
                for sid, sdata in data.items():
                    parsed_env_sessions[sid] = {
                        'env_vars': sdata['env_vars'],
                        'expires_at': sdata['expires_at'],
                        'user_id': sdata['user_id']
                    }
            print(f"Sessions loaded from {SESSIONS_FILE}: {len(parsed_env_sessions)} sessions")
        except Exception as e:
            print(f"Warning: Could not load sessions file: {e}")
            parsed_env_sessions = {}
    else:
        print(f"No sessions file found at {SESSIONS_FILE}")
        parsed_env_sessions = {}

def save_sessions():
    """Save sessions to file"""
    try:
        # Convert to JSON-serializable format
        data = {}
        for sid, sdata in parsed_env_sessions.items():
            data[sid] = {
                'env_vars': sdata['env_vars'],
                'expires_at': sdata['expires_at'],
                'user_id': sdata['user_id']
            }
        with open(SESSIONS_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Sessions saved to {SESSIONS_FILE}")
    except Exception as e:
        print(f"Warning: Could not save sessions file: {e}")
        import traceback
        traceback.print_exc()

# Load sessions on startup
load_sessions()

router = APIRouter()
env_parser = EnvParserService()
credential_manager = CredentialManager()

# Pydantic models for API requests/responses
class ParseResponse(BaseModel):
    detected_services: List[ServiceDetection]
    parsed_variables: int
    status: str
    errors: Optional[dict] = None
    session_id: Optional[str] = None

class ServiceConfig(BaseModel):
    service_name: str
    credentials: dict
    features: dict
    feature_metadata: Optional[dict] = {}

class ConfigureRequest(BaseModel):
    services: List[ServiceConfig]
    session_id: Optional[str] = None

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

        # Store parsed env_vars temporarily with session ID for secure credential extraction
        session_id = secrets.token_urlsafe(16)
        parsed_env_sessions[session_id] = {
            'env_vars': env_vars,
            'expires_at': time.time() + 3600,  # 1 hour expiry
            'user_id': user["id"]  # Associate with user for security
        }
        save_sessions()

        return ParseResponse(
            detected_services=detections,
            parsed_variables=len(env_vars),
            status="success",
            session_id=session_id
        )

    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please use UTF-8.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")





@router.post("/configure", response_model=ConfigureResponse)
async def configure_services(
    config: ConfigureRequest,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> ConfigureResponse:
    """Store selected service credentials WITH feature metadata"""

    try:
        # Get env_vars from session if session_id provided
        env_vars = {}
        if config.session_id:
            session_data = parsed_env_sessions.get(config.session_id)
            if session_data:
                if session_data.get('user_id') != user["id"]:
                    raise HTTPException(status_code=403, detail="Session does not belong to user")
                if session_data['expires_at'] < time.time():
                    del parsed_env_sessions[config.session_id]
                    save_sessions()
                    raise HTTPException(status_code=401, detail="Session expired or invalid. Please re-authenticate and try again.")
                else:
                    env_vars = session_data['env_vars']

        stored_services = []

        for service_config in config.services:
            service_name = service_config.service_name
            features = service_config.features

            # Get credentials from env_vars if available, otherwise use provided credentials
            credentials = service_config.credentials
            if not credentials and env_vars:
                # Extract credentials for this service from env_vars
                credentials = {}
                service_prefixes = {
                    'razorpay': ['RAZORPAY_'],
                    'paypal': ['PAYPAL_'],
                    'stripe': ['STRIPE_'],
                    'twilio': ['TWILIO_'],
                    'aws_s3': ['AWS_']
                }
                prefixes = service_prefixes.get(service_name, [service_name.upper() + '_'])
                for key, value in env_vars.items():
                    for prefix in prefixes:
                        if key.startswith(prefix):
                            credentials[key] = value
                            break

            # Validate credentials format
            if not credentials:
                logger.error(f"No credentials found for {service_name}. Session may have expired or credentials not provided.")
                continue

            validation_errors = credential_manager.validate_credentials_format(service_name, credentials)
            if validation_errors:
                # Skip this service but continue with others
                logger.error(f"Error storing credentials for {service_name}: {validation_errors}")
                continue

            # Store credentials
            try:
                feature_metadata = getattr(service_config, 'feature_metadata', {})
                credential = await credential_manager.store_service_credentials(
                    db=db,
                    user_id=user["id"],
                    service_name=service_name,
                    credentials=credentials,
                    features=features,
                    feature_metadata=feature_metadata,
                    environment="test"
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
            return ConfigureResponse(
                stored_services=[],
                message="No services were configured. Please check that your .env file contains valid credentials and try again."
            )

        # Clean up session
        if config.session_id and config.session_id in parsed_env_sessions:
            del parsed_env_sessions[config.session_id]
            save_sessions()  # Persist changes

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