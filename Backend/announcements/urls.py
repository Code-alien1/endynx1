from django.urls import path
from . import views

urlpatterns = [
    path('', views.AnnouncementListView.as_view(), name='announcements-list'),
    path('<str:pk>/', views.AnnouncementDetailView.as_view(), name='announcement-detail'),
]
