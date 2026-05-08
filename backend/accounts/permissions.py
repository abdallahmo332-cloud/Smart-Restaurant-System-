from rest_framework.permissions import BasePermission
from .models import User


class IsSystemAdmin(BasePermission):
    """
    يسمح فقط للمستخدمين اللي role تبعهم SYSTEM_ADMIN
    (مثل الـ superuser اللي عملناه).
    """
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.SYSTEM_ADMIN
        )


class IsRestaurantManager(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
             and request.user.role == User.Role.RESTAURANT_MANAGER
        )
