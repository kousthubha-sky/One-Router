# API Key Security Implementation Guide

## Overview
This document outlines the security improvements made to API key management in OneRouter.

## Changes Implemented

### 1. Standard Authorization Header (Bearer Token)
**Files Modified:**
- `onerouter-sdk/onerouter/http_client.py`
- `backend/app/auth/dependencies.py`

**What Changed:**
- Replaced custom `X-Platform-Key` header with standard OAuth 2.0 `Authorization: Bearer {api_key}` header
- This aligns with industry standards and improves compatibility with security tools

**Before:**
```python
headers = {
    "X-Platform-Key": api_key,
    "Content-Type": "application/json"
}
```

**After:**
```python
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
```

### 2. Removed Hardcoded Demo Keys
**File Modified:**
- `backend/app/auth/dependencies.py`

**What Changed:**
- Removed hardcoded demo API key `unf_live_demo_key` and demo user `demo_user_123`
- API keys are now only loaded from the database/cache

### 3. Encryption for Redis Cache Storage
**Files Modified:**
- `backend/app/cache.py`

**What Changed:**
- Added Fernet symmetric encryption for API key data stored in Redis
- Keys are encrypted before storage and decrypted on retrieval
- Prevents data exposure if Redis instance is compromised

**Setup Required:**
```bash
# Generate encryption key (run once)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"

# Store in environment
export API_KEY_ENCRYPTION_KEY="<generated-key>"
```

**How It Works:**
```python
# Encryption on cache write
encrypted_data = self._cipher.encrypt(json.dumps(data).encode())
await redis.set(key, encrypted_data.decode(), ex=ttl)

# Decryption on cache read
decrypted_data = self._cipher.decrypt(encrypted_data.encode())
data = json.loads(decrypted_data.decode())
```

### 4. Key Rotation Support
**Files Modified:**
- `backend/app/models/api_key.py`
- `backend/alembic/versions/add_api_key_rotation.py` (new migration)

**New Fields Added:**
- `rotated_at`: Timestamp of last rotation
- `rotation_required`: Boolean flag to mark keys requiring rotation
- `rotated_from_id`: Foreign key reference to previous key version
- `updated_at`: Track when key metadata was last modified

**Database Migration:**
```bash
alembic upgrade add_api_key_rotation
```

## Security Best Practices

### 1. Encryption Key Management
- Store `API_KEY_ENCRYPTION_KEY` in environment variables, not in code
- Rotate encryption keys periodically
- Use different keys for different environments (dev, staging, prod)

### 2. API Key Rotation Strategy
```python
# Mark old key for rotation
old_key.rotation_required = True
old_key.rotated_at = datetime.utcnow()

# Create new key
new_key = ApiKey(
    user_id=user_id,
    key_hash=hash_api_key(new_api_key),
    rotated_from_id=old_key.id,
    ...
)

# Deactivate old key after grace period
old_key.is_active = False
```

### 3. Cache Configuration
- Set TTL appropriately (default: 5 minutes)
- Regularly clear expired cache entries
- Monitor Redis memory usage

### 4. Rate Limiting
API keys support rate limiting to prevent abuse:
- `rate_limit_per_min`: Requests per minute (default: 60)
- `rate_limit_per_day`: Requests per day (default: 10,000)

## Testing

### Test API Key Authentication
```bash
# Using Bearer token
curl -H "Authorization: Bearer unf_live_xxxxx" \
     https://api.onerouter.com/v1/health

# Old format will now fail
curl -H "X-Platform-Key: unf_live_xxxxx" \
     https://api.onerouter.com/v1/health
# Returns: 401 Invalid Authorization header format
```

### Test Encryption
```python
from app.cache import CacheService

cache = CacheService()

# Cache will be encrypted in Redis
await cache.cache_api_key(
    key_hash="abc123",
    user_id="user-123",
    is_active=True,
    environment="production",
    rate_limit_per_min=100
)

# Retrieve and decrypt
data = await cache.get_api_key("abc123")
assert data["user_id"] == "user-123"
```

## Migration Checklist

- [ ] Update `requirements.txt` to include `cryptography` package
- [ ] Generate `API_KEY_ENCRYPTION_KEY` and store in environment
- [ ] Run database migration: `alembic upgrade add_api_key_rotation`
- [ ] Update SDK clients to use Bearer token header
- [ ] Test API authentication with Bearer token
- [ ] Monitor Redis cache performance with encryption
- [ ] Update API documentation to reference Bearer token format
- [ ] Notify API users of header format change (with deprecation period)

## Deprecation Timeline

For backward compatibility during migration:
1. **Week 1-2**: Both headers accepted (X-Platform-Key and Bearer)
2. **Week 3-4**: Log warnings for X-Platform-Key usage
3. **Week 5+**: Only Bearer token accepted

Update `get_api_user` function temporarily for compatibility:
```python
async def get_api_user(request: Request) -> dict:
    """Get user from API key (supports both old and new formats)"""
    auth_header = request.headers.get("Authorization", "")
    x_platform_key = request.headers.get("X-Platform-Key", "")
    
    if auth_header.startswith("Bearer "):
        api_key = auth_header.split(" ", 1)[1]
    elif x_platform_key:
        logger.warning("X-Platform-Key header is deprecated. Use Authorization: Bearer instead")
        api_key = x_platform_key
    else:
        raise HTTPException(status_code=401, detail="Missing authentication")
    
    return await api_key_auth.validate_api_key(api_key)
```

## Environment Variables

Required for production:
```bash
# Encryption key for Redis cache
API_KEY_ENCRYPTION_KEY="<fernet-key>"

# Redis connection
REDIS_URL="redis://localhost:6379"

# Database
DATABASE_URL="postgresql+asyncpg://user:password@localhost/onerouter"
```

## Support & Troubleshooting

### Issue: "Invalid encryption key" error
- Verify `API_KEY_ENCRYPTION_KEY` is set correctly
- Key must be a valid Fernet key (base64 encoded)
- Regenerate if necessary: `python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"`

### Issue: Cache decryption failures
- Check that same encryption key is used across all instances
- Verify Redis contains valid encrypted data
- Clear Redis cache and restart if keys are mismatched

### Issue: Bearer token validation failures
- Ensure API key is properly formatted: `Authorization: Bearer <api_key>`
- Verify API key exists and is active in database
- Check that key hasn't expired

## References

- [RFC 6750 - OAuth 2.0 Bearer Token](https://tools.ietf.org/html/rfc6750)
- [Cryptography.io - Fernet](https://cryptography.io/en/latest/fernet/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
