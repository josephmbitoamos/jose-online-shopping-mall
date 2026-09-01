from django.urls import path
from .views import (
    MpesaPaymentInitiateView,
    MpesaPaymentStatusView,
)

urlpatterns = [
    path('stkpush/', MpesaPaymentInitiateView.as_view(), name='mpesa-stkpush'),
    path('status/<int:order_id>/', MpesaPaymentStatusView.as_view(), name='mpesa-status'),
]
