#!/usr/bin/env python3
"""
Tests for Redis-based Session Management
"""

import asyncio
import sys
import os
sys.path.append('.')

from app.routes.onboarding import SecureSessionManager
from app.cache import cache_service

async def run_all_session_tests():
    """Run all session management tests in one async context"""
    print("Testing Redis-based Session Management\n")

    try:
        # Get Redis client once
        redis_client = await cache_service._get_redis()

        # Test 1: Create and retrieve session
        print("Running test 1: Session create and get...")
        import os
        test_key_bytes = os.urandom(32)  # 256-bit key
        session_manager = SecureSessionManager(redis_client, test_key_bytes)

        user_id = "test_user_123"
        env_vars = {
            "RAZORPAY_KEY_ID": "rzp_test_123",
            "RAZORPAY_KEY_SECRET": "secret_123"
        }

        session_id = await session_manager.create_session(user_id, env_vars, ttl=60)
        assert session_id is not None
        assert len(session_id) > 0

        retrieved_vars = await session_manager.get_session(session_id, user_id)
        assert retrieved_vars == env_vars

        await session_manager.delete_session(session_id)
        print("PASS: Session create and get test passed")

        # Test 2: Session expiry
        print("Running test 2: Session expiry...")
        test_key_bytes2 = os.urandom(32)
        session_manager2 = SecureSessionManager(redis_client, test_key_bytes2)

        user_id2 = "test_user_456"
        env_vars2 = {"TEST_VAR": "test_value"}

        session_id2 = await session_manager2.create_session(user_id2, env_vars2, ttl=1)
        await asyncio.sleep(2)  # Wait for expiry

        retrieved_vars2 = await session_manager2.get_session(session_id2, user_id2)
        assert retrieved_vars2 is None
        print("PASS: Session expiry test passed")

        # Test 3: Session ownership
        print("Running test 3: Session ownership...")
        test_key_bytes3 = os.urandom(32)
        session_manager3 = SecureSessionManager(redis_client, test_key_bytes3)

        user_id3 = "user_123"
        other_user_id3 = "user_456"
        env_vars3 = {"SECRET": "data"}

        session_id3 = await session_manager3.create_session(user_id3, env_vars3)

        retrieved_vars3 = await session_manager3.get_session(session_id3, other_user_id3)
        assert retrieved_vars3 is None

        await session_manager3.delete_session(session_id3)
        print("PASS: Session ownership test passed")

        # Test 4: Session count
        print("Running test 4: Session count...")
        test_key_bytes4 = os.urandom(32)
        session_manager4 = SecureSessionManager(redis_client, test_key_bytes4)

        initial_count = await session_manager4.get_session_count()

        session_ids = []
        for i in range(3):
            user_id4 = f"user_{i}"
            env_vars4 = {f"VAR_{i}": f"value_{i}"}
            session_id4 = await session_manager4.create_session(user_id4, env_vars4)
            session_ids.append(session_id4)

        new_count = await session_manager4.get_session_count()
        assert new_count >= initial_count + 3

        for session_id4 in session_ids:
            await session_manager4.delete_session(session_id4)
        print("PASS: Session count test passed")

        print("All session tests passed! Redis session management is working correctly.")
        return True

    except Exception as e:
        print(f"Session test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def run_session_tests():
    """Run session management tests"""
    return asyncio.run(run_all_session_tests())

if __name__ == "__main__":
    success = run_session_tests()
    sys.exit(0 if success else 1)