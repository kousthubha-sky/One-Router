# backend/app/services/registry/service_definitions.py

SERVICE_REGISTRY = {
    "twilio": {
        "category": "communications",
        "subcategory": "sms",
        "auth_type": "basic",
        "base_url": "https://api.twilio.com/2010-04-01",
        "credentials_schema": {
            "account_sid": {"type": "string", "required": True},
            "auth_token": {"type": "string", "required": True, "secret": True},
            "from_number": {"type": "phone", "required": True}
        },
        "endpoints": {
            "send_sms": {
                "method": "POST",
                "path": "/Accounts/{account_sid}/Messages.json",
                "params": {
                    "To": "to",
                    "From": "from_number",
                    "Body": "body"
                },
                "response_mapping": {
                    "id": "sid",
                    "status": "status",
                    "created_at": "date_created"
                }
            },
            "get_sms": {
                "method": "GET",
                "path": "/Accounts/{account_sid}/Messages/{message_id}.json",
                "response_mapping": {
                    "id": "sid",
                    "status": "status"
                }
            }
        },
        "webhooks": {
            "signature_header": "X-Twilio-Signature",
            "verification_method": "sha256_hmac",
            "events": ["message.sent", "message.delivered", "message.failed"]
        },
        "rate_limits": {
            "requests_per_second": 10,
            "burst_size": 100
        },
        "pricing": {
            "send_sms": {"base": 0.0079, "unit": "per_message", "currency": "USD"}
        }
    },

    "resend": {
        "category": "communications",
        "subcategory": "email",
        "auth_type": "bearer",
        "base_url": "https://api.resend.com",
        "credentials_schema": {
            "api_key": {"type": "string", "required": True, "secret": True},
            "from_email": {"type": "email", "required": True}
        },
        "endpoints": {
            "send_email": {
                "method": "POST",
                "path": "/emails",
                "params": {
                    "from": "from_email",
                    "to": "to",
                    "subject": "subject",
                    "html": "html_body"
                },
                "response_mapping": {
                    "id": "id"
                }
            }
        },
        "webhooks": {
            "signature_header": "Resend-Signature",
            "verification_method": "webhook_secret",
            "events": ["email.sent", "email.delivered", "email.bounced"]
        },
        "rate_limits": {
            "requests_per_second": 10
        },
        "pricing": {
            "send_email": {"base": 0.0001, "unit": "per_email", "currency": "USD"}
        }
    }
}