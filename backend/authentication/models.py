from django.contrib.auth.models import AbstractUser
from django.db import models
import random
import string


class User(AbstractUser):
    ROLE_CHOICES = [
        ('manager', 'Inventory Manager'),
        ('staff', 'Warehouse Staff'),
    ]
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email


class OTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    @staticmethod
    def generate_code():
        return ''.join(random.choices(string.digits, k=6))

    def __str__(self):
        return f"OTP for {self.user.email}: {self.code}"
