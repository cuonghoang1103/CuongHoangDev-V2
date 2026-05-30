-- Seed course categories
INSERT INTO course_categories (name, slug, description, icon, sort_order, is_active) VALUES
  ('Web Development', 'web-development', 'Learn frontend and backend web development with modern frameworks', 'code', 1, true),
  ('Mobile Development', 'mobile-development', 'Build iOS and Android apps with React Native and Flutter', 'smartphone', 2, true),
  ('Data Science & AI', 'data-science-ai', 'Master machine learning, deep learning and AI technologies', 'brain', 3, true),
  ('DevOps & Cloud', 'devops-cloud', 'Cloud computing, Docker, Kubernetes and CI/CD pipelines', 'cloud', 4, true),
  ('Database', 'database', 'SQL, NoSQL, database design and optimization', 'database', 5, true),
  ('Programming Fundamentals', 'programming-fundamentals', 'Learn programming basics with Python, Java, C++', 'terminal', 6, true);
