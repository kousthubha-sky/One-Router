"""
OneRouter Usage-Based Pricing Service
Calculates fees based on actual usage (payments, SMS, email).
"""

from dataclasses import dataclass
from typing import Dict, Any
from decimal import Decimal, ROUND_UP       


@dataclass
class UsageFee:
    """Fee calculation result"""
    service_type: str
    amount: float
    fee_rupees: float
    fee_paise: int
    breakdown: Dict[str, Any]


class FeeCalculator:
    """
    Calculate usage-based fees for OneRouter services.
    
    Pricing Model (aligned with market standards):
    - Payments: 1% + ₹0.50 per transaction
    - SMS: ₹0.10 per message
    - Email: ₹0.001 per email
    """

    # Fee constants (in rupees)
    PAYMENT_PERCENTAGE = 0.01  # 1%
    PAYMENT_FIXED = 0.50  # ₹0.50 per transaction
    SMS_PER_MESSAGE = 0.10  # ₹0.10 per message
    EMAIL_PER_MESSAGE = 0.001  # ₹0.001 per email

    @classmethod
    def payment(cls, amount: float) -> UsageFee:
        """
        Calculate fee for payment routing.
        
        Args:
            amount: Transaction amount in rupees (e.g., 1000.00 for ₹1,000)
            
        Returns:
            UsageFee with breakdown
        """
        amount = float(amount)
        fee_rupees = (amount * cls.PAYMENT_PERCENTAGE) + cls.PAYMENT_FIXED
        fee_rupees_rounded = round(fee_rupees, 2)

        return UsageFee(
            service_type="payment",
            amount=amount,
            fee_rupees=fee_rupees_rounded,
            fee_paise=int(fee_rupees_rounded * 100),
            breakdown={
                "percentage_fee": round(amount * cls.PAYMENT_PERCENTAGE, 2),
                "fixed_fee": cls.PAYMENT_FIXED,
                "total_fee": fee_rupees_rounded
            }
        )
        

    @classmethod
    def sms(cls, messages: int) -> UsageFee:
        """
        Calculate fee for SMS routing.
        
        Args:
            messages: Number of SMS messages
            
        Returns:
            UsageFee with breakdown
        """
        fee_rupees = messages * cls.SMS_PER_MESSAGE
        rounded_fee_rupees = round(fee_rupees, 2)
        fee_paise = int(rounded_fee_rupees * 100)
        
        return UsageFee(
            service_type="sms",
            amount=messages,
            fee_rupees=rounded_fee_rupees,
            fee_paise=fee_paise,
            breakdown={
                "messages": messages,
                "per_message": cls.SMS_PER_MESSAGE,
                "total_fee": rounded_fee_rupees
            }
        )

    @classmethod
    def email(cls, emails: int) -> UsageFee:
        """
        Calculate fee for email routing.
        
        Args:
            emails: Number of emails
            
        Returns:
            UsageFee with breakdown
        """
        fee_rupees = Decimal(str(emails)) * Decimal(str(cls.EMAIL_PER_MESSAGE))
        fee_paise = int((fee_rupees * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_UP))
        rounded_fee_rupees = float(Decimal(fee_paise) / Decimal("100"))
        
        return UsageFee(
            service_type="email",
            amount=emails,
            fee_rupees=rounded_fee_rupees,
            fee_paise=fee_paise,
            breakdown={
                "emails": emails,
                "per_email": cls.EMAIL_PER_MESSAGE,
                "total_fee": rounded_fee_rupees
            }
        )

    @classmethod
    def calculate(
        cls,
        service_type: str,
        amount: float,
        count: int = 1
    ) -> UsageFee:
        """
        Calculate fee for any service type.
        
        Args:
            service_type: 'payment', 'sms', or 'email'
            amount: Amount (for payments) or unused (for SMS/email)
            count: Number of units (messages, emails)
            
        Returns:
            UsageFee with breakdown
        """
        if service_type == "payment":
            return cls.payment(amount)
        elif service_type == "sms":
            return cls.sms(count)
        elif service_type == "email":
            return cls.email(count)
        else:
            raise ValueError(f"Unknown service type: {service_type}")


