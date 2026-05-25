-- Run this in the Supabase SQL Editor for the xmmfvsgymrlktycxgumh project
-- Dashboard: https://supabase.com/dashboard/project/xmmfvsgymrlktycxgumh/sql

create table if not exists assessments (
  id uuid default gen_random_uuid() primary key,
  child_name text,
  child_age int,
  assessment_type text,
  reading_score int default 0,
  writing_score int default 0,
  communication_score int default 0,
  math_score int default 0,
  total_score int default 0,
  learning_stage text,
  created_at timestamptz default now()
);

-- Disable RLS for now (same as other tables)
alter table assessments disable row level security;
