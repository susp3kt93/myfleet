-- =====================================================
-- MyFleet v1.2 Database Setup - Complete Migration
-- =====================================================
-- This file contains:
-- 1. Full v1.0 schema (all tables)
-- 2. Gamification tables (achievements, user_achievements)
-- 3. User stats columns for gamification
-- 4. Initial achievement seeds (15 achievements)
-- =====================================================

-- Drop existing tables if re-running (careful!)
-- DROP TABLE IF EXISTS user_achievements CASCADE;
-- DROP TABLE IF EXISTS achievements CASCADE;
-- (Uncomment above only if you need to reset)

-- =====================================================
-- PART 1: Core v1.0 Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table (Multi-tenant)
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  logo TEXT,
  is_active BOOLEAN DEFAULT true,
  plan TEXT DEFAULT 'FREE',
  max_drivers INTEGER DEFAULT 5,
  max_vehicles INTEGER DEFAULT 5,
  invoice_template TEXT,
  invoice_prefix TEXT,
  invoice_footer_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  personal_id TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  role TEXT NOT NULL DEFAULT 'DRIVER',
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  push_token TEXT,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  total_earnings REAL DEFAULT 0,
  preferred_language TEXT DEFAULT 'ro',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  plate TEXT UNIQUE NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  type TEXT DEFAULT 'VAN',
  color TEXT,
  vin TEXT,
  status TEXT DEFAULT 'ACTIVE',
  current_mileage REAL DEFAULT 0,
  last_service_date TIMESTAMPTZ,
  last_service_mileage REAL,
  next_service_date TIMESTAMPTZ,
  next_service_mileage REAL,
  service_interval_days INTEGER DEFAULT 180,
  service_interval_km REAL DEFAULT 10000,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  assigned_driver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'PENDING',
  priority TEXT DEFAULT 'MEDIUM',
  price REAL NOT NULL,
  actual_earnings REAL,
  pickup_location TEXT,
  delivery_location TEXT,
  pickup_lat REAL,
  pickup_lng REAL,
  delivery_lat REAL,
  delivery_lng REAL,
  cancelled_reason TEXT,
  rejected_reason TEXT,
  completed_at TIMESTAMPTZ,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deductions table
CREATE TABLE IF NOT EXISTS deductions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  description TEXT,
  frequency TEXT DEFAULT 'ONE_TIME',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applied_count INTEGER DEFAULT 0,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Off Requests table
CREATE TABLE IF NOT EXISTS time_off_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  request_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  reason TEXT,
  type TEXT DEFAULT 'VACATION',
  status TEXT DEFAULT 'PENDING',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'INFO',
  data TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log table
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details TEXT,
  metadata TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PART 2: Gamification Tables
-- =====================================================

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- =====================================================
-- PART 3: Add Gamification Columns to Users
-- =====================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_kilometers REAL DEFAULT 0;

-- =====================================================
-- PART 4: Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_company ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_time_off_user ON time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company ON activity_logs(company_id);

-- =====================================================
-- PART 5: Seed Initial Achievements
-- =====================================================

INSERT INTO achievements (id, code, name, description, category, icon, requirement, points) VALUES
-- Task Completion (5 achievements)
('ach_first_delivery', 'first_delivery', 'First Delivery', 'Complete your first task', 'tasks', '🎉', 1, 10),
('ach_regular', 'regular_driver', 'Regular Driver', 'Complete 10 tasks', 'tasks', '🥈', 10, 50),
('ach_pro', 'pro_driver', 'Pro Driver', 'Complete 50 tasks', 'tasks', '🥇', 50, 200),
('ach_elite', 'elite_driver', 'Elite Driver', 'Complete 100 tasks', 'tasks', '💎', 100, 500),
('ach_legend', 'legendary_driver', 'Legendary Driver', 'Complete 500 tasks', 'tasks', '👑', 500, 2000),

-- Earnings (4 achievements)
('ach_first_pound', 'first_pound', 'First Pound', 'Earn your first £', 'earnings', '💵', 1, 5),
('ach_century', 'century', 'Century', 'Earn £100', 'earnings', '💷', 100, 50),
('ach_grand', 'grand', 'Grand', 'Earn £1,000', 'earnings', '💸', 1000, 200),
('ach_high_roller', 'high_roller', 'High Roller', 'Earn £5,000', 'earnings', '💰', 5000, 1000),

-- Efficiency (3 achievements)
('ach_speed', 'speed_demon', 'Speed Demon', 'Complete 5 tasks in one day', 'efficiency', '🚀', 5, 100),
('ach_flash', 'flash', 'Flash', 'Complete 10 tasks in one day', 'efficiency', '⚡', 10, 250),
('ach_unstoppable', 'unstoppable', 'Unstoppable', 'Complete 15 tasks in one day', 'efficiency', '🔥', 15, 500),

-- Streaks (3 achievements)
('ach_dedicated', 'dedicated', 'Dedicated', 'Work 3 consecutive days', 'streaks', '🌟', 3, 50),
('ach_committed', 'committed', 'Committed', 'Work 7 consecutive days', 'streaks', '⭐', 7, 150),
('ach_champion', 'champion', 'Champion', 'Work 30 consecutive days', 'streaks', '💫', 30, 1000)

ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Verification Queries (Optional - comment out if not needed)
-- =====================================================

-- Check tables created
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check achievements seeded
-- SELECT COUNT(*) as total_achievements FROM achievements;

-- Check user columns
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE '%points%';

-- =====================================================
-- End of Migration Script
-- =====================================================
