-- =============================================================
-- WHITE-LABEL COMMERCE PLATFORM — COMPLETE DATABASE SCHEMA
-- Version 2.5 (Docker & SaaS Security Optimized)
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 0. SECURITY & ROLE SETUP
-- ─────────────────────────────────────────────────────────────

-- Ensure the public schema is owned by the docker-created superuser (appuser)
ALTER SCHEMA public OWNER TO appuser;

-- Create the restricted application user for the SaaS Backend
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'web_app_user') THEN
        CREATE ROLE web_app_user WITH LOGIN PASSWORD 'web_app_password_change_me';
    END IF;
END
$$;

-- Enable extensions (Must be done by superuser)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Safety Guard
DO $$
BEGIN
    IF current_database() = 'postgres' THEN
        RAISE EXCEPTION 'Safety check failed: Connect to the correct client database first.';
    END IF;
    RAISE NOTICE 'Initializing as Owner: % | Database: %', current_user, current_database();
END
$$;

-- ─────────────────────────────────────────────────────────────
-- 1. PLATFORM CONFIGURATION (Branding & Feature Flags)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS branding_config (
    id                  SERIAL          PRIMARY KEY,
    company_name        VARCHAR(200)    NOT NULL,
    domain              VARCHAR(255)    NOT NULL UNIQUE,
    logo_url            TEXT,
    favicon_url         TEXT,
    primary_color       VARCHAR(7),
    secondary_color     VARCHAR(7),
    email_from_name     VARCHAR(200),
    email_from_address  VARCHAR(255),
    invoice_template    VARCHAR(100)    NOT NULL DEFAULT 'default',
    support_email       VARCHAR(255),
    support_phone       VARCHAR(50),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feature_flags (
    id              SERIAL          PRIMARY KEY,
    feature_key     VARCHAR(100)    NOT NULL UNIQUE,
    enabled         BOOLEAN         NOT NULL DEFAULT FALSE,
    config_json     JSONB           NOT NULL DEFAULT '{}',
    description     TEXT,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 2. IDENTITY & ACCESS SERVICE (RBAC & Auth)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id          SERIAL          PRIMARY KEY,
    resource    VARCHAR(100)    NOT NULL,
    action      VARCHAR(50)     NOT NULL,
    description TEXT,
    UNIQUE (resource, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id         INT     NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   INT     NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       TEXT        NOT NULL,
    role_id             INT         NOT NULL REFERENCES roles(id),
    first_name          VARCHAR(100),
    last_name           VARCHAR(100),
    phone               VARCHAR(50),
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    email_verified      BOOLEAN     NOT NULL DEFAULT FALSE,
    email_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  TEXT        NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. CUSTOMER SERVICE (B2C & B2B)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_groups (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL UNIQUE,
    description TEXT,
    is_b2b      BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    customer_group_id   INT         REFERENCES customer_groups(id),
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    phone               VARCHAR(50),
    date_of_birth       DATE,
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    loyalty_points      INT         NOT NULL DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(255)    NOT NULL,
    registration_number VARCHAR(100),
    tax_number          VARCHAR(100),
    industry            VARCHAR(100),
    website             VARCHAR(255),
    credit_limit        NUMERIC(12,2)   NOT NULL DEFAULT 0,
    payment_terms_days  INT             NOT NULL DEFAULT 0,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_contacts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id  UUID        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    job_title   VARCHAR(100),
    is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
    can_order   BOOLEAN     NOT NULL DEFAULT TRUE,
    can_approve BOOLEAN     NOT NULL DEFAULT FALSE,
    UNIQUE (company_id, customer_id)
);

CREATE TABLE IF NOT EXISTS addresses (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id     UUID        REFERENCES customers(id) ON DELETE CASCADE,
    company_id      UUID        REFERENCES companies(id) ON DELETE CASCADE,
    address_type    VARCHAR(20) NOT NULL DEFAULT 'shipping',
    is_default      BOOLEAN     NOT NULL DEFAULT FALSE,
    full_name       VARCHAR(200),
    line1           VARCHAR(255) NOT NULL,
    line2           VARCHAR(255),
    city            VARCHAR(100) NOT NULL,
    state_province  VARCHAR(100),
    postal_code     VARCHAR(20),
    country_code    CHAR(2)     NOT NULL,
    phone           VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (customer_id IS NOT NULL OR company_id IS NOT NULL)
);

-- ─────────────────────────────────────────────────────────────
-- 4. PRODUCT CATALOG SERVICE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL          PRIMARY KEY,
    parent_id   INT             REFERENCES categories(id) ON DELETE SET NULL,
    name        VARCHAR(200)    NOT NULL,
    slug        VARCHAR(200)    NOT NULL UNIQUE,
    description TEXT,
    image_url   TEXT,
    sort_order  INT             NOT NULL DEFAULT 0,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brands (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL UNIQUE,
    slug        VARCHAR(200)    NOT NULL UNIQUE,
    logo_url    TEXT,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    sku                 VARCHAR(100)    NOT NULL UNIQUE,
    name                VARCHAR(300)    NOT NULL,
    slug                VARCHAR(300)    NOT NULL UNIQUE,
    description         TEXT,
    short_description   TEXT,
    category_id         INT             REFERENCES categories(id) ON DELETE SET NULL,
    brand_id            INT             REFERENCES brands(id) ON DELETE SET NULL,
    base_price          NUMERIC(12,2)   NOT NULL,
    cost_price          NUMERIC(12,2),
    tax_class           VARCHAR(50)     NOT NULL DEFAULT 'standard',
    weight_kg           NUMERIC(8,3),
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    is_featured         BOOLEAN         NOT NULL DEFAULT FALSE,
    is_b2b_only         BOOLEAN         NOT NULL DEFAULT FALSE,
    meta_title          VARCHAR(300),
    meta_description    TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_variants (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku             VARCHAR(100) NOT NULL UNIQUE,
    name            VARCHAR(300),
    price_override  NUMERIC(12,2),
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 5. ORDER MANAGEMENT SYSTEM
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS orders (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number            VARCHAR(50)     NOT NULL UNIQUE,
    customer_id             UUID            NOT NULL REFERENCES customers(id),
    company_id              UUID            REFERENCES companies(id),
    status                  VARCHAR(30)     NOT NULL DEFAULT 'pending',
    payment_status          VARCHAR(30)     NOT NULL DEFAULT 'unpaid',
    payment_method          VARCHAR(50),
    currency_code           CHAR(3)         NOT NULL DEFAULT 'GBP',
    subtotal                NUMERIC(12,2)   NOT NULL,
    shipping_cost           NUMERIC(12,2)   NOT NULL DEFAULT 0,
    tax_amount              NUMERIC(12,2)   NOT NULL DEFAULT 0,
    discount_amount         NUMERIC(12,2)   NOT NULL DEFAULT 0,
    total_amount            NUMERIC(12,2)   NOT NULL,
    shipping_address        JSONB           NOT NULL,
    billing_address         JSONB           NOT NULL,
    placed_at               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID            NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID            NOT NULL REFERENCES products(id),
    variant_id      UUID            REFERENCES product_variants(id),
    sku             VARCHAR(100)    NOT NULL,
    product_name    VARCHAR(300)    NOT NULL,
    quantity        INT             NOT NULL CHECK (quantity > 0),
    unit_price      NUMERIC(12,2)   NOT NULL,
    line_total      NUMERIC(12,2)   NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 6. AUDIT & LOGGING (Admin Additions)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id          SERIAL          PRIMARY KEY,
    table_name  VARCHAR(100)    NOT NULL,
    record_id   UUID            NOT NULL,
    action      VARCHAR(20)     NOT NULL, -- INSERT, UPDATE, DELETE
    old_data    JSONB,
    new_data    JSONB,
    changed_by  UUID            REFERENCES users(id),
    changed_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 15. SEED DATA (Base Roles & Permissions)
-- ─────────────────────────────────────────────────────────────

INSERT INTO roles (name, description)
VALUES 
    ('superadmin', 'System wide access'),
    ('admin', 'Client administrator'),
    ('customer', 'Standard retail buyer')
ON CONFLICT (name) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- FINAL PERMISSIONS: LOCKING DOWN THE WEB APP
-- ─────────────────────────────────────────────────────────────

-- 1. Connectivity
-- GRANT CONNECT ON DATABASE commerceforcedatabase TO web_app_user;
-- GRANT USAGE ON SCHEMA public TO web_app_user;

-- 2. CRUD Access (No Alter/Drop)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO web_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO web_app_user;

-- 3. Future-proofing: Auto-grant on future tables
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO web_app_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO web_app_user;

-- RAISE NOTICE 'Full Schema Initialized. App user permissions locked down.';
