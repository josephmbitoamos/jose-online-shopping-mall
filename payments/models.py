from django.db import models
from django.conf import settings
from shop.models import Order

User = settings.AUTH_USER_MODEL

class MpesaPayment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    phone = models.CharField(max_length=20)
    mpesa_receipt = models.CharField(max_length=50, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default="pending")  # success or failed
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Mpesa payment for Order {self.order.id}"
