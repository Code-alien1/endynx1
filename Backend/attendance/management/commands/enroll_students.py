from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from attendance.models import PredefinedClass

User = get_user_model()

class Command(BaseCommand):
    help = 'Enroll students in BA1B class for testing'

    def handle(self, *args, **options):
        try:
            # Get BA1B class
            ba1b_class = PredefinedClass.objects.get(name='BA1B')
            students = User.objects.filter(role='student')
            
            self.stdout.write(f'Found BA1B class: {ba1b_class.name} (ID: {ba1b_class.id})')
            self.stdout.write(f'Found {students.count()} students')
            
            for student in students:
                # Check if already enrolled
                if not ba1b_class.students.filter(id=student.id).exists():
                    # Enroll student
                    ba1b_class.students.add(student)
                    student.class_name = 'BA1B'
                    student.save()
                    self.stdout.write(f'Enrolled {student.username} in BA1B')
                else:
                    self.stdout.write(f'{student.username} already enrolled in BA1B')
            
            self.stdout.write(self.style.SUCCESS('Student enrollment complete'))
            
        except PredefinedClass.DoesNotExist:
            self.stdout.write(self.style.ERROR('BA1B class not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {e}'))
