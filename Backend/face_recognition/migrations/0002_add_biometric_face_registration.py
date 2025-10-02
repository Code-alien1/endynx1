# Generated migration for biometric face registration

from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('face_recognition', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='FaceRegistration',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('auth_method', models.CharField(choices=[('camera', 'Camera-based'), ('biometric', 'Biometric (Face ID/Touch ID)')], default='camera', max_length=20)),
                ('device_type', models.CharField(choices=[('mobile', 'Mobile Device'), ('web', 'Web Browser'), ('desktop', 'Desktop Application')], default='mobile', max_length=20)),
                ('face_encoding', models.TextField(blank=True, help_text='Face encoding as JSON string')),
                ('biometric_id', models.CharField(blank=True, help_text='Hashed biometric identifier', max_length=255)),
                ('confidence_score', models.FloatField(default=0.0, help_text='Confidence score of the registration', validators=[django.core.validators.MinValueValidator(0.0), django.core.validators.MaxValueValidator(1.0)])),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('last_authenticated', models.DateTimeField(blank=True, null=True)),
                ('registration_ip', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='face_registration', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Face Registration',
                'verbose_name_plural': 'Face Registrations',
                'db_table': 'face_registrations',
            },
        ),
    ]
