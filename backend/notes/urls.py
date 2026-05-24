from django.urls import path
from .views import NoteAPIView

urlpatterns = [
    path('notes/<str:note_path>/', NoteAPIView.as_view(), name='note-detail'),
]
