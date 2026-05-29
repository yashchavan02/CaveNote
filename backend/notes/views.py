from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django_ratelimit.decorators import ratelimit
from django.utils.decorators import method_decorator
from .models import EncryptedNote
from .serializers import EncryptedNoteSerializer


class HealthCheck(APIView):
    def get(self, request):
        return Response({'status': 'ok'}, status=status.HTTP_200_OK)


class NoteAPIView(APIView):
    def get(self, request, note_path):
        try:
            note = EncryptedNote.objects.get(note_path=note_path)
            serializer = EncryptedNoteSerializer(note)
            return Response(serializer.data)
        except ObjectDoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    @method_decorator(
        ratelimit(key='ip', rate=settings.RATELIMIT_RATE, method='POST', block=True)
    )
    def post(self, request, note_path):
        serializer = EncryptedNoteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        obj, created = EncryptedNote.objects.update_or_create(
            note_path=note_path,
            defaults={
                'ciphertext': serializer.validated_data['ciphertext'],
                'iv': serializer.validated_data['iv'],
                'salt': serializer.validated_data['salt'],
            }
        )
        return Response({'status': 'saved'}, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @method_decorator(
        ratelimit(key='ip', rate=settings.RATELIMIT_RATE, method='DELETE', block=True)
    )
    def delete(self, request, note_path):
        deleted, _ = EncryptedNote.objects.filter(note_path=note_path).delete()
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(status=status.HTTP_404_NOT_FOUND)
