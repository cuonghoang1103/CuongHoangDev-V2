-- V6: Skills and Projects tables for AI Knowledge Base
-- Bảng kỹ năng
CREATE TABLE skills (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    category        VARCHAR(50),              -- 'language', 'framework', 'tool', 'soft-skill'
    proficiency     INT DEFAULT 3,             -- 1-5, mức độ thành thạo
    description     TEXT,
    years_experience INT DEFAULT 0,
    is_featured     BOOLEAN DEFAULT FALSE,
    display_order  INT DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng dự án
CREATE TABLE projects (
    id              BIGSERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    content         TEXT,                     -- Chi tiết dự án
    thumbnail_url   VARCHAR(500),
    project_url     VARCHAR(500),
    github_url      VARCHAR(500),
    tech_stack      TEXT,                     -- Danh sách công nghệ (comma-separated)
    role            VARCHAR(100),            -- Vai trò trong dự án
    duration        VARCHAR(100),             -- Thời gian thực hiện
    status          VARCHAR(20) DEFAULT 'COMPLETED',  -- PLANNING, IN_PROGRESS, COMPLETED, ON_HOLD
    is_featured     BOOLEAN DEFAULT FALSE,
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng trung gian projects_skills
CREATE TABLE project_skills (
    project_id      BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    skill_id        BIGINT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, skill_id)
);

-- Indexes
CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_is_featured ON skills(is_featured);
CREATE INDEX idx_skills_display_order ON skills(display_order);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_is_featured ON projects(is_featured);
CREATE INDEX idx_projects_slug ON projects(slug);

-- Dữ liệu mẫu skills
INSERT INTO skills (name, slug, category, proficiency, description, years_experience, is_featured, display_order) VALUES
    ('Java', 'java', 'language', 5, 'Ngôn ngữ lập trình hướng đối tượng, mạnh mẽ và an toàn', 5, TRUE, 1),
    ('Spring Boot', 'spring-boot', 'framework', 5, 'Framework Java phổ biến nhất cho Enterprise', 4, TRUE, 2),
    ('JavaScript', 'javascript', 'language', 4, 'Ngôn ngữ lập trình web, linh hoạt và phổ biến', 4, TRUE, 3),
    ('React', 'react', 'framework', 4, 'Thư viện JavaScript cho giao diện người dùng', 3, TRUE, 4),
    ('TypeScript', 'typescript', 'language', 4, 'JavaScript với kiểu dữ liệu tĩnh', 3, TRUE, 5),
    ('Next.js', 'next-js', 'framework', 4, 'Framework React cho Server-Side Rendering', 2, TRUE, 6),
    ('PostgreSQL', 'postgresql', 'database', 4, 'Hệ quản trị cơ sở dữ liệu quan hệ', 4, TRUE, 7),
    ('Docker', 'docker', 'tool', 4, 'Công cụ đóng gói và triển khai ứng dụng', 3, TRUE, 8),
    ('Git', 'git', 'tool', 5, 'Hệ thống quản lý phiên bản phân tán', 5, TRUE, 9),
    ('AWS', 'aws', 'tool', 3, 'Nền tảng điện toán đám mây của Amazon', 2, FALSE, 10),
    ('REST API', 'rest-api', 'skill', 5, 'Thiết kế và phát triển RESTful API', 4, TRUE, 11),
    ('CI/CD', 'cicd', 'skill', 3, 'Tích hợp liên tục và Triển khai liên tục', 2, FALSE, 12),
    ('Agile/Scrum', 'agile-scrum', 'soft-skill', 4, 'Phương pháp phát triển phần mềm linh hoạt', 3, FALSE, 13),
    ('Problem Solving', 'problem-solving', 'soft-skill', 5, 'Kỹ năng phân tích và giải quyết vấn đề', 5, TRUE, 14),
    ('Teamwork', 'teamwork', 'soft-skill', 5, 'Kỹ năng làm việc nhóm hiệu quả', 5, FALSE, 15);

-- Dữ liệu mẫu projects
INSERT INTO projects (title, slug, description, content, tech_stack, role, duration, status, is_featured, start_date, end_date) VALUES
    ('CuongHoangDev Portfolio V2', 'cuonghoangdev-portfolio-v2',
     'Hệ thống portfolio cá nhân thế hệ mới với AI chatbot tích hợp',
     'Dự án xây dựng hệ thống portfolio thương mại điện tử tích hợp AI chatbot sử dụng kiến trúc RAG (Retrieval Augmented Generation). Hệ thống bao gồm backend Spring Boot, frontend Next.js, PostgreSQL với pgvector, Redis cache, và AI chatbot thông minh.',
     'Java, Spring Boot, Spring Security, PostgreSQL, pgvector, Redis, Next.js, TypeScript, Tailwind CSS, Docker',
     'Full-stack Developer',
     '30 ngày',
     'IN_PROGRESS',
     TRUE,
     '2026-05-01',
     '2026-05-30'),

    ('E-Commerce Platform', 'ecommerce-platform',
     'Nền tảng thương mại điện tử với đầy đủ tính năng quản lý sản phẩm, giỏ hàng, thanh toán',
     'Xây dựng hệ thống thương mại điện tử hoàn chỉnh bao gồm quản lý sản phẩm, giỏ hàng, thanh toán online, quản lý đơn hàng, và dashboard admin.',
     'Java, Spring Boot, React, PostgreSQL, MongoDB, Stripe API, Docker, Nginx',
     'Backend Developer',
     '3 tháng',
     'COMPLETED',
     TRUE,
     '2025-09-01',
     '2025-12-01'),

    ('Real-time Chat Application', 'realtime-chat-app',
     'Ứng dụng chat thời gian thực với WebSocket và Spring WebFlux',
     'Xây dựng ứng dụng chat thời gian thực sử dụng WebSocket, Spring WebFlux cho reactive programming, và Redis Pub/Sub cho message broker.',
     'Java, Spring WebFlux, WebSocket, Redis, React, TypeScript, Docker',
     'Backend Developer',
     '2 tháng',
     'COMPLETED',
     FALSE,
     '2025-06-01',
     '2025-08-01'),

    ('Microservices Demo', 'microservices-demo',
     'Hệ thống microservices demo với Spring Cloud, API Gateway, và Service Discovery',
     'Triển khai kiến trúc microservices với Spring Cloud, Eureka Service Discovery, API Gateway, Config Server, và Circuit Breaker pattern.',
     'Java, Spring Cloud, Eureka, API Gateway, PostgreSQL, MongoDB, Docker, Kubernetes',
     'Backend Architect',
     '4 tháng',
     'COMPLETED',
     FALSE,
     '2025-01-01',
     '2025-05-01');

-- Liên kết projects với skills
INSERT INTO project_skills (project_id, skill_id) 
SELECT p.id, s.id FROM projects p, skills s 
WHERE p.slug = 'cuonghoangdev-portfolio-v2' AND s.slug IN ('java', 'spring-boot', 'postgresql', 'docker', 'rest-api', 'problem-solving');

INSERT INTO project_skills (project_id, skill_id) 
SELECT p.id, s.id FROM projects p, skills s 
WHERE p.slug = 'ecommerce-platform' AND s.slug IN ('java', 'spring-boot', 'postgresql', 'rest-api', 'docker');

INSERT INTO project_skills (project_id, skill_id) 
SELECT p.id, s.id FROM projects p, skills s 
WHERE p.slug = 'realtime-chat-app' AND s.slug IN ('java', 'spring-boot', 'docker', 'problem-solving');

INSERT INTO project_skills (project_id, skill_id) 
SELECT p.id, s.id FROM projects p, skills s 
WHERE p.slug = 'microservices-demo' AND s.slug IN ('java', 'spring-boot', 'docker', 'teamwork', 'problem-solving');
