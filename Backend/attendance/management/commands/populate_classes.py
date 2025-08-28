from django.core.management.base import BaseCommand
from django.db import transaction
from attendance.models import Class
from users.models import User


class Command(BaseCommand):
    help = 'Populate predefined classes (BA1A, BA1B, BA1C, BA1D, BA2A, BA2B)'

    def handle(self, *args, **options):
        predefined_classes = [
            {'name': 'BA1A', 'level': 1},
            {'name': 'BA1B', 'level': 1},
            {'name': 'BA1C', 'level': 1},
            {'name': 'BA1D', 'level': 1},
            {'name': 'BA2A', 'level': 2},
            {'name': 'BA2B', 'level': 2},
        ]

        # Get or create a default teacher for classes
        default_teacher, created = User.objects.get_or_create(
            email='default.teacher@edynx.com',
            defaults={
                'username': 'default_teacher',
                'first_name': 'Default',
                'last_name': 'Teacher',
                'role': 'teacher',
                'is_active': True,
            }
        )

        if created:
            default_teacher.set_password('defaultpassword123')
            default_teacher.save()
            self.stdout.write(
                self.style.SUCCESS(f'Created default teacher: {default_teacher.email}')
            )

        with transaction.atomic():
            created_count = 0
            for class_data in predefined_classes:
                class_obj, created = Class.objects.get_or_create(
                    name=class_data['name'],
                    defaults={
                        'level': class_data['level'],
                        'teacher': default_teacher,
                    }
                )
                
                if created:
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Created class: {class_obj.name} (ID: {class_obj.id}, Level {class_obj.level})')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'Class already exists: {class_obj.name} (ID: {class_obj.id})')
                    )

        # Show all classes with their UUIDs
        self.stdout.write(self.style.SUCCESS('\nAll classes in database:'))
        for class_obj in Class.objects.all().order_by('name'):
            self.stdout.write(f'  - {class_obj.name}: {class_obj.id} (Level {class_obj.level})')

        self.stdout.write(
            self.style.SUCCESS(f'\nSuccessfully processed {len(predefined_classes)} classes. Created {created_count} new classes.')
        )
