from django.contrib import admin
from threejs.models import user, production


# Register your models here.


# Register your models here.
@admin.register(user)
class UserAdmin(admin.ModelAdmin):
    list_display = ('name', 'password')


@admin.register(production)
class ProductionAdmin(admin.ModelAdmin):
    list_display = ('user_name', 'name', 'introduction', 'three_model')
    serch_fields = ('name', 'introduction', 'three_model')
