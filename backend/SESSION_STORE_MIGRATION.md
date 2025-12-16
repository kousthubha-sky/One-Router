# Session Store Migration Guide

## Current State
- **File-based Storage**: `parsed_sessions.json` stores user session data on disk
- **Security Risk**: Contains PII (user_id) in plaintext in a committed file
- **Scalability Issue**: Not suitable for multi-instance deployments

## Issues to Address

### 1. PII in Repository
The `parsed_sessions.json` file may contain user identifiers in historical commits. 

**Action Items:**
- ✅ Cleared current file content
- ✅ Added to `.gitignore` (already present)
- ⚠️ **TODO**: Review git history for commits containing user IDs in `parsed_sessions.json`
  - Use: `git log -p --all -- parsed_sessions.json | grep -i "user_id"`
  - If found, consider: `git-filter-branch` or `BFG Repo-Cleaner` to remove from history
  - Update branch protections after cleanup

### 2. Migration to Proper Session Store

Replace file-based storage with one of:

#### Option A: Redis (Recommended for Production)
```python
# In app/config.py
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# In app/routes/onboarding.py
from redis.asyncio import Redis
redis = Redis.from_url(REDIS_URL)

# Store session
await redis.setex(
    f"session:{session_id}",
    3600,  # TTL in seconds
    json.dumps({"env_vars": {...}, "user_id": user_id})
)

# Retrieve session
session_data = await redis.get(f"session:{session_id}")
```

#### Option B: Database with Encryption
```python
# New model: app/models/session.py
class SessionStore(Base):
    __tablename__ = "sessions"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False, index=True)
    encrypted_data = Column(String, nullable=False)
    expires_at = Column(TIMESTAMP, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

# Use Fernet encryption for sensitive fields
```

#### Option C: FastAPI Sessions (SimpleMiddleware)
```python
from starlette.middleware.sessions import SessionMiddleware
from starlette.sessions import Session

app.add_middleware(SessionMiddleware, secret_key="your-secret-key")
```

### 3. Implementation Steps

1. **Choose storage backend** (Redis recommended)
2. **Update `app/routes/onboarding.py`**:
   - Replace `parsed_env_sessions` dict with Redis/DB calls
   - Update `save_sessions()` to persist to new store
   - Update session retrieval logic

3. **Add environment variables**:
   - `REDIS_URL` (or `SESSION_DB_URL`)
   - `SESSION_ENCRYPTION_KEY` (if using encrypted storage)

4. **Testing**:
   - Verify session creation and expiration
   - Test multi-instance scenarios
   - Ensure PII is not logged or exposed

5. **Deployment**:
   - Ensure session store is backed up
   - Monitor session growth/TTL
   - Set up alerts for expiration issues

## Security Best Practices

- ✅ Never store PII in plaintext
- ✅ Always encrypt sensitive session data
- ✅ Use short TTLs (15-60 minutes typical)
- ✅ Log session events (creation, expiration) without exposing user IDs
- ✅ Validate session ownership on every request
- ✅ Clear old sessions regularly

## Current Status
- `parsed_sessions.json`: **Cleared and in .gitignore** ✅
- Migration to proper store: **TODO** ⚠️
