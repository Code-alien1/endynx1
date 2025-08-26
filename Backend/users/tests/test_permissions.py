from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from users.models import User


class UsersPermissionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Admin and Superadmin
        self.admin = User.objects.create_user(
            email="admin@example.com", username="admin", role="administration", password="pass1234"
        )
        self.superadmin = User.objects.create_user(
            email="sadmin@example.com", username="sadmin", role="superadmin", password="pass1234"
        )
        # Teacher
        self.teacher = User.objects.create_user(
            email="teacher@example.com", username="teacher", role="teacher", password="pass1234"
        )
        # Parent
        self.parent = User.objects.create_user(
            email="parent@example.com", username="parent", role="parent", password="pass1234"
        )
        # Students
        self.student1 = User.objects.create_user(
            email="student1@example.com", username="student1", role="student", password="pass1234", level=1,
            student_id="S001", parent=self.parent
        )
        self.student2 = User.objects.create_user(
            email="student2@example.com", username="student2", role="student", password="pass1234", level=2,
            student_id="S002"
        )
        # Mentor (level 3)
        self.mentor = User.objects.create_user(
            email="mentor@example.com", username="mentor", role="mentor", password="pass1234", level=3,
            mentor_id="M001"
        )

    def test_parent_sees_only_their_children_in_student_list(self):
        url = reverse("users:student-list")
        self.client.force_authenticate(user=self.parent)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        # Ensure only the parent's child is returned
        returned_ids = {u["id"] for u in resp.json()}
        self.assertIn(str(self.student1.id), returned_ids)
        self.assertNotIn(str(self.student2.id), returned_ids)

    def test_assign_mentor_requires_admin(self):
        url = reverse("users:assign-mentor")
        payload = {"student_id": str(self.student1.id), "mentor_id": str(self.mentor.id)}

        # Teacher should be forbidden by CanManageUsers
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 403)

        # Admin should be allowed
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json().get("message"), "Mentor assigned successfully")

    def test_user_permissions_endpoint_authenticated(self):
        url = reverse("users:user-permissions")

        # Student gets a permissions dict
        self.client.force_authenticate(user=self.student1)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertEqual(body.get("role"), "student")
        self.assertIn("permissions", body)

        # Anonymous should be 401
        self.client.force_authenticate(user=None)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 401)
