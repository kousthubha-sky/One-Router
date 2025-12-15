import re
from typing import Dict, List, Optional
from pydantic import BaseModel

class ServiceDetection(BaseModel):
    service_name: str
    confidence: float  # 0.0 to 1.0
    features: Dict[str, bool]
    required_keys: List[str]
    detected_keys: List[str]

class EnvParserService:
    """Service for parsing .env files and detecting payment services"""

    def __init__(self):
        # Service detection patterns
        self.service_patterns = {
            'razorpay': {
                'key_patterns': [
                    r'^RAZORPAY_KEY_ID$',
                    r'^RAZORPAY_KEY_SECRET$',
                    r'^RAZORPAY_WEBHOOK_SECRET$'
                ],
                'feature_patterns': {
                    'payments': [r'^RAZORPAY_KEY_ID$', r'^RAZORPAY_KEY_SECRET$'],
                    'subscriptions': [r'^RAZORPAY_SUBSCRIPTION_ID$'],
                    'payment_links': [r'^RAZORPAY_KEY_ID$'],
                    'webhooks': [r'^RAZORPAY_WEBHOOK_SECRET$']
                }
            },
            'paypal': {
                'key_patterns': [
                    r'^PAYPAL_CLIENT_ID$',
                    r'^PAYPAL_CLIENT_SECRET$',
                    r'^PAYPAL_MODE$'
                ],
                'feature_patterns': {
                    'payments': [r'^PAYPAL_CLIENT_ID$', r'^PAYPAL_CLIENT_SECRET$'],
                    'subscriptions': [r'^PAYPAL_CLIENT_ID$'],
                    'webhooks': [r'^PAYPAL_CLIENT_ID$']
                }
            },
            'stripe': {
                'key_patterns': [
                    r'^STRIPE_PUBLISHABLE_KEY$',
                    r'^STRIPE_SECRET_KEY$',
                    r'^STRIPE_WEBHOOK_SECRET$'
                ],
                'feature_patterns': {
                    'payments': [r'^STRIPE_SECRET_KEY$'],
                    'subscriptions': [r'^STRIPE_SECRET_KEY$'],
                    'webhooks': [r'^STRIPE_WEBHOOK_SECRET$']
                }
            },
            'twilio': {
                'key_patterns': [
                    r'^TWILIO_ACCOUNT_SID$',
                    r'^TWILIO_AUTH_TOKEN$',
                    r'^TWILIO_PHONE_NUMBER$'
                ],
                'feature_patterns': {
                    'sms': [r'^TWILIO_ACCOUNT_SID$', r'^TWILIO_AUTH_TOKEN$'],
                    'calls': [r'^TWILIO_ACCOUNT_SID$', r'^TWILIO_AUTH_TOKEN$'],
                    'verification': [r'^TWILIO_ACCOUNT_SID$', r'^TWILIO_AUTH_TOKEN$']
                }
            },
            'aws_s3': {
                'key_patterns': [
                    r'^AWS_ACCESS_KEY_ID$',
                    r'^AWS_SECRET_ACCESS_KEY$',
                    r'^AWS_REGION$',
                    r'^AWS_S3_BUCKET$'
                ],
                'feature_patterns': {
                    'storage': [r'^AWS_ACCESS_KEY_ID$', r'^AWS_SECRET_ACCESS_KEY$', r'^AWS_S3_BUCKET$'],
                    'file_upload': [r'^AWS_ACCESS_KEY_ID$', r'^AWS_SECRET_ACCESS_KEY$', r'^AWS_S3_BUCKET$'],
                    'cdn': [r'^AWS_S3_BUCKET$', r'^AWS_REGION$']
                }
            }
        }

    def parse_env_content(self, content: str) -> Dict[str, str]:
        """Parse .env file content into key-value pairs"""
        env_vars = {}

        for line in content.split('\n'):
            line = line.strip()

            # Skip comments and empty lines
            if not line or line.startswith('#'):
                continue

            # Parse key=value pairs
            if '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                value = value.strip().strip('"\'')

                # Skip empty keys or values
                if key and value:
                    env_vars[key] = value

        return env_vars

    def detect_services(self, env_vars: Dict[str, str]) -> List[ServiceDetection]:
        """Detect which payment services are configured"""
        detections = []

        for service_name, patterns in self.service_patterns.items():
            detected_keys = []
            matched_keys_set = set()
            confidence = 0.0

            # Check for key patterns
            for pattern in patterns['key_patterns']:
                for env_key in env_vars.keys():
                    if re.match(pattern, env_key, re.IGNORECASE) and env_key not in matched_keys_set:
                        detected_keys.append(env_key)
                        matched_keys_set.add(env_key)
                        confidence += 0.3  # Each matching key increases confidence

            if detected_keys:
                # Detect features
                features = {}
                for feature_name, feature_patterns in patterns['feature_patterns'].items():
                    feature_confidence = 0
                    for pattern in feature_patterns:
                        for env_key in env_vars.keys():
                            if re.match(pattern, env_key, re.IGNORECASE):
                                feature_confidence += 1

                    # Feature is enabled if we have confidence
                    features[feature_name] = feature_confidence > 0

                # Only include if we have reasonable confidence
                if confidence >= 0.3:
                    # Extract literal key names from regex patterns
                    required_keys = [
                        pattern.replace('^', '').replace('$', '')
                        for pattern in patterns['key_patterns']
                    ]
                    
                    detections.append(ServiceDetection(
                        service_name=service_name,
                        confidence=min(confidence, 1.0),
                        features=features,
                        required_keys=required_keys,
                        detected_keys=detected_keys
                    ))

        # Sort by confidence
        detections.sort(key=lambda x: x.confidence, reverse=True)
        return detections

    def validate_env_syntax(self, content: str) -> Dict[str, str]:
        """Validate .env file syntax and return errors"""
        errors = {}

        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            line = line.strip()

            # Skip comments and empty lines
            if not line or line.startswith('#'):
                continue

            # Check for basic key=value format
            if '=' not in line:
                errors[f"line_{i}"] = "Missing '=' separator"
                continue

            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip()

            # Validate key format (allow letters in both cases, digits, and underscores)
            if not re.match(r'^[A-Za-z_][A-Za-z0-9_]*$', key):
                errors[f"line_{i}"] = f"Invalid key format: {key}"

            # Check for unclosed quotes
            if (value.startswith('"') and not value.endswith('"')) or \
               (value.startswith("'") and not value.endswith("'")):
                errors[f"line_{i}"] = "Unclosed quote"

        return errors