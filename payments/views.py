from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import MpesaPayment, Order
from .serializers import MpesaPaymentSerializer
from django.shortcuts import get_object_or_404

class MpesaPaymentInitiateView(generics.CreateAPIView):
    serializer_class = MpesaPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        order_id = request.data.get("order_id")
        phone_number = request.data.get("phone_number")

        # Make sure order exists
        order = get_object_or_404(Order, id=order_id, user=request.user)

        # Create payment record
        payment = MpesaPayment.objects.create(
            user=request.user,
            order=order,
            phone_number=phone_number,
            status="Pending"
        )

        # Here you would normally call the Mpesa API to initiate STK Push
        # For prototype, we just return a success message
        return Response({
            "detail": "STK Push initiated",
            "payment_id": payment.id,
            "order_id": order.id
        }, status=status.HTTP_201_CREATED)


class MpesaPaymentStatusView(generics.RetrieveAPIView):
    serializer_class = MpesaPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "order_id"

    def get_queryset(self):
        return MpesaPayment.objects.filter(user=self.request.user)
