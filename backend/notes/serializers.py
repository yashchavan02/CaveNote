from rest_framework import serializers
from .models import EncryptedNote


class EncryptedNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncryptedNote
        fields = ['ciphertext', 'iv', 'salt']
