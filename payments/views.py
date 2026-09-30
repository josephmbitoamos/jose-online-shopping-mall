from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import MpesaPayment
from .serializers import MpesaPaymentSerializer
from shop.models import Order


class MpesaPaymentInitiateView(generics.CreateAPIView):
    serializer_class = MpesaPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):

        order_id = request.data.get("order_id")
        phone_number = request.data.get("phone_number")

        # Check that order ID was provided
        if not order_id:
            return Response(
                {
                    "detail": "order_id is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check that phone number was provided
        if not phone_number:
            return Response(
                {
                    "detail": "phone_number is required."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find the customer's order
        order = get_object_or_404(
            Order,
            id=order_id,
            user=request.user
        )

        # Prevent duplicate payment records for the same order
        existing_payment = MpesaPayment.objects.filter(
            order=order
        ).first()

        if existing_payment:
            return Response(
                {
                    "detail": "A payment already exists for this order.",
                    "payment_id": existing_payment.id,
                    "order_id": order.id,
                    "status": existing_payment.status
                },
                status=status.HTTP_200_OK
            )

        # Create payment record
        payment = MpesaPayment.objects.create(
            user=request.user,
            order=order,
            phone=phone_number,
            amount=order.total_amount,
            status="pending"
        )

        # -------------------------------------------------
        # M-PESA STK PUSH WILL BE ADDED HERE
        # -------------------------------------------------

        return Response(
            {
                "detail": "Payment record created. M-Pesa STK Push will be initiated here.",
                "payment_id": payment.id,
                "order_id": order.id,
                "amount": str(payment.amount),
                "phone": payment.phone,
                "status": payment.status
            },
            status=status.HTTP_201_CREATED
        )


class MpesaPaymentStatusView(generics.RetrieveAPIView):

    serializer_class = MpesaPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    lookup_field = "order_id"

    def get_queryset(self):
        return MpesaPayment.objects.filter(
            user=self.request.user
        )