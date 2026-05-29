from django.urls import path
from .views import HealthCheck, NoteAPIView

urlpatterns = [
    path('health/', HealthCheck.as_view(), name='health-check'),
    path('notes/<str:note_path>/', NoteAPIView.as_view(), name='note-detail'),
]
