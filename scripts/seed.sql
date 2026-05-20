-- Примеры тестовых данных для инициализации базы

-- Вставка примеров пользователей (пароли хешированы bcryptjs)
-- Учитель: teacher@example.com / teacher123
-- Ученик: student1@example.com / student123
INSERT INTO users (email, name, password_hash, user_type) 
VALUES 
  ('teacher@example.com', 'Иван Иванов', '$2b$10$xDtuAsp6Mpd2lcN7qhajWuNxbJT.ZNihKFLW3skGQuPOjg2uDjnUS', 'teacher'),
  ('student1@example.com', 'Петр Петров', '$2b$10$3w5weVIP2BLBvXW6DVSBTOBe/OOeKUTNdQ0l3mQ3C1Nei1JUgAh0q', 'student'),
  ('student2@example.com', 'Мария Сидорова', '$2b$10$3w5weVIP2BLBvXW6DVSBTOBe/OOeKUTNdQ0l3mQ3C1Nei1JUgAh0q', 'student')
ON CONFLICT DO NOTHING;

-- Вставка примера курса
INSERT INTO courses (title, description, teacher_id)
SELECT 'Основы программирования', 'Курс об основах программирования на разных языках', id
FROM users
WHERE email = 'teacher@example.com'
ON CONFLICT DO NOTHING;

-- Вставка примеров уроков
INSERT INTO lessons (course_id, title, content, order_index)
SELECT 
  c.id,
  'Введение в программирование',
  'Программирование - это процесс создания инструкций для компьютера. В этом уроке вы узнаете основные концепции.',
  1
FROM courses c
WHERE c.title = 'Основы программирования'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, content, order_index)
SELECT 
  c.id,
  'Переменные и типы данных',
  'Переменные используются для хранения значений. Существуют разные типы данных: числа, строки, логические значения.',
  2
FROM courses c
WHERE c.title = 'Основы программирования'
ON CONFLICT DO NOTHING;

-- Вставка примеров вопросов тестов
INSERT INTO quiz_questions (lesson_id, question_text)
SELECT l.id, 'Что такое переменная в программировании?'
FROM lessons l
WHERE l.title = 'Переменные и типы данных'
ON CONFLICT DO NOTHING;

-- Вставка вариантов ответов
INSERT INTO quiz_answers (question_id, answer_text, is_correct)
SELECT 
  q.id,
  'Место в памяти для хранения значения',
  true
FROM quiz_questions q
WHERE q.question_text = 'Что такое переменная в программировании?'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_answers (question_id, answer_text, is_correct)
SELECT 
  q.id,
  'Название функции',
  false
FROM quiz_questions q
WHERE q.question_text = 'Что такое переменная в программировании?'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_answers (question_id, answer_text, is_correct)
SELECT 
  q.id,
  'Тип данных',
  false
FROM quiz_questions q
WHERE q.question_text = 'Что такое переменная в программировании?'
ON CONFLICT DO NOTHING;

INSERT INTO quiz_answers (question_id, answer_text, is_correct)
SELECT 
  q.id,
  'Оператор цикла',
  false
FROM quiz_questions q
WHERE q.question_text = 'Что такое переменная в программировании?'
ON CONFLICT DO NOTHING;
