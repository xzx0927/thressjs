"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.utils.termcolors import background

from backend import settings
from background import  views as app01


urlpatterns = [
    path('admin/', admin.site.urls),
    # path('', app01.index),  # 合并了index和home的URL模式
    # path('index/', app01.index),
    path('login/', app01.login.as_view()),
    path('login_url/', app01.login_url),
    path('register/', app01.register.as_view()),  # 修正了视图引用
    path('profile/', app01.profile),
    path('profile_gain/', app01.profile_gain.as_view()),
    path('profile_edit/', app01.profile_edit.as_view()),
    path('profile_works/', app01.profile_works),
    path('profile_production/', app01.profile_production.as_view()),
    path('model_show_url/<model_id>/', app01.model_show_url),
    path('model_show/<model_id>/', app01.model_show.as_view()),
    path('model_delete_url/<model_id>/', app01.model_delete_url),
    path('model_upload_url/', app01.model_upload_url),
    path('model_upload/', app01.model_upload.as_view()),
    path('model_edit_url/<model_id>/', app01.model_edit_url),
    path('model_edit/<model_id>/', app01.model_edit.as_view()),
    path('model_download/<model_id>/<user_serial>/', app01.model_download),  # 新增路径配置
    path('model_search_url/<data>/', app01.model_search_url),
    path('model_search/', app01.model_search.as_view()),
    path('checkin_status/', app01.checkin_status),
    path('signin/', app01.signin),
    path('upload_image_url/<model_id>/',app01.upload_image_url),
    path('upload_image/<model_id>/',app01.upload_image.as_view()),
    path('frontrender/', app01.frontrender),
    path('image_edit_url/<model_id>/',app01.image_edit_url),
    path('image_edit/<model_id>/',app01.image_edit.as_view()),
    path('image_delete/', app01.image_delete.as_view()),
    path('index_views/', app01.index_views.as_view()),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)