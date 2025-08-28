from django.test import TestCase
from django.utils import timezone
from datetime import timedelta, date, time
from unittest.mock import patch

from attendance.models import Class, AttendanceSession
from users.models import User
from attendance.views import is_session_within_marking_window


class MarkingWindowTests(TestCase):
    def setUp(self):
        # Create a teacher user
        self.teacher = User.objects.create_user(
            email="teacher@example.com",
            username="teacher1",
            password="password123",
            role="teacher",
            first_name="Teach",
            last_name="Er"
        )
        # Create a class
        self.cls = Class.objects.create(
            name="Class 10A",
            level=1,
            teacher=self.teacher,
        )

    def _create_session_with_created_at(self, created_at: timezone.datetime, is_active: bool = True) -> AttendanceSession:
        # Create with default timestamps first
        session = AttendanceSession.objects.create(
            class_obj=self.cls,
            session_type="morning",
            date=date.today(),
            start_time=time(9, 0),
            end_time=time(10, 0),
            is_active=is_active,
            created_by=self.teacher,
        )
        # Update created_at to the desired value (auto_now_add prevents direct set on first save)
        AttendanceSession.objects.filter(id=session.id).update(created_at=created_at)
        session.refresh_from_db()
        return session

    def test_before_15_minutes_returns_true(self):
        now = timezone.now()
        created_at = now - timedelta(minutes=10)
        session = self._create_session_with_created_at(created_at)
        with patch("attendance.views.timezone.now", return_value=now):
            self.assertTrue(is_session_within_marking_window(session))

    def test_exactly_15_minutes_returns_true(self):
        # Boundary condition: now == created_at + 15 minutes should be allowed
        created_at = timezone.now()
        boundary_time = created_at + timedelta(minutes=15)
        session = self._create_session_with_created_at(created_at)
        with patch("attendance.views.timezone.now", return_value=boundary_time):
            self.assertTrue(is_session_within_marking_window(session))

    def test_after_15_minutes_returns_false(self):
        created_at = timezone.now() - timedelta(minutes=16)
        session = self._create_session_with_created_at(created_at)
        with patch("attendance.views.timezone.now", return_value=timezone.now()):
            self.assertFalse(is_session_within_marking_window(session))

    def test_inactive_session_returns_false_even_within_window(self):
        now = timezone.now()
        created_at = now - timedelta(minutes=5)
        session = self._create_session_with_created_at(created_at, is_active=False)
        with patch("attendance.views.timezone.now", return_value=now):
            self.assertFalse(is_session_within_marking_window(session))
