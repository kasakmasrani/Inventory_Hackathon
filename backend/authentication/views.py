from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from datetime import timedelta
from threading import Thread

from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    OTPRequestSerializer, OTPVerifySerializer
)
from .models import OTP

User = get_user_model()


def _send_otp_email_async(subject, message, from_email, recipient_list, fallback_email, fallback_code):
    def _send():
        try:
            send_mail(
                subject,
                message,
                from_email,
                recipient_list,
                fail_silently=False,
            )
        except Exception:
            print(f"\n{'='*40}\n  OTP for {fallback_email}: {fallback_code}\n{'='*40}\n")

    Thread(target=_send, daemon=True).start()


class RegisterView(generics.CreateAPIView):
    """User registration endpoint."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    """User login endpoint."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        if not user:
            return Response(
                {'error': 'Invalid email or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update the authenticated user's profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class RequestOTPView(APIView):
    """Request a password-reset OTP sent via configured email backend."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'If the email exists, an OTP has been sent.'})

        code = OTP.generate_code()
        OTP.objects.create(user=user, code=code)

        subject = 'Core Inventory Password Reset OTP'
        message = (
            f"Hello {user.first_name or user.username},\n\n"
            f"Your OTP for password reset is: {code}\n"
            "This OTP is valid for 10 minutes.\n\n"
            "If you did not request this, please ignore this email."
        )

        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [email]

        # If SMTP credentials are missing, keep dev behavior by logging OTP.
        if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
            print(f"\n{'='*40}\n  OTP for {email}: {code}\n{'='*40}\n")
            return Response({'message': 'If the email exists, an OTP has been sent.'})

        _send_otp_email_async(subject, message, from_email, recipient_list, email, code)
        return Response({'message': 'If the email exists, an OTP has been sent.'})


class VerifyOTPView(APIView):
    """Verify OTP and reset password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        otp_code = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid request'}, status=400)

        # Check OTP – valid for 10 minutes
        otp = OTP.objects.filter(
            user=user, code=otp_code, is_used=False,
            created_at__gte=timezone.now() - timedelta(minutes=10)
        ).order_by('-created_at').first()

        if not otp:
            return Response({'error': 'Invalid or expired OTP'}, status=400)

        otp.is_used = True
        otp.save()
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successful'})


class LogoutView(APIView):
    """Blacklist the refresh token on logout."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh = request.data.get('refresh')
            if refresh:
                token = RefreshToken(refresh)
                token.blacklist()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully'})
