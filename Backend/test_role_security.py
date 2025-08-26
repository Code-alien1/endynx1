#!/usr/bin/env python
"""
Role-Based Security Test Script for Edynx Backend

This script tests the role-based authentication and authorization system
to ensure proper access control and data filtering.
"""

import os
import sys
import django
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'edynx_backend.settings')
django.setup()

User = get_user_model()

class RoleBasedSecurityTest:
    """Test class for role-based security validation"""
    
    def __init__(self):
        self.client = APIClient()
        self.test_users = {}
        self.test_tokens = {}
        
    def setup_test_users(self):
        """Create test users for each role"""
        print("Setting up test users...")
        
        # Create superadmin
        superadmin = User.objects.create_user(
            email='superadmin@test.com',
            password='testpass123',
            first_name='Super',
            last_name='Admin',
            role='superadmin'
        )
        self.test_users['superadmin'] = superadmin
        
        # Create administration user
        admin = User.objects.create_user(
            email='admin@test.com',
            password='testpass123',
            first_name='Admin',
            last_name='User',
            role='administration'
        )
        self.test_users['administration'] = admin
        
        # Create teacher
        teacher = User.objects.create_user(
            email='teacher@test.com',
            password='testpass123',
            first_name='Teacher',
            last_name='User',
            role='teacher',
            department='Mathematics'
        )
        self.test_users['teacher'] = teacher
        
        # Create mentor
        mentor = User.objects.create_user(
            email='mentor@test.com',
            password='testpass123',
            first_name='Mentor',
            last_name='User',
            role='mentor',
            level=3
        )
        self.test_users['mentor'] = mentor
        
        # Create parent
        parent = User.objects.create_user(
            email='parent@test.com',
            password='testpass123',
            first_name='Parent',
            last_name='User',
            role='parent'
        )
        self.test_users['parent'] = parent
        
        # Create student
        student = User.objects.create_user(
            email='student@test.com',
            password='testpass123',
            first_name='Student',
            last_name='User',
            role='student',
            parent=parent,
            level=1
        )
        self.test_users['student'] = student
        
        # Create another student for comparison
        student2 = User.objects.create_user(
            email='student2@test.com',
            password='testpass123',
            first_name='Student2',
            last_name='User',
            role='student',
            level=2
        )
        self.test_users['student2'] = student2
        
        # Generate JWT tokens for each user
        for role, user in self.test_users.items():
            refresh = RefreshToken.for_user(user)
            self.test_tokens[role] = {
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }
        
        print(f"Created {len(self.test_users)} test users")
    
    def authenticate_as(self, role):
        """Authenticate API client as specific role"""
        if role in self.test_tokens:
            token = self.test_tokens[role]['access']
            self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
            return True
        return False
    
    def test_user_permissions_endpoint(self):
        """Test the user permissions endpoint for each role"""
        print("\n=== Testing User Permissions Endpoint ===")
        
        for role in self.test_users.keys():
            print(f"\nTesting permissions for {role}...")
            
            if self.authenticate_as(role):
                response = self.client.get('/api/users/permissions/')
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✓ {role} permissions retrieved successfully")
                    print(f"  Role: {data.get('role')}")
                    print(f"  Permissions: {list(data.get('permissions', {}).keys())}")
                    print(f"  Accessible students: {len(data.get('accessible_student_ids', []))}")
                else:
                    print(f"✗ {role} permissions failed: {response.status_code}")
            else:
                print(f"✗ Failed to authenticate as {role}")
    
    def test_role_based_user_access(self):
        """Test role-based user list access"""
        print("\n=== Testing Role-Based User Access ===")
        
        for role in self.test_users.keys():
            print(f"\nTesting user access for {role}...")
            
            if self.authenticate_as(role):
                response = self.client.get('/api/users/role-based-users/')
                
                if response.status_code == 200:
                    data = response.json()
                    users = data.get('users', [])
                    print(f"✓ {role} can access {len(users)} users")
                    
                    # Check if user can see themselves
                    user_ids = [user['id'] for user in users]
                    if str(self.test_users[role].id) in user_ids:
                        print(f"  ✓ Can see own data")
                    else:
                        print(f"  ✗ Cannot see own data")
                        
                else:
                    print(f"✗ {role} user access failed: {response.status_code}")
    
    def test_access_control_checks(self):
        """Test access control between different roles"""
        print("\n=== Testing Access Control Checks ===")
        
        test_cases = [
            ('parent', 'student', True),  # Parent should access their child
            ('parent', 'student2', False),  # Parent should not access other children
            ('teacher', 'student', True),  # Teacher should access students (if in same class)
            ('mentor', 'student', False),  # Mentor should not access non-mentees
            ('student', 'student2', False),  # Student should not access other students
            ('administration', 'student', True),  # Admin should access all
            ('superadmin', 'student', True),  # Superadmin should access all
        ]
        
        for requesting_role, target_role, expected_access in test_cases:
            print(f"\nTesting {requesting_role} -> {target_role} access...")
            
            if self.authenticate_as(requesting_role):
                target_user_id = str(self.test_users[target_role].id)
                
                response = self.client.post('/api/users/access-check/', {
                    'target_user_id': target_user_id
                })
                
                if response.status_code == 200:
                    data = response.json()
                    can_access = data.get('can_access', False)
                    reason = data.get('reason', 'No reason provided')
                    
                    if can_access == expected_access:
                        print(f"✓ Access control correct: {can_access}")
                        print(f"  Reason: {reason}")
                    else:
                        print(f"✗ Access control incorrect: expected {expected_access}, got {can_access}")
                        print(f"  Reason: {reason}")
                else:
                    print(f"✗ Access check failed: {response.status_code}")
    
    def test_attendance_data_filtering(self):
        """Test attendance data filtering by role"""
        print("\n=== Testing Attendance Data Filtering ===")
        
        for role in ['student', 'teacher', 'parent', 'administration']:
            if role not in self.test_users:
                continue
                
            print(f"\nTesting attendance access for {role}...")
            
            if self.authenticate_as(role):
                response = self.client.get('/api/attendance/role-based/')
                
                if response.status_code == 200:
                    data = response.json()
                    records = data.get('attendance_records', [])
                    accessible_ids = data.get('accessible_student_ids', [])
                    
                    print(f"✓ {role} can access {len(records)} attendance records")
                    print(f"  Accessible student IDs: {len(accessible_ids)}")
                else:
                    print(f"✗ {role} attendance access failed: {response.status_code}")
    
    def test_attendance_statistics(self):
        """Test attendance statistics with role-based filtering"""
        print("\n=== Testing Attendance Statistics ===")
        
        for role in ['teacher', 'administration', 'parent']:
            if role not in self.test_users:
                continue
                
            print(f"\nTesting attendance statistics for {role}...")
            
            if self.authenticate_as(role):
                response = self.client.get('/api/attendance/statistics/')
                
                if response.status_code == 200:
                    data = response.json()
                    statistics = data.get('statistics', {})
                    
                    print(f"✓ {role} statistics retrieved successfully")
                    print(f"  Total records: {statistics.get('total_records', 0)}")
                    print(f"  Attendance rate: {statistics.get('attendance_rate', 0)}%")
                else:
                    print(f"✗ {role} statistics failed: {response.status_code}")
    
    def test_unauthorized_access(self):
        """Test that unauthorized requests are properly blocked"""
        print("\n=== Testing Unauthorized Access ===")
        
        # Clear authentication
        self.client.credentials()
        
        endpoints_to_test = [
            '/api/users/permissions/',
            '/api/users/role-based-users/',
            '/api/attendance/role-based/',
            '/api/attendance/statistics/',
        ]
        
        for endpoint in endpoints_to_test:
            response = self.client.get(endpoint)
            
            if response.status_code == 401:
                print(f"✓ Unauthorized access blocked for {endpoint}")
            else:
                print(f"✗ Unauthorized access allowed for {endpoint}: {response.status_code}")
    
    def run_all_tests(self):
        """Run all security tests"""
        print("Starting Role-Based Security Tests...")
        print("=" * 50)
        
        try:
            self.setup_test_users()
            self.test_user_permissions_endpoint()
            self.test_role_based_user_access()
            self.test_access_control_checks()
            self.test_attendance_data_filtering()
            self.test_attendance_statistics()
            self.test_unauthorized_access()
            
            print("\n" + "=" * 50)
            print("Role-Based Security Tests Completed!")
            
        except Exception as e:
            print(f"\n✗ Test execution failed: {str(e)}")
            import traceback
            traceback.print_exc()
        
        finally:
            # Cleanup test users
            print("\nCleaning up test users...")
            for user in self.test_users.values():
                try:
                    user.delete()
                except:
                    pass


def main():
    """Main function to run the security tests"""
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print("Role-Based Security Test Script")
        print("Usage: python test_role_security.py")
        print("\nThis script tests the role-based authentication and authorization system.")
        return
    
    tester = RoleBasedSecurityTest()
    tester.run_all_tests()


if __name__ == '__main__':
    main()