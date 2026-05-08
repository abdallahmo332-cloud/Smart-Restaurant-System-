# accounts/payment_service.py

from .models import Payment
from .payment_strategies import PaymentStrategy


class PaymentService:
    def __init__(self, strategy: PaymentStrategy):
        self.strategy = strategy

    def execute(self, payment: Payment, payload: dict) -> Payment:
        return self.strategy.pay(payment, payload)
