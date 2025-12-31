import asyncio
import sys
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import random

sys.path.insert(0, '.')

from app.database import get_db
from app.models.user import User
from app.models.api_key import ApiKey
from app.models.service_credential import ServiceCredential
from app.models.transaction_log import TransactionLog


DEMO_USERS = [
    {
        "name": "E-commerce Platform",
        "email": "ecommerce@demo.onerouter.com",
        "services": ["twilio", "resend"],
        "usage": {
            "sms": 100,
            "email": 150
        }
    },
    {
        "name": "SaaS Application",
        "email": "saas@demo.onerouter.com",
        "services": ["twilio", "resend"],
        "usage": {
            "sms": 80,
            "email": 120
        }
    },
    {
        "name": "Marketplace",
        "email": "marketplace@demo.onerouter.com",
        "services": ["twilio", "resend"],
        "usage": {
            "sms": 120,
            "email": 100
        }
    },
    {
        "name": "Booking Platform",
        "email": "booking@demo.onerouter.com",
        "services": ["resend"],
        "usage": {
            "email": 200
        }
    },
    {
        "name": "Fitness App",
        "email": "fitness@demo.onerouter.com",
        "services": ["twilio"],
        "usage": {
            "sms": 150
        }
    }
]


def generate_random_phone():
    prefixes = ["+91", "+1", "+44", "+86"]
    prefix = random.choice(prefixes)
    return f"{prefix}{random.randint(1000000, 9999999999)}"


def generate_random_email():
    domains = ["gmail.com", "yahoo.com", "outlook.com"]
    return f"user{random.randint(1000, 9999)}@{random.choice(domains)}"


def generate_status():
    weights = ["success"] * 95 + ["failed"] * 3 + ["pending"] * 2
    return random.choice(weights)


def generate_sample_message():
    sms_messages = [
        f"Your OTP is {random.randint(1000, 9999)}. Valid for 10 minutes.",
        f"Your order #ORD{random.randint(10000, 99999)} has been shipped.",
        f"Payment of ${random.randint(10, 500)} successful. Thank you!",
        f"Your subscription has been renewed successfully.",
        f"Welcome to our platform! Your account is now active.",
    ]

    email_subjects = [
        f"Order Confirmation - Order #{random.randint(10000, 99999)}",
        "Welcome to our platform!",
        "Your subscription has been renewed",
        "Password Reset Request",
        f"Monthly Invoice - {datetime.now().strftime('%B %Y')}",
    ]

    email_bodies = [
        "<h1>Order Confirmation</h1><p>Thank you for your order!</p>",
        "<h1>Welcome!</h1><p>Your account has been created successfully.</p>",
        "<h1>Subscription Renewed</h1><p>Your subscription has been renewed for another month.</p>",
        "<h1>Click the button below to reset your password.</p>",
        "",
    ]

    return {
        "sms": random.choice(sms_messages),
        "email_subject": random.choice(email_subjects),
        "email_body": random.choice(email_bodies)
    }


