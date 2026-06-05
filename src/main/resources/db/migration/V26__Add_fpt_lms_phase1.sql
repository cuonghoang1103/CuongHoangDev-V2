-- FPT LMS Phase 1
-- Add semesters, lesson details, assignments, and assignment submissions

CREATE TABLE semesters (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    ordinal INT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO semesters (name, code, ordinal, description)
VALUES
    ('Kỳ 1', 'SEM1', 1, 'FPT University semester 1'),
    ('Kỳ 2', 'SEM2', 2, 'FPT University semester 2'),
    ('Kỳ 3', 'SEM3', 3, 'FPT University semester 3'),
    ('Kỳ 4', 'SEM4', 4, 'FPT University semester 4'),
    ('Kỳ 5', 'SEM5', 5, 'FPT University semester 5'),
    ('Kỳ 6', 'SEM6', 6, 'FPT University semester 6'),
    ('Kỳ 7', 'SEM7', 7, 'FPT University semester 7'),
    ('Kỳ 8', 'SEM8', 8, 'FPT University semester 8'),
    ('Kỳ 9', 'SEM9', 9, 'FPT University semester 9');

ALTER TABLE courses
    ADD COLUMN semester_id BIGINT REFERENCES semesters(id) ON DELETE SET NULL,
    ADD COLUMN course_code VARCHAR(50),
    ADD COLUMN academy_type VARCHAR(30) DEFAULT 'GENERAL';

CREATE INDEX idx_courses_semester ON courses(semester_id);
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_academy_type ON courses(academy_type);

CREATE TABLE lesson_details (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL UNIQUE REFERENCES lessons(id) ON DELETE CASCADE,
    video_platform VARCHAR(30) DEFAULT 'EMBED',
    source_code_url VARCHAR(500),
    teaching_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO lesson_details (lesson_id, video_platform, source_code_url, teaching_notes)
SELECT id, 'EMBED', NULL, content
FROM lessons;

CREATE INDEX idx_lesson_details_lesson ON lesson_details(lesson_id);

CREATE TABLE assignments (
    id BIGSERIAL PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    deadline TIMESTAMP,
    sort_order INT DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_lesson ON assignments(lesson_id);

CREATE TABLE assignment_submissions (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_url VARCHAR(500) NOT NULL,
    notes TEXT,
    status VARCHAR(30) DEFAULT 'SUBMITTED',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (assignment_id, user_id)
);

CREATE INDEX idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_user ON assignment_submissions(user_id);
