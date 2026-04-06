-- ─────────────────────────────────────────────────────────────
-- 10. INVENTORY & WAREHOUSE SERVICE
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS warehouses (
    id          SERIAL          PRIMARY KEY,
    name        VARCHAR(200)    NOT NULL,
    code        VARCHAR(50)     NOT NULL UNIQUE,
    address     JSONB,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS inventory (
    id                  UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id          UUID    NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id          UUID    REFERENCES product_variants(id) ON DELETE CASCADE,
    warehouse_id        INT     NOT NULL REFERENCES warehouses(id),
    quantity_on_hand    INT     NOT NULL DEFAULT 0,
    quantity_reserved   INT     NOT NULL DEFAULT 0,
    -- quantity_available is calculated: (on_hand - reserved)
    reorder_point       INT     NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_id, variant_id, warehouse_id)
);

-- ─────────────────────────────────────────────────────────────
-- 11 & 12. ADVANCED LOGGING (Audit & Admin Activity)
-- ─────────────────────────────────────────────────────────────

-- Tracks data changes for compliance
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGSERIAL       PRIMARY KEY,
    table_name  VARCHAR(100)    NOT NULL,
    record_id   UUID            NOT NULL,
    action      VARCHAR(20)     NOT NULL, -- INSERT, UPDATE, DELETE
    old_data    JSONB,
    new_data    JSONB,
    changed_by  UUID            REFERENCES users(id),
    changed_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Tracks specific Admin Panel actions (e.g., "Exported CSV", "Changed Config")
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     UUID            NOT NULL REFERENCES users(id),
    action      TEXT            NOT NULL,
    ip_address  INET,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 13. MEDIA ASSET MANAGEMENT
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS media_assets (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    filename        VARCHAR(255)    NOT NULL,
    storage_key     TEXT            NOT NULL, -- S3/GCS path
    mime_type       VARCHAR(100),
    file_size_bytes BIGINT,
    metadata        JSONB           NOT NULL DEFAULT '{}',
    uploaded_by     UUID            REFERENCES users(id),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 14. SCHEDULED JOBS
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id              SERIAL          PRIMARY KEY,
    job_name        VARCHAR(150)    NOT NULL UNIQUE,
    cron_expression VARCHAR(50)     NOT NULL,
    last_run        TIMESTAMPTZ,
    next_run        TIMESTAMPTZ,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    payload         JSONB           NOT NULL DEFAULT '{}'
);
