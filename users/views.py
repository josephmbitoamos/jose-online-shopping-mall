from rest_framework import generics, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework import status
from .serializers import UserSerializer  # You need to create this

User = get_user_model()

# Register
class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

# Login (you can use SimpleJWT's TokenObtainPairView instead)
from rest_framework_simplejwt.views import TokenObtainPairView
class UserLoginView(TokenObtainPairView):
    pass

# Profile
class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user
