from django.urls import path

from . import views

urlpatterns = [
    path('login', views.login, name='login'),
    path('password', views.change_pswd, name='change_pswd'),
]
