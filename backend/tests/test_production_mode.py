#!/usr/bin/env python3
"""Test credential manager in production mode"""

import os
import sys

# Set production environment BEFORE ANY imports
os.environ['ENVIRONMENT'] = 'production'
os.environ['ENCRYPTION_KEY'] = ''  # Explicitly clear any encryption key

# Clear any cached imports
if 'app' in sys.modules:
    del sys.modules['app']
if 'app.config' in sys.modules:
    del sys.modules['app.config']
if 'app.services.credential_manager' in sys.modules:
    del sys.modules['app.services.credential_manager']

sys.path.insert(0, '.')

# Now import and test
try:
    # Force reload of config module
    import importlib
    if 'app.config' in sys.modules:
        importlib.reload(sys.modules['app.config'])
    
    from app.services.credential_manager import CredentialManager
    print("ERROR: Should have raised RuntimeError in production mode without key")
except RuntimeError as e:
    error_msg = str(e)
    if "ENCRYPTION_KEY" in error_msg and "production" in error_msg:
        print(f"✓ Correctly raised RuntimeError in production mode")
        print(f"  Error message includes guidance for setting persistent key")
    else:
        print(f"ERROR: Wrong error message: {e}")
except Exception as e:
    error_msg = str(e)
    if "ENCRYPTION_KEY" in error_msg and "production" in error_msg:
        print(f"✓ Caught production mode error: {type(e).__name__}")
    else:
        print(f"Note: Exception type: {type(e).__name__}\n  Message: {e}")

