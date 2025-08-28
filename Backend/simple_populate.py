import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

from attendance.models import Class
from users.models import User

# Create teacher
teacher, _ = User.objects.get_or_create(
    username='teacher1',
    defaults={
        'email': 'teacher@test.com',
        'role': 'teacher',
        'first_name': 'Test',
        'last_name': 'Teacher'
    }
)

# Create classes
classes = ['BA1A', 'BA1B', 'BA1C', 'BA1D', 'BA2A', 'BA2B']
for name in classes:
    level = 1 if name.startswith('BA1') else 2
    cls, created = Class.objects.get_or_create(
        name=name,
        defaults={'level': level, 'teacher': teacher}
    )
    print(f'{name}: {cls.id} ({"created" if created else "exists"})')

print(f'\nTotal classes: {Class.objects.count()}')
