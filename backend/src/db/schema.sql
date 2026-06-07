-- FRAP Complete 15-Table Schema

DROP TABLE IF EXISTS ai_feedback CASCADE;
DROP TABLE IF EXISTS user_feedback CASCADE;
DROP TABLE IF EXISTS merchant_registry CASCADE;
DROP TABLE IF EXISTS sms_transactions CASCADE;
DROP TABLE IF EXISTS sms_messages CASCADE;
DROP TABLE IF EXISTS activity_feed CASCADE;
DROP TABLE IF EXISTS goal_contributions CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS family_members CASCADE;
DROP TABLE IF EXISTS families CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. users table
CREATE TABLE users (
    id              UUID PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(255) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. families table
CREATE TABLE families (
    id          UUID PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    invite_code VARCHAR(10) UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. family_members table
CREATE TABLE family_members (
    id          UUID PRIMARY KEY,
    family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nickname    VARCHAR(255) NOT NULL,
    role        VARCHAR(50) NOT NULL, -- 'ADMIN', 'MEMBER'
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (family_id, user_id)
);

-- 4. categories table
CREATE TABLE categories (
    id          UUID PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,
    type        VARCHAR(50) NOT NULL, -- 'INCOME', 'EXPENSE'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. accounts table
CREATE TABLE accounts (
    id                  UUID PRIMARY KEY,
    family_id           UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    bank_name           VARCHAR(255) NOT NULL,
    last_four_digits    CHAR(4) NOT NULL,
    detection_source    VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (family_id, bank_name, last_four_digits)
);

-- 6. transactions table
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY,
    family_id           UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id           UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    account_id          UUID REFERENCES accounts(id) ON DELETE SET NULL,
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    type                VARCHAR(50) NOT NULL, -- 'INCOME', 'EXPENSE'
    amount              NUMERIC(19, 2) NOT NULL,
    currency            CHAR(3) NOT NULL DEFAULT 'INR',
    merchant            VARCHAR(255),
    description         VARCHAR(500),
    transaction_date    DATE NOT NULL,
    source              VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    user_confirmed      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_family_date ON transactions (family_id, transaction_date DESC);
CREATE INDEX idx_transactions_member ON transactions (member_id);

-- 7. documents table
CREATE TABLE documents (
    id              UUID PRIMARY KEY,
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    uploaded_by     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name       VARCHAR(500) NOT NULL,
    storage_path    VARCHAR(1000) NOT NULL,
    document_type   VARCHAR(50) NOT NULL, -- 'PDF', 'CSV', 'EXCEL'
    file_size_bytes BIGINT NOT NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. goals table
CREATE TABLE goals (
    id                  UUID PRIMARY KEY,
    family_id           UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name                VARCHAR(255) NOT NULL,
    target_amount       NUMERIC(19, 2) NOT NULL,
    progress_amount     NUMERIC(19, 2) NOT NULL DEFAULT 0,
    currency            CHAR(3) NOT NULL DEFAULT 'INR',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. goal_contributions table
CREATE TABLE goal_contributions (
    id              UUID PRIMARY KEY,
    goal_id         UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    member_id       UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
    amount          NUMERIC(19, 2) NOT NULL,
    note            VARCHAR(500),
    contributed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. activity_feed table
CREATE TABLE activity_feed (
    id              UUID PRIMARY KEY,
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    member_id       UUID REFERENCES family_members(id) ON DELETE SET NULL,
    activity_type   VARCHAR(50) NOT NULL, -- e.g., 'MEMBER_JOINED', 'TRANSACTION_CREATED'
    message         VARCHAR(500) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_family_created ON activity_feed (family_id, created_at DESC);

-- 11. sms_messages table
CREATE TABLE sms_messages (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender          VARCHAR(100) NOT NULL,
    body            VARCHAR(1000) NOT NULL,
    received_at     TIMESTAMPTZ NOT NULL,
    processed       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. sms_transactions table
CREATE TABLE sms_transactions (
    id                  UUID PRIMARY KEY,
    sms_message_id      UUID NOT NULL REFERENCES sms_messages(id) ON DELETE CASCADE,
    transaction_id      UUID REFERENCES transactions(id) ON DELETE SET NULL,
    extracted_amount    NUMERIC(19, 2),
    extracted_merchant  VARCHAR(255),
    extracted_type      VARCHAR(50),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. merchant_registry table
CREATE TABLE merchant_registry (
    id                  UUID PRIMARY KEY,
    merchant_name       VARCHAR(255) NOT NULL UNIQUE,
    clean_name          VARCHAR(255) NOT NULL,
    default_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    frequency_count     INT NOT NULL DEFAULT 1,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. user_feedback table (handles both suggestions and corrections)
CREATE TABLE user_feedback (
    id                      UUID PRIMARY KEY,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id               UUID REFERENCES families(id) ON DELETE SET NULL,
    feedback_type           VARCHAR(50) NOT NULL, -- 'SUGGESTION', 'CORRECTION', 'GENERAL'
    suggestion              VARCHAR(2000),
    transaction_id          UUID REFERENCES transactions(id) ON DELETE SET NULL,
    original_merchant       VARCHAR(255),
    corrected_merchant      VARCHAR(255),
    original_category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
    corrected_category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. ai_feedback table
CREATE TABLE ai_feedback (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
    rating          VARCHAR(50) NOT NULL, -- 'HELPFUL', 'NOT_HELPFUL', 'INCORRECT'
    context         VARCHAR(1000),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
