from django.urls import path
from . import views
from .views import (
    MpesaPaymentInitiateView,
    MpesaPaymentStatusView,
    MpesaPaymentQueryView,
)

urlpatterns = [
    path(
        'stkpush/',
        MpesaPaymentInitiateView.as_view(),
        name='mpesa-stkpush'
    ),

    path(
        'status/<int:order_id>/',
        MpesaPaymentStatusView.as_view(),
        name='mpesa-status'
    ),

    path(
        'query/<int:order_id>/',
        MpesaPaymentQueryView.as_view(),
        name='mpesa-query'
    ),

    path(
        'mpesa/callback/',
        views.mpesa_callback,
        name='mpesa-callback'
    ),
]
exit()