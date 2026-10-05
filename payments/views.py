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
from .mpesa import initiate_stk_push, query_stk_push


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

        payment.merchant_request_id = mpesa_response.get("MerchantRequestID")
        payment.checkout_request_id = mpesa_response.get("CheckoutRequestID")
        payment.result_code = mpesa_response.get("ResponseCode")
        payment.result_description = mpesa_response.get("ResponseDescription")
        payment.save()


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
    print("====================================")
    print("M-PESA CALLBACK RECEIVED")
    print("====================================")
    print(request.data)

    try:
        callback_data = request.data.get(
            "Body", {}
        ).get(
            "stkCallback", {}
        )

        checkout_request_id = callback_data.get(
            "CheckoutRequestID"
        )

        result_code = callback_data.get(
            "ResultCode"
        )

        result_description = callback_data.get(
            "ResultDesc"
        )

        if not checkout_request_id:
            return Response(
                {
                    "ResultCode": 1,
                    "ResultDesc": "CheckoutRequestID is missing."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        payment = MpesaPayment.objects.filter(
            checkout_request_id=checkout_request_id
        ).first()

        if not payment:
            print(
                "Payment not found for CheckoutRequestID:",
                checkout_request_id
            )

            return Response(
                {
                    "ResultCode": 0,
                    "ResultDesc": "Accepted"
                },
                status=status.HTTP_200_OK
            )

        payment.result_code = result_code
        payment.result_description = result_description

        # ==========================================
        # SUCCESSFUL PAYMENT
        # ==========================================

        if result_code == 0:

            payment.status = "success"

            payment.order.status = "paid"

            payment.order.save(
                update_fields=["status"]
            )

            callback_metadata = callback_data.get(
                "CallbackMetadata",
                {}
            )

            items = callback_metadata.get(
                "Item",
                []
            )

            for item in items:

                name = item.get("Name")
                value = item.get("Value")

                if name == "MpesaReceiptNumber":
                    payment.mpesa_receipt = str(value)

        # ==========================================
        # FAILED / CANCELLED PAYMENT
        # ==========================================

        else:

            payment.status = "failed"

        payment.save()

        print("Payment updated successfully.")
        print("Payment ID:", payment.id)
        print("Payment status:", payment.status)

        return Response(
            {
                "ResultCode": 0,
                "ResultDesc": "Accepted"
            },
            status=status.HTTP_200_OK
        )

    except Exception as e:

        print("M-PESA CALLBACK ERROR:")
        print(str(e))

        return Response(
            {
                "ResultCode": 1,
                "ResultDesc": "Callback processing failed."
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

class MpesaPaymentQueryView(generics.RetrieveAPIView):
    """
    Query Safaricom for the current status of an M-Pesa STK Push.
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, order_id, *args, **kwargs):

        # Find the payment belonging to the logged-in user
        payment = get_object_or_404(
            MpesaPayment,
            order_id=order_id,
            user=request.user
        )

        # Make sure we have a CheckoutRequestID
        if not payment.checkout_request_id:
            return Response(
                {
                    "detail": "No CheckoutRequestID is available for this payment.",
                    "status": payment.status
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # If our database already knows the payment succeeded,
        # there is no need to query Safaricom again.
        if payment.status == "success":
            return Response(
                {
                    "detail": "Payment already confirmed.",
                    "payment_id": payment.id,
                    "order_id": payment.order.id,
                    "status": payment.status,
                    "amount": str(payment.amount),
                    "receipt": payment.mpesa_receipt,
                    "result_code": payment.result_code,
                    "result_description": payment.result_description,
                },
                status=status.HTTP_200_OK
            )

        print("====================================")
        print("M-PESA STK QUERY")
        print("====================================")
        print("Payment ID:", payment.id)
        print("Order ID:", payment.order.id)
        print("CheckoutRequestID:", payment.checkout_request_id)

        try:
            mpesa_response = query_stk_push(
                payment.checkout_request_id
            )

            print("M-PESA QUERY RESPONSE:")
            print(mpesa_response)

            # Save the response for reference
            payment.result_description = (
                mpesa_response.get("ResultDesc")
                or mpesa_response.get("errorMessage")
                or ""
            )

            result_code = mpesa_response.get("ResultCode")

            # Safaricom sometimes returns the result code as a
            # number and sometimes as a string.
            if result_code is not None:
                try:
                    payment.result_code = int(result_code)
                except (ValueError, TypeError):
                    pass

            # -----------------------------------------
            # SUCCESS
            # -----------------------------------------
            if str(result_code) == "0":

                payment.status = "success"

                payment.order.status = "paid"
                payment.order.save(
                    update_fields=["status"]
                )

                payment.save()

                return Response(
                    {
                        "detail": "M-Pesa payment confirmed successfully.",
                        "payment_id": payment.id,
                        "order_id": payment.order.id,
                        "status": payment.status,
                        "amount": str(payment.amount),
                        "receipt": payment.mpesa_receipt,
                        "result_code": payment.result_code,
                        "result_description": payment.result_description,
                    },
                    status=status.HTTP_200_OK
                )

            # -----------------------------------------
            # USER CANCELLED
            # -----------------------------------------
            elif str(result_code) == "1032":

                payment.status = "failed"
                payment.save()

                return Response(
                    {
                        "detail": "M-Pesa payment was cancelled by the customer.",
                        "payment_id": payment.id,
                        "order_id": payment.order.id,
                        "status": payment.status,
                        "result_code": payment.result_code,
                        "result_description": payment.result_description,
                    },
                    status=status.HTTP_200_OK
                )

            # -----------------------------------------
            # TIMEOUT / PHONE UNREACHABLE
            # -----------------------------------------
            elif str(result_code) == "1037":

                payment.status = "failed"
                payment.save()

                return Response(
                    {
                        "detail": "M-Pesa payment timed out or the phone could not be reached.",
                        "payment_id": payment.id,
                        "order_id": payment.order.id,
                        "status": payment.status,
                        "result_code": payment.result_code,
                        "result_description": payment.result_description,
                    },
                    status=status.HTTP_200_OK
                )

            # -----------------------------------------
            # UNKNOWN / STILL PENDING
            # -----------------------------------------
            else:

                payment.status = "pending"
                payment.save()

                return Response(
                    {
                        "detail": "Safaricom has not provided a final payment result.",
                        "payment_id": payment.id,
                        "order_id": payment.order.id,
                        "status": payment.status,
                        "result_code": payment.result_code,
                        "result_description": payment.result_description,
                        "mpesa_response": mpesa_response,
                    },
                    status=status.HTTP_200_OK
                )

        except Exception as e:

            print("M-PESA QUERY ERROR:")
            print(str(e))

            return Response(
                {
                    "detail": "Unable to query M-Pesa payment status.",
                    "payment_id": payment.id,
                    "order_id": payment.order.id,
                    "status": payment.status,
                    "error": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )