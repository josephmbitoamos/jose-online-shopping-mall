from django.db import models
from django.conf import settings
from shop.models import Order


User = settings.AUTH_USER_MODEL


class MpesaPayment(models.Model):

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("success", "Success"),
        ("failed", "Failed"),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE
    )

    phone = models.CharField(
        max_length=20
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    merchant_request_id = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    checkout_request_id = models.CharField(
        max_length=100,
        null=True,
        blank=True
    )

    mpesa_receipt = models.CharField(
        max_length=50,
        null=True,
        blank=True
    )

    result_code = models.IntegerField(
        null=True,
        blank=True
    )

    result_description = models.TextField(
        null=True,
        blank=True
    )

    created = models.DateTimeField(
        auto_now_add=True
    )

    updated = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):

        return f"Mpesa payment for Order {self.order.id}"