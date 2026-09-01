from django.urls import path
from .views import (
    ReviewListView,
    ReviewCreateView,
    ReviewDetailView,
)

urlpatterns = [
    path('', ReviewListView.as_view(), name='review-list'),
    path('add/', ReviewCreateView.as_view(), name='review-add'),
    path('<int:pk>/', ReviewDetailView.as_view(), name='review-detail'),
]
