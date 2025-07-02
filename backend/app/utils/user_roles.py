from app.models import User, Enrollment, Section, Class, Institution
from sqlalchemy.orm import joinedload

def is_user_student(user):
    return any(e.role == "student" for e in user.enrollments)

def is_user_instructor(user):
    return any(e.role == "instructor" for e in user.enrollments)

def get_students_for_instructor(instructor):
    """Return all student users taught by the instructor, across sections."""
    instructor_sections = [e.section_id for e in instructor.enrollments if e.role == "instructor"]
    
    return [
        e.user for e in Enrollment.query.filter(
            Enrollment.section_id.in_(instructor_sections),
            Enrollment.role == "student"
        ).all()
    ]

def get_student_enrollment(student):
    """Return the enrollment object of a student if exists."""
    return next((e for e in student.enrollments if e.role == "student"), None)

def get_user_roles(user):
    return [enrollment.role for enrollment in user.enrollments]

def filter_users(institution=None, class_name=None, section=None, role=None):
    """
    Returns users filtered by enrollment metadata.
    All params are optional.
    """
    query = User.query.join(Enrollment).join(Enrollment.section).join(Section.class_).join(Class.institution)

    if institution:
        query = query.filter(Institution.name == institution)
    if class_name:
        query = query.filter(Class.course_code == class_name)
    if section:
        query = query.filter(Section.section_code == section)
    if role:
        query = query.filter(Enrollment.role == role)

    return query.options(joinedload(User.enrollments)).all()

def get_instructor_section(user):
    return next((e.section for e in user.enrollments if e.role == "instructor"), None)
