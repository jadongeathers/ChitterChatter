BEGIN;

CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Running upgrade  -> 7132d4c5499d

CREATE TABLE practice_cases (
    id SERIAL NOT NULL, 
    institution VARCHAR(100) NOT NULL, 
    class_name VARCHAR(100) NOT NULL, 
    title VARCHAR(255), 
    description TEXT, 
    min_time INTEGER, 
    max_time INTEGER, 
    system_prompt TEXT NOT NULL, 
    feedback_prompt TEXT, 
    voice VARCHAR(50), 
    language_code VARCHAR(10), 
    published BOOLEAN, 
    date_added TIMESTAMP WITH TIME ZONE, 
    accessible_on TIMESTAMP WITH TIME ZONE, 
    PRIMARY KEY (id)
);

CREATE INDEX ix_practice_cases_class_name ON practice_cases (class_name);

CREATE INDEX ix_practice_cases_id ON practice_cases (id);

CREATE TABLE users (
    id SERIAL NOT NULL, 
    email_encrypted BYTEA NOT NULL, 
    first_name_encrypted BYTEA, 
    last_name_encrypted BYTEA, 
    password_hash VARCHAR(255) NOT NULL, 
    profile_picture VARCHAR(100), 
    institution VARCHAR(255), 
    class_name VARCHAR(255), 
    section VARCHAR(255), 
    access_group VARCHAR(255), 
    is_student BOOLEAN, 
    is_master BOOLEAN, 
    is_registered BOOLEAN, 
    has_consented BOOLEAN, 
    consent_date TIMESTAMP WITH TIME ZONE, 
    is_active BOOLEAN, 
    email_notifications BOOLEAN, 
    deactivated_at TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE, 
    last_login TIMESTAMP WITH TIME ZONE, 
    PRIMARY KEY (id), 
    UNIQUE (email_encrypted)
);

CREATE TABLE conversations (
    id SERIAL NOT NULL, 
    student_id INTEGER NOT NULL, 
    practice_case_id INTEGER, 
    start_time TIMESTAMP WITH TIME ZONE, 
    end_time TIMESTAMP WITH TIME ZONE, 
    duration INTEGER, 
    completed BOOLEAN, 
    language VARCHAR(50), 
    feedback TEXT, 
    PRIMARY KEY (id), 
    FOREIGN KEY(practice_case_id) REFERENCES practice_cases (id), 
    FOREIGN KEY(student_id) REFERENCES users (id)
);

CREATE INDEX ix_conversations_id ON conversations (id);

