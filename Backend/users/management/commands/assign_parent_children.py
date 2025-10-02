from django.core.management.base import BaseCommand
from users.models import User

class Command(BaseCommand):
    help = 'Assign children to parent users'

    def handle(self, *args, **options):
        try:
            # Find the parent user
            parent = User.objects.get(email='mater@parents.com', role='parent')
            self.stdout.write(f'Found parent: {parent.get_full_name()} ({parent.email})')
            
            # Check current children
            current_children = User.objects.filter(role='student', parent=parent)
            self.stdout.write(f'Current children: {current_children.count()}')
            
            if current_children.count() == 0:
                # Find unassigned students
                unassigned_students = User.objects.filter(role='student', parent__isnull=True)[:2]
                self.stdout.write(f'Found {unassigned_students.count()} unassigned students')
                
                for student in unassigned_students:
                    student.parent = parent
                    student.save()
                    self.stdout.write(f'Assigned {student.get_full_name()} ({student.email}) to parent')
                
                self.stdout.write(self.style.SUCCESS('Successfully assigned children to parent'))
            else:
                self.stdout.write('Parent already has children assigned:')
                for child in current_children:
                    self.stdout.write(f'  - {child.get_full_name()} ({child.email})')
                    
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Parent user mater@parents.com not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
