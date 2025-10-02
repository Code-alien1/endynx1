# Generated migration to make attendance field nullable in AbsenceJustification

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='absencejustification',
            name='attendance',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='justification', to='attendance.attendance'),
        ),
    ]
