#!/usr/bin/env python3
"""Test credential manager logging in development mode"""

import logging
import sys

# Configure logging to see the warnings
logging.basicConfig(
    level=logging.WARNING,
    format='%(name)s - %(levelname)s - %(message)s'
)

sys.path.insert(0, '.')

from app.services.credential_manager import CredentialManager

print("\n--- Creating CredentialManager in development mode ---")
manager = CredentialManager()
print("\n✓ CredentialManager created successfully")
print("✓ Test data encryption/decryption:")

# Test encryption/decryption
test_creds = {
    "RAZORPAY_KEY_ID": "rzp_test_123",
    "RAZORPAY_KEY_SECRET": "secret_123"
}

encrypted = manager.encrypt_credentials(test_creds)
decrypted = manager.decrypt_credentials(encrypted)

if decrypted == test_creds:
    print("  ✓ Encryption/decryption works correctly")
else:
    print("  ✗ Encryption/decryption FAILED")
