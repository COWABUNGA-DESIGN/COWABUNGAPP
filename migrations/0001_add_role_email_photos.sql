-- Add email column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;

-- Add demanded_by column to work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS demanded_by varchar REFERENCES users(id);

-- Add photos column to work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS photos text[];

-- Update existing user roles from 'user' to 'technician'
UPDATE users SET role = 'technician' WHERE role = 'user';

-- Drop and recreate role constraint to support new values
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['admin'::text, 'technician'::text, 'technical_advisor'::text]));

-- Update default role to 'technician'
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'technician';

-- Drop and recreate status constraint to support new values
ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_status_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_status_check CHECK (status = ANY (ARRAY['new'::text, 'assigned'::text, 'in-progress'::text, 'completed'::text, 'closedForReview'::text]));
