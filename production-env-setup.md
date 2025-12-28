# Production Environment Variables Setup

## Backend Environment Variables (.env)

```bash
# Environment Configuration
ENVIRONMENT=production
DEBUG=false

# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database_name

# Clerk Authentication (Production Keys)
CLERK_SECRET_KEY=sk_production_your_clerk_secret_key_here

# Security Configuration
SECRET_KEY=your-32-character-secret-key-change-in-production
ENCRYPTION_KEY=your-base64-encoded-32-byte-fernet-key

# Frontend Configuration
FRONTEND_URL=https://yourdomain.com

# Optional: Session TTL (default 1 hour)
SESSION_TTL_SECONDS=3600

# Optional: Admin User IDs (comma-separated Clerk user IDs)
ADMIN_USER_IDS=user_2abc123,user_2def456
```

## Frontend Environment Variables (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-domain.com

# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_production_your_clerk_publishable_key_here
```

## Key Generation Commands

### Generate SECRET_KEY (32 characters)
```bash
openssl rand -hex 32
```

### Generate ENCRYPTION_KEY (Fernet key)
```python
from cryptography.fernet import Fernet
print(Fernet.generate_key().decode())
```

## Production Checklist

- [ ] Set ENVIRONMENT=production
- [ ] Set DEBUG=false
- [ ] Generate secure SECRET_KEY
- [ ] Generate ENCRYPTION_KEY using Fernet
- [ ] Configure production DATABASE_URL
- [ ] Set production CLERK_SECRET_KEY
- [ ] Set production FRONTEND_URL
- [ ] Configure NEXT_PUBLIC_API_URL for frontend
- [ ] Set production CLERK_PUBLISHABLE_KEY for frontend

## Security Notes

- Never commit .env files to version control
- Use different keys for development and production
- Rotate ENCRYPTION_KEY periodically for security
- Store secrets securely (AWS Secrets Manager, etc.)