-- Food Recipe App Database Schema
-- Inferred from actual SQL queries in controllers/ and models/
-- PostgreSQL

-- Stores registered users (email/password auth with role-based access)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  fullname      TEXT NOT NULL,
  phoneNumber   TEXT NOT NULL,
  password      TEXT NOT NULL,
  role          INTEGER NOT NULL DEFAULT 2,
  profilePicture TEXT DEFAULT 'https://res.cloudinary.com/drqodwhwd/image/upload/v1779884611/default-profile-picture_pjh4hd.jpg'
);

-- Stores recipes created by users
CREATE TABLE IF NOT EXISTS recipes (
  id            SERIAL PRIMARY KEY,
  recipePicture TEXT NOT NULL,
  title         TEXT NOT NULL,
  ingredients   TEXT NOT NULL,
  videoLink     TEXT,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  category      TEXT NOT NULL
);

-- UNCERTAIN COLUMNS:
--
-- 1. created_at / updated_at timestamps
--    No query in the codebase references any timestamp column. It is possible
--    the tables have them but the app never reads or writes them explicitly.
--    If they do exist, they were likely added by a different process or tool
--    outside this repo.
--
-- 2. users.role domain values
--    The code only checks role == 1 for admin privileges and defaults new
--    users to role = 2. Whether additional role values exist is unknown.
--
-- 3. Column types (TEXT vs VARCHAR)
--    The postgres npm package maps JavaScript strings to TEXT. There may be
--    length-constrained VARCHAR columns in the actual database that cannot
--    be inferred from the queries alone.
