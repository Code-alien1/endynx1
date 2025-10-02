# Generated migration for enhanced attendance with location and face recognition data

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='attendance',
            name='method',
            field=models.CharField(choices=[('face_recognition', 'Face Recognition'), ('qr_code', 'QR Code'), ('peer_scan', 'Peer Scan'), ('manual', 'Manual Entry'), ('justification', 'Absence Justification'), ('location_verified', 'Location Verified'), ('face_and_location', 'Face Recognition + Location')], max_length=20),
        ),
        migrations.AddField(
            model_name='attendance',
            name='location_data',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='attendance',
            name='confidence_score',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
    ]
