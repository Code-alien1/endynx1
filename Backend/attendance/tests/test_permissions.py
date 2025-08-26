from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from django.utils import timezone
from datetime import date, time

from users.models import User
from attendance.models import Class, AttendanceSession, Attendance


class AttendancePermissionsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Users
        self.admin = User.objects.create_user(
            email="admin@example.com", username="admin", role="administration", password="pass1234"
        )
        self.teacher = User.objects.create_user(
            email="teacher@example.com", username="teacher", role="teacher", password="pass1234"
        )
        self.other_teacher = User.objects.create_user(
            email="othert@example.com", username="othert", role="teacher", password="pass1234"
        )
        self.parent = User.objects.create_user(
            email="parent@example.com", username="parent", role="parent", password="pass1234"
        )
        self.student = User.objects.create_user(
            email="student@example.com", username="student", role="student", password="pass1234", level=1,
            student_id="S100", parent=self.parent
        )

        # Class and session
        self.class_obj = Class.objects.create(name="Class A", level=1, teacher=self.teacher)
        self.class_obj.students.add(self.student)

        self.session = AttendanceSession.objects.create(
            class_obj=self.class_obj,
            session_type="morning",
            date=date.today(),
            start_time=time(9, 0, 0),
            end_time=time(10, 0, 0),
            created_by=self.teacher,
        )

        # Attendance record
        self.attendance = Attendance.objects.create(
            student=self.student,
            session=self.session,
            status="present",
            method="manual",
        )

    def test_role_based_attendance_teacher_allowed_student_forbidden(self):
        url = reverse("attendance:role-based-attendance")

        # Teacher can view (CanViewAllStudents)
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)

        # Student cannot view (lacks CanViewAllStudents)
        self.client.force_authenticate(user=self.student)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 403)

    def test_parent_child_permission_on_attendance_list(self):
        url = reverse("attendance:attendance-list")
        self.client.force_authenticate(user=self.parent)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        ids = {rec["id"] for rec in resp.json()}
        self.assertIn(str(self.attendance.id), ids)

        # Unrelated parent should see nothing
        other_parent = User.objects.create_user(
            email="otherparent@example.com", username="otherparent", role="parent", password="pass1234"
        )
        self.client.force_authenticate(user=other_parent)
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 0)

    def test_qr_generate_requires_creator_teacher_or_admin(self):
        url = reverse("attendance:qr-generate")
        payload = {"session_id": str(self.session.id), "expires_in_minutes": 5}

        # Other teacher (not creator) forbidden by internal check
        self.client.force_authenticate(user=self.other_teacher)
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 403)

        # Creator teacher allowed
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("qr_code", resp.json())

        # Admin allowed
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 200)

    def test_attendance_verification_requires_teacher_creator_or_admin(self):
        url = reverse("attendance:verify-attendance")
        payload = {"attendance_id": str(self.attendance.id), "status": "present", "notes": "ok"}

        # Other teacher forbidden
        self.client.force_authenticate(user=self.other_teacher)
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 403)

        # Creator teacher allowed
        self.client.force_authenticate(user=self.teacher)
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 200)

        # Admin allowed
        self.client.force_authenticate(user=self.admin)
        resp = self.client.post(url, payload, format="json")
        self.assertEqual(resp.status_code, 200)
