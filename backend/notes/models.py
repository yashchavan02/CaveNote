import uuid
from django.db import models


class EncryptedNote(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    note_path = models.CharField(max_length=255, unique=True, db_index=True)
    ciphertext = models.TextField()
    iv = models.TextField()
    salt = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['note_path']),
        ]
        verbose_name = 'Encrypted Note'
        verbose_name_plural = 'Encrypted Notes'

    def __str__(self):
        return self.note_path
