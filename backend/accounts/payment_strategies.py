# accounts/payment_strategies.py

from abc import ABC, abstractmethod
from .models import Payment


class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, payment: Payment, payload: dict) -> Payment:
        ...


class CardPaymentStrategy(PaymentStrategy):
    def pay(self, payment: Payment, payload: dict) -> Payment:
        card_number = (payload.get("card_number") or "").strip()

        if not card_number.isdigit() or len(card_number) < 12:
            payment.status = Payment.Status.FAILED
            payment.save()
            raise ValueError("رقم البطاقة غير صالح.")

        # آخر 4 أرقام فقط
        payment.card_last4 = card_number[-4:]
        payment.status = Payment.Status.PAID
        payment.save()
        return payment


class CashAtRestaurantStrategy(PaymentStrategy):
    def pay(self, payment: Payment, payload: dict) -> Payment:
        payment.card_last4 = ""
        payment.status = Payment.Status.PENDING_CASH
        payment.save()
        return payment
