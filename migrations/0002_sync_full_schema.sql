-- Migration to sync the full database schema
-- This migration adds all missing tables and columns that weren't captured in the initial migration

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id text UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS headquarters text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_image text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mood text DEFAULT 'neutral';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active text NOT NULL DEFAULT 'true';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp NOT NULL DEFAULT now();

-- Add missing columns to work_orders table
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS notes text;

-- Add missing columns to time_punches table
ALTER TABLE time_punches ADD COLUMN IF NOT EXISTS punch_type text NOT NULL DEFAULT 'work';
ALTER TABLE time_punches ADD COLUMN IF NOT EXISTS kilometers real;

-- Create machines table
CREATE TABLE IF NOT EXISTS machines (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model text NOT NULL,
  serial_number text NOT NULL UNIQUE,
  category text NOT NULL,
  status text NOT NULL DEFAULT 'in-stock',
  location text,
  last_service_date date,
  next_service_date date,
  notes text,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Create parts table
CREATE TABLE IF NOT EXISTS parts (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  part_number text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit_cost real,
  supplier text,
  location text,
  reorder_level integer DEFAULT 5,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar NOT NULL REFERENCES users(id),
  type text NOT NULL,
  message text NOT NULL,
  work_order_id varchar REFERENCES work_orders(id),
  is_read text NOT NULL DEFAULT 'false',
  created_at timestamp NOT NULL DEFAULT now()
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_date date NOT NULL,
  appointment_time text NOT NULL,
  customer text NOT NULL,
  customer_phone text,
  customer_email text,
  assigned_to varchar REFERENCES users(id),
  service_type text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'scheduled',
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  created_by varchar NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1 varchar NOT NULL REFERENCES users(id),
  participant2 varchar NOT NULL REFERENCES users(id),
  created_at timestamp NOT NULL DEFAULT now(),
  last_message_at timestamp DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id varchar NOT NULL REFERENCES users(id),
  channel_type text NOT NULL,
  headquarters text,
  department text,
  conversation_id varchar REFERENCES conversations(id),
  content text NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Add constraints for enum-like columns (for data integrity)
-- Users table constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'technician', 'technical_advisor'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_check;
ALTER TABLE users ADD CONSTRAINT users_department_check CHECK (department IS NULL OR department IN ('Road Technician', 'Garage Technician', 'Sales', 'Tech Advisor', 'Accounting', 'HR'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_headquarters_check;
ALTER TABLE users ADD CONSTRAINT users_headquarters_check CHECK (headquarters IS NULL OR headquarters IN ('Montreal, QC', 'Quebec, QC', 'Saguenay, QC'));

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_mood_check;
ALTER TABLE users ADD CONSTRAINT users_mood_check CHECK (mood IS NULL OR mood IN ('happy', 'focused', 'tired', 'stressed', 'neutral'));

-- Work orders table constraints
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_priority_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_priority_check CHECK (priority IN ('Normal', 'High', 'Urgent'));

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_department_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_department_check CHECK (department IN ('Road Technician', 'Garage Technician', 'Sales', 'Tech Advisor', 'Accounting', 'HR'));

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_headquarters_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_headquarters_check CHECK (headquarters IN ('Montreal, QC', 'Quebec, QC', 'Saguenay, QC'));

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_status_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_status_check CHECK (status IN ('new', 'demand', 'assigned', 'in-progress', 'completed', 'closedForReview'));

-- Machines table constraints
ALTER TABLE machines DROP CONSTRAINT IF EXISTS machines_category_check;
ALTER TABLE machines ADD CONSTRAINT machines_category_check CHECK (category IN ('Lift', 'Hoist', 'Platform', 'Stairs', 'Ramp', 'Other'));

ALTER TABLE machines DROP CONSTRAINT IF EXISTS machines_status_check;
ALTER TABLE machines ADD CONSTRAINT machines_status_check CHECK (status IN ('active', 'maintenance', 'retired', 'in-stock'));

-- Parts table constraints
ALTER TABLE parts DROP CONSTRAINT IF EXISTS parts_category_check;
ALTER TABLE parts ADD CONSTRAINT parts_category_check CHECK (category IN ('Motor', 'Gear', 'Bearing', 'Hydraulic', 'Electrical', 'Fastener', 'Other'));

-- Notifications table constraints
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('work_order_assigned', 'work_order_demand', 'work_order_completed'));

-- Appointments table constraints
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_service_type_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_service_type_check CHECK (service_type IN ('Maintenance', 'Repair', 'Inspection', 'Consultation', 'Delivery', 'Pickup'));

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check CHECK (status IN ('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'));

-- Messages table constraints
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_channel_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_channel_type_check CHECK (channel_type IN ('headquarters', 'department', 'direct'));

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_headquarters_check;
ALTER TABLE messages ADD CONSTRAINT messages_headquarters_check CHECK (headquarters IS NULL OR headquarters IN ('Montreal, QC', 'Quebec, QC', 'Saguenay, QC'));

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_department_check;
ALTER TABLE messages ADD CONSTRAINT messages_department_check CHECK (department IS NULL OR department IN ('Road Technician', 'Garage Technician', 'Sales', 'Tech Advisor', 'Accounting', 'HR'));

-- Time punches table constraints
ALTER TABLE time_punches DROP CONSTRAINT IF EXISTS time_punches_punch_type_check;
ALTER TABLE time_punches ADD CONSTRAINT time_punches_punch_type_check CHECK (punch_type IN ('work', 'travel', 'other'));

-- Update existing employee_id values where NULL (for existing users without employee_id)
-- This ensures all users have an employee_id before adding the NOT NULL constraint
DO $$
BEGIN
  -- First update any NULL employee_id values
  UPDATE users SET employee_id = 'EMP-' || SUBSTRING(id, 1, 8) WHERE employee_id IS NULL;
  
  -- Only add NOT NULL if no NULL values remain
  IF NOT EXISTS (SELECT 1 FROM users WHERE employee_id IS NULL) THEN
    ALTER TABLE users ALTER COLUMN employee_id SET NOT NULL;
  ELSE
    RAISE NOTICE 'Warning: Some users still have NULL employee_id, NOT NULL constraint not applied';
  END IF;
END $$;
