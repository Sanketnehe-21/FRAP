-- Migration Script: v2 Onboarding Architecture

-- 1. Alter Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
UPDATE users SET full_name = display_name WHERE full_name IS NULL;
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
UPDATE users SET username = LOWER(SPLIT_PART(email, '@', 1)) || '_' || SUBSTRING(id::text, 1, 4) WHERE username IS NULL;
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE users DROP COLUMN IF EXISTS display_name;
ALTER TABLE users DROP COLUMN IF EXISTS updated_at;

-- 2. Alter Families Table
ALTER TABLE families RENAME COLUMN name TO family_name;
ALTER TABLE families ADD COLUMN IF NOT EXISTS current_admin_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Backfill current_admin_user_id from family_members where role is ADMIN
UPDATE families f 
SET current_admin_user_id = (
    SELECT user_id 
    FROM family_members 
    WHERE family_id = f.id AND role = 'ADMIN' 
    LIMIT 1
);

ALTER TABLE families DROP COLUMN IF EXISTS invite_code;
ALTER TABLE families DROP COLUMN IF EXISTS updated_at;

-- 3. Create family_member_invites Table
CREATE TABLE IF NOT EXISTS family_member_invites (
    id                  UUID PRIMARY KEY,
    family_id           UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    full_name           VARCHAR(255) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    nickname            VARCHAR(255) NOT NULL,
    username            VARCHAR(255) NOT NULL UNIQUE,
    invite_code         VARCHAR(6) NOT NULL UNIQUE,
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_by_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NOT NULL
);
