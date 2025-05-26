import os
import sys
import re

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from backend.app.models import PracticeCase, db
from app import create_app

def extract_field(text, field_name):
    """Extracts a specific field from the text using a regex pattern."""
    pattern = rf"{field_name}:(.*?)(?=\n[A-Z]+:|\Z)"  # Looks for `FIELD: value` pattern
    match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else None

def save_cases(materials_path="app/materials"):
    """
    Parse all files in the materials directory and save or update practice cases in the database.
    """

    app = create_app()
    with app.app_context():
        for institution in os.listdir(materials_path):
            institution_path = os.path.join(materials_path, institution)
            if not os.path.isdir(institution_path):
                continue  # Skip files, only process directories

            for class_name in os.listdir(institution_path):
                class_path = os.path.join(institution_path, class_name)
                if not os.path.isdir(class_path):
                    continue  # Skip files, only process directories

                for lesson_file in os.listdir(class_path):
                    if lesson_file.startswith("lesson_") and lesson_file.endswith(".txt"):
                        # Extract lesson number from the file name
                        lesson_number = int(lesson_file.replace("lesson_", "").replace(".txt", ""))

                        # Read the system prompt from the file
                        lesson_path = os.path.join(class_path, lesson_file)
                        with open(lesson_path, "r", encoding="utf-8") as f:
                            lesson_text = f.read().strip()

                        # Extract title, description, and prompt
                        title = extract_field(lesson_text, "TITLE") or f"Lesson {lesson_number} Placeholder Title"
                        description = extract_field(lesson_text, "DESCRIPTION") or f"Lesson {lesson_number} Placeholder Description"
                        system_prompt = extract_field(lesson_text, "PROMPT") or "Default system prompt"

                        # Check if the practice case already exists
                        existing_case = PracticeCase.query.filter_by(
                            institution=institution,
                            class_name=class_name,
                            lesson_number=lesson_number
                        ).first()

                        if existing_case:
                            # Update the existing case
                            existing_case.title = title
                            existing_case.description = description
                            existing_case.system_prompt = system_prompt.strip()
                            existing_case.max_time = 20  # Default max_time
                            print(f"🔄 Updated existing case: {title} (Lesson {lesson_number})")
                        else:
                            # Insert new case
                            practice_case = PracticeCase(
                                institution=institution,
                                class_name=class_name,
                                lesson_number=lesson_number,
                                title=title,
                                description=description,
                                max_time=20,  # Default max_time
                                system_prompt=system_prompt.strip(),
                            )
                            db.session.add(practice_case)
                            print(f"✅ Added new case: {title} (Lesson {lesson_number})")

        db.session.commit()
        print("✅ All cases have been saved/updated.")

if __name__ == '__main__':
    save_cases()
