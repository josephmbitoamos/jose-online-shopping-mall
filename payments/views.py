from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status

from .models import MpesaPayment
from .serializers import MpesaPaymentSerializer
from shop.models import Order
from .mpesa import initiate_stk_push


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
        # INITIATE M-PESA STK PUSH
        # -------------------------------------------------

        mpesa_response = initiate_stk_push(
            phone_number=phone_number,
            amount=payment.amount,
            account_reference=f"ORDER-{order.id}",
            transaction_desc=f"Payment for Order {order.id}"
        )

        print("M-PESA STK RESPONSE:")
        print(mpesa_response)

        # -------------------------------------------------
        # CHECK M-PESA RESPONSE
        # -------------------------------------------------

        if mpesa_response.get("ResponseCode") == "0":

            return Response(
                {
                    "detail": "STK Push sent successfully. Check your phone.",
                    "payment_id": payment.id,
                    "order_id": order.id,
                    "amount": str(payment.amount),
                    "phone": payment.phone,
                    "status": payment.status,
                    "merchant_request_id": mpesa_response.get(
                        "MerchantRequestID"
                    ),
                    "checkout_request_id": mpesa_response.get(
                        "CheckoutRequestID"
                    ),
                    "customer_message": mpesa_response.get(
                        "CustomerMessage"
                    ),
                },
                status=status.HTTP_201_CREATED
            )

        # -------------------------------------------------
        # STK PUSH FAILED
        # -------------------------------------------------

        payment.status = "failed"
        payment.save()

        return Response(
            {
                "detail": "M-Pesa STK Push could not be initiated.",
                "payment_id": payment.id,
                "mpesa_response": mpesa_response,
            },
            status=status.HTTP_400_BAD_REQUEST
        )
class MpesaPaymentStatusView(generics.RetrieveAPIView):

    serializer_class = MpesaPaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    lookup_field = "order_id"

    def get_queryset(self):
        return MpesaPayment.objects.filter(
            user=self.request.user
        )

@api_view(["POST"])
@permission_classes([AllowAny])
def mpesa_callback(request):
    """
    Receive M-Pesa STK Push callback from Safaricom.
    """

    print("====================================")
    print("M-PESA CALLBACK RECEIVED")
    print("====================================")
    print(request.data)

    return Response(
        {
            "ResultCode": 0,
            "ResultDesc": "Accepted"
        },
        status=status.HTTP_200_OK
    )