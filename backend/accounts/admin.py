from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ManagerAccountRequest


class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ('email', 'full_name', 'phone', 'location', 'role', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_active')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone', 'location')}),
        ('Role', {'fields': ('role',)}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'password1', 'password2',
                'full_name', 'phone', 'location', 'role',
                'is_staff', 'is_active'
            )}
        ),
    )

    search_fields = ('email',)
    ordering = ('email',)


class ManagerAccountRequestAdmin(admin.ModelAdmin):
    list_display = (
        'restaurant_name',
        'manager_name',
        'manager_email',
        'status',
        'created_at',
    )
    list_filter = ('status', 'created_at')
    search_fields = ('restaurant_name', 'manager_name', 'manager_email')


admin.site.register(User, CustomUserAdmin)
admin.site.register(ManagerAccountRequest, ManagerAccountRequestAdmin)
