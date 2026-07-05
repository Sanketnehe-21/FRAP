-- Migration Script: v3 Admin System Roles & Audit Logs

-- 1. Alter Users Table to add System Role and Last Login
ALTER TABLE users ADD COLUMN IF NOT EXISTS system_role VARCHAR(50) NOT NULL DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 2. Create admin_audit_logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id              UUID PRIMARY KEY,
    admin_user_id   UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(255) NOT NULL,
    target_type     VARCHAR(100), -- e.g., 'USER', 'FAMILY', 'DOCUMENT', 'MERCHANT', 'SETTING'
    target_id       UUID,
    details         TEXT,
    ip_address      VARCHAR(45),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