async def create_demo_user(user_data: dict, db: AsyncSession):
    """Create a demo user with realistic usage data"""

    print(f"\n[CREATE] Creating user: {user_data['name']}")

    stmt = select(User).where(User.email == user_data["email"])
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user:
        print(f"   [OK] User already exists: {user_data['email']}")
        return existing_user

    from uuid import uuid4
    now = datetime.utcnow()
    user = User(
        id=str(uuid4()),
        email=user_data["email"],
        name=user_data["name"],
        clerk_user_id=f"demo_{user_data['email'].replace('@', '_at_')}",
        created_at=now,
        updated_at=now
    )

    db.add(user)
    await db.flush()
    await db.refresh(user)

    print(f"   [OK] User created: {user.email} (ID: {user.id})")

    # Create API key for user
    import secrets
    api_key = ApiKey(
        user_id=user.id,
        key_name="Demo API Key",
        key_hash=secrets.token_hex(16),
        key_prefix="unf_test",
        environment="test",
        is_active=True,
        rate_limit_per_min=100,
        rate_limit_per_day=10000,
        expires_at=datetime.utcnow() + timedelta(days=365)
    )

    db.add(api_key)
    await db.flush()
    await db.refresh(api_key)

    print(f"   [OK] API key created: {api_key.key_prefix}_xxx")

    # Store encrypted credentials for each service
    for service in user_data["services"]:
        service_credential = ServiceCredential(
            user_id=user.id,
            service_name=service,
            environment="test",
            credentials_encrypted=b"dummy_encrypted_credentials_for_{service}",
            features_config={
                "sms": {"enabled": True} if service == "twilio" else {},
                "email": {"enabled": True} if service == "resend" else {}
            },
            is_active=True
        )

        db.add(service_credential)
        await db.flush()

        print(f"   [OK] Service configured: {service}")

    # Generate transaction history
    messages = generate_sample_message()

    for service in user_data["services"]:
        usage_count = user_data["usage"].get(service, 0)

        for i in range(usage_count):
            status = generate_status()
            created_at = datetime.utcnow() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            if service == "twilio":
                transaction = TransactionLog(
                    user_id=user.id,
                    api_key_id=api_key.id,
                    transaction_id=f"msg_{random.randint(100000, 999999)}",
                    service_name="twilio",
                    provider_txn_id=f"TW{random.randint(1000000, 9999999)}",
                    endpoint="/Messages.json",
                    http_method="POST",
                    request_payload={
                        "to": generate_random_phone(),
                        "body": messages["sms"]
                    },
                    response_payload={
                        "sid": f"SM{random.randint(1000000, 9999999)}",
                        "status": status
                    },
                    response_status=200,
                    response_time_ms=random.randint(100, 500),
                    status=status,
                    error_message=None if status == "success" else "Delivery failed",
                    environment="test",
                    created_at=created_at
                )

            elif service == "resend":
                transaction = TransactionLog(
                    user_id=user.id,
                    api_key_id=api_key.id,
                    transaction_id=f"email_{random.randint(100000, 999999)}",
                    service_name="resend",
                    provider_txn_id=f"EM{random.randint(1000000, 9999999)}",
                    endpoint="/emails",
                    http_method="POST",
                    request_payload={
                        "to": generate_random_email(),
                        "subject": messages["email_subject"]
                    },
                    response_payload={
                        "id": f"EM{random.randint(1000000, 999999)}",
                        "status": status
                    },
                    response_status=200,
                    response_time_ms=random.randint(100, 500),
                    status=status,
                    error_message=None if status == "success" else "Email bounced",
                    environment="test",
                    created_at=created_at
                )

            db.add(transaction)

            if (i + 1) % 50 == 0:
                print(f"   [OK] Generated {i + 1}/{usage_count} transactions for {service}")

        print(f"   [OK] Generated {usage_count} transactions for {service}")

    await db.commit()

    print(f"   [OK] User setup complete!")
    print(f"   └─ Total transactions: {sum(user_data['usage'].values())}")

    return user


async def generate_summary_report(db: AsyncSession):
    """Generate summary report of demo data"""

    print("\n" + "="*70)
    print("[SUMMARY] DEMO DATA GENERATION")
    print("="*70)

    # Count total users
    stmt = select(User).where(User.email.like('%@demo.onerouter.com'))
    result = await db.execute(stmt)
    total_users = result.scalars().all()

    print(f"\n[TOTAL] Total Demo Users: {len(total_users)}")

    # Count total transactions
    stmt = select(TransactionLog).where(
        TransactionLog.service_name.in_(["twilio", "resend"])
    )
    result = await db.execute(stmt)
    total_transactions = result.scalars().all()

    sms_count = len([t for t in total_transactions if t.service_name == "twilio"])
    email_count = len([t for t in total_transactions if t.service_name == "resend"])
    success_count = len([t for t in total_transactions if t.status == "success"])

    print(f"\n[TOTAL] Total SMS Sent: {sms_count}")
    print(f"\n[TOTAL] Total Emails Sent: {email_count}")
    print(f"[TOTAL] Total Transactions: {len(total_transactions)}")
    print(f"\n[TOTAL] Success Rate: {(success_count / len(total_transactions) * 100):.1f}%")

    # User breakdown
    print(f"\n[BREAKDOWN] User Breakdown:")
    for user in total_users:
        stmt = select(TransactionLog).where(TransactionLog.user_id == user.id)
        result = await db.execute(stmt)
        user_transactions = result.scalars().all()

        user_sms = len([t for t in user_transactions if t.service_name == "twilio"])
        user_email = len([t for t in user_transactions if t.service_name == "resend"])

        print(f"   - {user.name}:")
        print(f"      SMS: {user_sms}")
        print(f"      Email: {user_email}")
        print(f"      Total: {len(user_transactions)}")

    print("\n" + "="*70)
    print("[SUCCESS] DEMO DATA GENERATION COMPLETE!")
    print("="*70)
    print(f"\n[TIME] Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    print("\n[NEXT] What to do now:")
    print("   1. Start backend server: cd backend && python -m uvicorn app.main:app --reload")
    print("   2. Test endpoints: curl http://localhost:8000/v1/sms")
    print("   3. Generate screenshots of: dashboard, analytics, transaction logs, service marketplace")
    print("="*70 + "\n")


async def main():
    """Main function to generate demo data"""

    print("\n" + "="*70)
    print("[START] ONEROUTER DEMO DATA GENERATION")
    print("="*70)
    print("Generating 5 demo users with realistic usage data for YC application\n")

    async for db in get_db():
        for user_data in DEMO_USERS:
            await create_demo_user(user_data, db)

        await generate_summary_report(db)


if __name__ == "__main__":
    asyncio.run(main())
