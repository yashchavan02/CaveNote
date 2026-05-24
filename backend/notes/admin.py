from django.contrib import admin
from .models import EncryptedNote


@admin.register(EncryptedNote)
class EncryptedNoteAdmin(admin.ModelAdmin):
    list_display = ['note_path', 'created_at', 'updated_at']
    search_fields = ['note_path']
    readonly_fields = ['ciphertext', 'iv', 'salt', 'created_at', 'updated_at']