CREATE TABLE survey_redirects (
    id SERIAL NOT NULL, 
    user_id INTEGER, 
    email_encrypted BYTEA NOT NULL, 
    survey_type VARCHAR(50) NOT NULL, 
    redirected_at TIMESTAMP WITH TIME ZONE, 
    completed BOOLEAN, 
    completed_at TIMESTAMP WITH TIME ZONE, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE system_feedback (
    id SERIAL NOT NULL, 
    user_id INTEGER NOT NULL, 
    content TEXT NOT NULL, 
    submitted_at TIMESTAMP WITH TIME ZONE, 
    status VARCHAR(20), 
    reviewed_by INTEGER, 
    reviewed_at TIMESTAMP WITH TIME ZONE, 
    notes TEXT, 
    PRIMARY KEY (id), 
    FOREIGN KEY(reviewed_by) REFERENCES users (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

CREATE TABLE messages (
    id SERIAL NOT NULL, 
    conversation_id INTEGER, 
    student_id INTEGER NOT NULL, 
    role VARCHAR(50), 
    content TEXT, 
    timestamp TIMESTAMP WITH TIME ZONE, 
    PRIMARY KEY (id), 
    FOREIGN KEY(conversation_id) REFERENCES conversations (id), 
    FOREIGN KEY(student_id) REFERENCES users (id)
);

CREATE INDEX ix_messages_id ON messages (id);

INSERT INTO alembic_version (version_num) VALUES ('7132d4c5499d') RETURNING alembic_version.version_num;

-- Running upgrade 7132d4c5499d -> e227861ea616

CREATE TABLE surveys (
    id SERIAL NOT NULL, 
    user_id INTEGER, 
    email_encrypted BYTEA NOT NULL, 
    survey_type VARCHAR(50) NOT NULL, 
    started_at TIMESTAMP WITH TIME ZONE, 
    completed BOOLEAN, 
    completed_at TIMESTAMP WITH TIME ZONE, 
    responses_encrypted BYTEA, 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

DROP TABLE survey_redirects;

UPDATE alembic_version SET version_num='e227861ea616' WHERE alembic_version.version_num = '7132d4c5499d';

-- Running upgrade e227861ea616 -> 8018ac95ecfb

ALTER TABLE users ADD COLUMN has_completed_survey BOOLEAN;

UPDATE alembic_version SET version_num='8018ac95ecfb' WHERE alembic_version.version_num = 'e227861ea616';

-- Running upgrade 8018ac95ecfb -> b396efdb393f

CREATE TABLE instructors (
    id INTEGER NOT NULL, 
    office_hours VARCHAR(255), 
    PRIMARY KEY (id), 
    FOREIGN KEY(id) REFERENCES users (id)
);

CREATE TABLE students (
    id INTEGER NOT NULL, 
    graduation_year VARCHAR(255), 
    PRIMARY KEY (id), 
    FOREIGN KEY(id) REFERENCES users (id)
);

ALTER TABLE users DROP COLUMN is_student;

ALTER TABLE users DROP COLUMN class_name;

UPDATE alembic_version SET version_num='b396efdb393f' WHERE alembic_version.version_num = '8018ac95ecfb';

-- Running upgrade b396efdb393f -> a0195111d971

CREATE TABLE institutions (
    id SERIAL NOT NULL, 
    name VARCHAR(255) NOT NULL, 
    location TEXT, 
    PRIMARY KEY (id)
);

CREATE TABLE classes (
    id SERIAL NOT NULL, 
    course_code VARCHAR(255) NOT NULL, 
    title VARCHAR(255) NOT NULL, 
    description TEXT, 
    institution_id INTEGER NOT NULL, 
    PRIMARY KEY (id), 
    FOREIGN KEY(institution_id) REFERENCES institutions (id), 
    UNIQUE (course_code)
);

CREATE TABLE sections (
    id SERIAL NOT NULL, 
    class_id INTEGER, 
    term VARCHAR(10) NOT NULL, 
    section_code VARCHAR(10) NOT NULL, 
    meeting_times TEXT, 
    PRIMARY KEY (id), 
    FOREIGN KEY(class_id) REFERENCES classes (id), 
    CONSTRAINT unique_section_per_term UNIQUE (class_id, section_code, term)
);

CREATE TYPE role_enum AS ENUM ('student', 'instructor', 'TA');

CREATE TABLE enrollments (
    user_id INTEGER NOT NULL, 
    section_id INTEGER NOT NULL, 
    role role_enum NOT NULL, 
    PRIMARY KEY (user_id, section_id), 
    FOREIGN KEY(section_id) REFERENCES sections (id), 
    FOREIGN KEY(user_id) REFERENCES users (id)
);

UPDATE alembic_version SET version_num='a0195111d971' WHERE alembic_version.version_num = 'b396efdb393f';

-- Running upgrade a0195111d971 -> 99950e652283

ALTER TABLE conversations ADD COLUMN user_id INTEGER;

ALTER TABLE conversations ADD CONSTRAINT fk_user_id FOREIGN KEY(user_id) REFERENCES users (id);

UPDATE conversations SET user_id = student_id;

ALTER TABLE conversations ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE conversations DROP CONSTRAINT conversations_student_id_fkey;

ALTER TABLE conversations DROP COLUMN student_id;

ALTER TABLE messages ADD COLUMN user_id INTEGER;

ALTER TABLE messages ADD CONSTRAINT fk_msg_user_id FOREIGN KEY(user_id) REFERENCES users (id);

UPDATE messages SET user_id = student_id;

ALTER TABLE messages ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE messages DROP CONSTRAINT messages_student_id_fkey;

ALTER TABLE messages DROP COLUMN student_id;

ALTER TABLE practice_cases ADD COLUMN goals TEXT;

ALTER TABLE users DROP COLUMN section;

UPDATE alembic_version SET version_num='99950e652283' WHERE alembic_version.version_num = 'a0195111d971';

COMMIT;

