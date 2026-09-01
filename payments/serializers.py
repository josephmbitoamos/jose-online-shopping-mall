from rest_framework import serializers
from .models import MpesaPayment
from shop.serializers import OrderSerializer

class MpesaPaymentSerializer(serializers.ModelSerializer):
    order = OrderSerializer(read_only=True)

    class Meta:
        model = MpesaPayment
        fields = "__all__"