class CreditPricingService:
    """
    Manage credit packages and pricing plans.
    """

    # Credit packages (optional upfront purchases)
    CREDIT_PACKAGES = [
        {
            "id": "starter",
            "name": "Starter",
            "amount_inr": 100,
            "credits": 1000,  # 1:1 ratio
            "discount_percent": 0
        },
        {
            "id": "pro",
            "name": "Pro",
            "amount_inr": 800,
            "credits": 10000,  # 17% more credits
            "discount_percent": 17
        },
        {
            "id": "enterprise",
            "name": "Enterprise",
            "amount_inr": 8000,
            "credits": 100000,  # 29% more credits
            "discount_percent": 29
        }
    ]

    FREE_TIER_CREDITS = 1000

    @classmethod
    def get_credit_packages(cls) -> list:
        """Get available credit packages."""
        return cls.CREDIT_PACKAGES

    @classmethod
    def get_package(cls, package_id: str) -> dict | None:
        """Get specific package details."""
        for pkg in cls.CREDIT_PACKAGES:
            if pkg["id"] == package_id:
                return pkg
        return None

    @classmethod
    def credits_to_rupees(cls, credits: int) -> float:
        """
        Convert credits to rupee value.
        
        Note: This is for display purposes only.
        Actual billing is usage-based.
        """
        return credits * 0.01  # 1 credit = ₹0.01 value

    @classmethod
    def rupees_to_credits(cls, rupees: float) -> int:
        """
        Convert rupee amount to credits.
        
        Used for upfront credit purchases.
        """
        return int(rupees / 0.01)  # ₹0.01 per credit


class UsageEstimator:
    """
    Estimate usage costs for planning purposes.
    """

    # Average costs (for estimation)
    AVERAGE_PAYMENT_AMOUNT = 500  # ₹500
    AVERAGE_SMS_PER_USER = 10  # 10 SMS per user/month
    AVERAGE_EMAIL_PER_USER = 50  # 50 emails per user/month

    @classmethod
    def estimate_monthly_cost(
        cls,
        monthly_payments: int = 100,
        monthly_sms: int = 100,
        monthly_emails: int = 500
    ) -> Dict[str, Any]:
        """
        Estimate monthly cost based on expected usage.
        
        Args:
            monthly_payments: Expected payments per month
            monthly_sms: Expected SMS per month
            monthly_emails: Expected emails per month
        """
        payment_fee = FeeCalculator.payment(cls.AVERAGE_PAYMENT_AMOUNT)
        sms_fee = FeeCalculator.sms(monthly_sms)
        email_fee = FeeCalculator.email(monthly_emails)

        return {
            "monthly_payments": {
                "count": monthly_payments,
                "avg_amount": cls.AVERAGE_PAYMENT_AMOUNT,
                "estimated_cost": round(payment_fee.fee_rupees * monthly_payments, 2)
            },
            "monthly_sms": {
                "count": monthly_sms,
                "estimated_cost": sms_fee.fee_rupees
            },
            "monthly_email": {
                "count": monthly_emails,
                "estimated_cost": email_fee.fee_rupees
            },
            "total_monthly": round(
                (payment_fee.fee_rupees * monthly_payments) +
                sms_fee.fee_rupees +
                email_fee.fee_rupees,
                2
            )
        }

    @classmethod
    def example_scenarios(cls) -> list:
        """Get example usage scenarios."""
        return [
            {
                "name": "Small Business",
                "payments": 50,
                "sms": 100,
                "emails": 200,
                "monthly_cost": "≈ ₹275"
            },
            {
                "name": "Growing Startup",
                "payments": 500,
                "sms": 1000,
                "emails": 2000,
                "monthly_cost": "≈ ₹1,600"
            },
            {
                "name": "Enterprise",
                "payments": 5000,
                "sms": 10000,
                "emails": 50000,
                "monthly_cost": "≈ ₹12,500"
            }
        ]


# Example usage
if __name__ == "__main__":
    # Payment example
    payment = FeeCalculator.payment(1000)
    print(f"Payment ₹1,000: Fee = ₹{payment.fee_rupees}")
    print(f"  Breakdown: {payment.breakdown}")

    # SMS example
    sms = FeeCalculator.sms(100)
    print(f"\n100 SMS: Fee = ₹{sms.fee_rupees}")

    # Email example
    email = FeeCalculator.email(1000)
    print(f"\n1,000 emails: Fee = ₹{email.fee_rupees}")

    # Credit packages
    print("\nCredit Packages:")
    for pkg in CreditPricingService.get_credit_packages():
        print(f"  {pkg['name']}: ₹{pkg['amount_inr']} = {pkg['credits']} credits")
