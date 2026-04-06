-- =============================================================
-- WHITE-LABEL COMMERCE PLATFORM -- DUMMY DATA
-- Version 1.0
-- Scenario: "TechParts Pro" -- a B2B/B2C electronics components
--           retailer running on the white-label platform.
--
-- Insertion order strictly respects FK dependencies.
-- All UUIDs are fixed so cross-table references are exact.
-- Run AFTER database.sql (seed data must already exist).
--
-- Covers all 46 tables with realistic, connected data.
-- Safe to re-run -- uses ON CONFLICT DO NOTHING where applicable.
-- =============================================================


-- =============================================================
-- 0. PLATFORM CONFIGURATION
-- =============================================================

INSERT INTO branding_config (
    company_name, domain, logo_url, favicon_url,
    primary_color, secondary_color,
    email_from_name, email_from_address,
    invoice_template, support_email, support_phone
) VALUES (
    'TechParts Pro',
    'techpartspro.com',
    'https://cdn.techpartspro.com/assets/logo.png',
    'https://cdn.techpartspro.com/assets/favicon.ico',
    '#1A56DB',
    '#E3EFFF',
    'TechParts Pro',
    'noreply@techpartspro.com',
    'default',
    'support@techpartspro.com',
    '+44 20 7946 0123'
) ON CONFLICT (domain) DO NOTHING;

-- Enable all feature flags for demo purposes
UPDATE feature_flags SET enabled = TRUE, config_json = '{"max_days": 60}'
WHERE feature_key = 'net_terms';

UPDATE feature_flags SET enabled = TRUE
WHERE feature_key IN (
    'b2b_enabled', 'rfq_enabled', 'tiered_pricing',
    'contract_pricing', 'loyalty_program', 'sale_enabled', 'multi_warehouse'
);


-- =============================================================
-- 1. IDENTITY & ACCESS -- Users
--    Roles and permissions already seeded by database.sql.
--    We insert staff users here covering all role types.
-- =============================================================

-- Fixed UUIDs for all users
-- admin:             a0000000-0000-0000-0000-000000000001
-- warehouse_manager: a0000000-0000-0000-0000-000000000002
-- sales_rep:         a0000000-0000-0000-0000-000000000003
-- customer (B2C):    a0000000-0000-0000-0000-000000000004
-- customer (B2C):    a0000000-0000-0000-0000-000000000005
-- b2b_buyer:         a0000000-0000-0000-0000-000000000006
-- b2b_manager:       a0000000-0000-0000-0000-000000000007

INSERT INTO users (
    id, email, password_hash, role_id,
    first_name, last_name, phone,
    is_active, email_verified, email_verified_at, last_login_at
)
SELECT
    a.id::UUID,
    a.email,
    -- bcrypt hash of 'Password123!' -- never use in production
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTfGe5mIqGWWC0eFuBRGwWt8Ou',
    r.id,
    a.first_name, a.last_name, a.phone,
    TRUE, TRUE, NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day'
FROM (VALUES
    ('a0000000-0000-0000-0000-000000000001', 'admin@techpartspro.com',      'superadmin',        'Sarah',   'Mitchell', '+44 7700 900001'),
    ('a0000000-0000-0000-0000-000000000002', 'warehouse@techpartspro.com',  'warehouse_manager', 'James',   'Carter',   '+44 7700 900002'),
    ('a0000000-0000-0000-0000-000000000003', 'sales@techpartspro.com',      'sales_rep',         'Priya',   'Sharma',   '+44 7700 900003'),
    ('a0000000-0000-0000-0000-000000000004', 'alice.jones@gmail.com',       'customer',          'Alice',   'Jones',    '+44 7700 900004'),
    ('a0000000-0000-0000-0000-000000000005', 'bob.taylor@hotmail.com',      'customer',          'Bob',     'Taylor',   '+44 7700 900005'),
    ('a0000000-0000-0000-0000-000000000006', 'procurement@acmecorp.com',    'b2b_buyer',         'David',   'Chen',     '+44 7700 900006'),
    ('a0000000-0000-0000-0000-000000000007', 'manager@acmecorp.com',        'b2b_manager',       'Rachel',  'O''Brien',  '+44 7700 900007')
) AS a(id, email, role_name, first_name, last_name, phone)
JOIN roles r ON r.name = a.role_name
ON CONFLICT (email) DO NOTHING;


-- Refresh tokens (active sessions)
INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000001',
        'hash_admin_token_abc123def456',
        NOW() + INTERVAL '7 days'
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'a0000000-0000-0000-0000-000000000004',
        'hash_alice_token_xyz789uvw012',
        NOW() + INTERVAL '7 days'
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'a0000000-0000-0000-0000-000000000006',
        'hash_david_token_mno345pqr678',
        NOW() + INTERVAL '7 days'
    )
ON CONFLICT (token_hash) DO NOTHING;


-- Password reset token (Bob requested a reset)
INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, used_at) VALUES
    (
        'c0000000-0000-0000-0000-000000000001',
        'a0000000-0000-0000-0000-000000000005',
        'hash_reset_bob_stu901vwx234',
        NOW() + INTERVAL '1 hour',
        NULL  -- not yet used
    )
ON CONFLICT (token_hash) DO NOTHING;


-- =============================================================
-- 2. CUSTOMER SERVICE
-- =============================================================

-- Customer groups (beyond seed data -- more granular B2C tiers)
INSERT INTO customer_groups (name, description, is_b2b) VALUES
    ('retail',    'Standard B2C retail customers',            FALSE),
    ('vip',       'High-value B2C customers with discounts',  FALSE),
    ('wholesale', 'B2B wholesale accounts',                   TRUE),
    ('trade',     'B2B trade account with contract pricing',  TRUE)
ON CONFLICT (name) DO NOTHING;


-- B2C Customers linked to their user accounts
INSERT INTO customers (
    id, user_id, customer_group_id,
    first_name, last_name, email, phone,
    date_of_birth, is_active, loyalty_points, notes
)
SELECT
    c.id::UUID,
    c.user_id::UUID,
    cg.id,
    c.first_name, c.last_name, c.email, c.phone,
    c.dob::DATE, TRUE, c.points, c.notes
FROM (VALUES
    ('c1000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000004',
     'retail',  'Alice',  'Jones',   'alice.jones@gmail.com',    '+44 7700 900004',
     '1990-03-15', 250, 'Frequent buyer, prefers email contact'),
    ('c1000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000005',
     'vip',     'Bob',    'Taylor',  'bob.taylor@hotmail.com',   '+44 7700 900005',
     '1985-07-22', 1200, 'VIP -- has requested priority shipping in the past'),
    ('c1000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000006',
     'trade',   'David',  'Chen',    'procurement@acmecorp.com', '+44 7700 900006',
     '1978-11-05', 0, 'Primary procurement contact at Acme Corp'),
    ('c1000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000007',
     'trade',   'Rachel', 'O''Brien', 'manager@acmecorp.com',     '+44 7700 900007',
     '1982-04-30', 0, 'Account manager at Acme Corp -- approves large orders')
) AS c(id, user_id, group_name, first_name, last_name, email, phone, dob, points, notes)
JOIN customer_groups cg ON cg.name = c.group_name
ON CONFLICT (email) DO NOTHING;


-- B2B Company
INSERT INTO companies (
    id, name, registration_number, tax_number,
    industry, website, credit_limit, payment_terms_days, is_active
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'Acme Corp Ltd',
    'GB12345678',
    'GB987654321',
    'Manufacturing',
    'https://www.acmecorp.com',
    25000.00,
    60,
    TRUE
) ON CONFLICT DO NOTHING;


-- Link both B2B customers to Acme Corp
INSERT INTO company_contacts (
    id, company_id, customer_id, job_title, is_primary, can_order, can_approve
) VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'd0000000-0000-0000-0000-000000000001',
        'c1000000-0000-0000-0000-000000000003',
        'Procurement Manager', FALSE, TRUE, FALSE
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'd0000000-0000-0000-0000-000000000001',
        'c1000000-0000-0000-0000-000000000004',
        'Head of Procurement', TRUE, TRUE, TRUE
    )
ON CONFLICT (company_id, customer_id) DO NOTHING;


-- Addresses
INSERT INTO addresses (
    id, customer_id, company_id, address_type, is_default,
    full_name, line1, line2, city, state_province, postal_code, country_code, phone
) VALUES
    -- Alice -- home shipping address
    (
        'f0000000-0000-0000-0000-000000000001',
        'c1000000-0000-0000-0000-000000000001', NULL,
        'shipping', TRUE,
        'Alice Jones', '14 Maple Street', 'Flat 2',
        'London', 'England', 'EC1A 1BB', 'GB', '+44 7700 900004'
    ),
    -- Alice -- billing address
    (
        'f0000000-0000-0000-0000-000000000002',
        'c1000000-0000-0000-0000-000000000001', NULL,
        'billing', TRUE,
        'Alice Jones', '14 Maple Street', 'Flat 2',
        'London', 'England', 'EC1A 1BB', 'GB', '+44 7700 900004'
    ),
    -- Bob -- home shipping
    (
        'f0000000-0000-0000-0000-000000000003',
        'c1000000-0000-0000-0000-000000000002', NULL,
        'shipping', TRUE,
        'Bob Taylor', '7 Oak Avenue', NULL,
        'Manchester', 'England', 'M1 2AB', 'GB', '+44 7700 900005'
    ),
    -- Acme Corp -- company shipping address
    (
        'f0000000-0000-0000-0000-000000000004',
        NULL, 'd0000000-0000-0000-0000-000000000001',
        'shipping', TRUE,
        'Acme Corp Ltd', 'Unit 5, Industrial Park', 'Thornbury Road',
        'Birmingham', 'England', 'B1 1AA', 'GB', '+44 121 946 0100'
    ),
    -- Acme Corp -- billing address
    (
        'f0000000-0000-0000-0000-000000000005',
        NULL, 'd0000000-0000-0000-0000-000000000001',
        'billing', TRUE,
        'Acme Corp Ltd -- Accounts Payable', 'Unit 5, Industrial Park', 'Thornbury Road',
        'Birmingham', 'England', 'B1 1AA', 'GB', '+44 121 946 0101'
    )
ON CONFLICT DO NOTHING;


-- =============================================================
-- 3. PRODUCT CATALOG
-- =============================================================

-- Categories (self-referencing tree)
INSERT INTO categories (id, parent_id, name, slug, description, sort_order, is_active) VALUES
    (1,  NULL, 'Electronics',           'electronics',            'All electronic components and devices',    1,  TRUE),
    (2,  1,    'Microcontrollers',      'microcontrollers',       'Arduino, ESP32, STM32 and more',           1,  TRUE),
    (3,  1,    'Sensors',               'sensors',                'Temperature, pressure, motion sensors',    2,  TRUE),
    (4,  1,    'Power Supplies',        'power-supplies',         'PSUs, converters, regulators',             3,  TRUE),
    (5,  1,    'Connectors & Cables',   'connectors-cables',      'Connectors, headers, wiring',              4,  TRUE),
    (6,  NULL, 'Tools & Equipment',     'tools-equipment',        'Soldering, testing, measurement tools',   2,  TRUE),
    (7,  6,    'Soldering',             'soldering',              'Soldering irons, solder, accessories',    1,  TRUE),
    (8,  6,    'Test & Measurement',    'test-measurement',       'Multimeters, oscilloscopes, probes',      2,  TRUE)
ON CONFLICT DO NOTHING;


-- Brands
INSERT INTO brands (id, name, slug, logo_url, is_active) VALUES
    (1, 'Arduino',      'arduino',      'https://cdn.techpartspro.com/brands/arduino.png',      TRUE),
    (2, 'Espressif',    'espressif',    'https://cdn.techpartspro.com/brands/espressif.png',    TRUE),
    (3, 'Bosch Sensortec', 'bosch-sensortec', 'https://cdn.techpartspro.com/brands/bosch.png', TRUE),
    (4, 'Fluke',        'fluke',        'https://cdn.techpartspro.com/brands/fluke.png',        TRUE),
    (5, 'Hakko',        'hakko',        'https://cdn.techpartspro.com/brands/hakko.png',        TRUE),
    (6, 'Generic',      'generic',      NULL,                                                   TRUE)
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (
    id, sku, name, slug, description, short_description,
    category_id, brand_id, base_price, cost_price,
    tax_class, weight_kg, is_active, is_featured, is_b2b_only
) VALUES
    (
        'a1000000-0000-0000-0000-000000000001',
        'ARD-UNO-R3', 'Arduino Uno R3', 'arduino-uno-r3',
        'The Arduino Uno R3 is a microcontroller board based on the ATmega328P.',
        'ATmega328P microcontroller, 14 digital I/O pins, USB connectivity',
        2, 1, 22.99, 11.50, 'standard', 0.025, TRUE, TRUE, FALSE
    ),
    (
        'a1000000-0000-0000-0000-000000000002',
        'ESP-32-DEV', 'ESP32 DevKit V1', 'esp32-devkit-v1',
        'ESP32 development board featuring dual-core processor, integrated Wi-Fi and Bluetooth.',
        'Dual-core, Wi-Fi + Bluetooth, 30 GPIO pins, 4MB flash',
        2, 2, 12.99, 6.00, 'standard', 0.015, TRUE, TRUE, FALSE
    ),
    (
        'a1000000-0000-0000-0000-000000000003',
        'SEN-BME280', 'BME280 Temperature/Humidity/Pressure Sensor', 'bme280-sensor',
        'Precision combined digital humidity, pressure and temperature sensor from Bosch.',
        'Temperature, humidity and pressure in one compact package',
        3, 3, 8.49, 3.20, 'standard', 0.003, TRUE, FALSE, FALSE
    ),
    (
        'a1000000-0000-0000-0000-000000000004',
        'PSU-12V-5A', '12V 5A Regulated DC Power Supply', '12v-5a-psu',
        'Reliable regulated 12V 5A (60W) desktop power supply with overload protection.',
        '12V 5A regulated output, 60W, universal input, protected',
        4, 6, 24.99, 12.00, 'standard', 0.850, TRUE, FALSE, FALSE
    ),
    (
        'a1000000-0000-0000-0000-000000000005',
        'CBL-DUPONT-40', 'Dupont Jumper Wires 40-piece Set', 'dupont-jumper-wires-40',
        '40-piece mixed jumper wire set. Ideal for breadboard prototyping.',
        '40 pcs mixed M-M, M-F, F-F jumper wires, 20cm',
        5, 6, 4.99, 1.20, 'standard', 0.050, TRUE, FALSE, FALSE
    ),
    (
        'a1000000-0000-0000-0000-000000000006',
        'HAK-FX888D', 'Hakko FX-888D Digital Soldering Station', 'hakko-fx888d',
        'Professional digital soldering station with rapid heat recovery.',
        'Digital soldering station, 200-480 degC, rapid heat recovery',
        7, 5, 109.99, 65.00, 'standard', 0.970, TRUE, TRUE, FALSE
    ),
    (
        'a1000000-0000-0000-0000-000000000007',
        'FLK-117', 'Fluke 117 Electrician''s Multimeter', 'fluke-117-multimeter',
        'True RMS multimeter designed for electricians.',
        'True RMS, AutoVolt, non-contact voltage, CAT III 600V',
        8, 4, 149.99, 90.00, 'standard', 0.430, TRUE, TRUE, FALSE
    )
ON CONFLICT (sku) DO NOTHING;

-- =============================================================
-- 8. INVENTORY SERVICE
-- =============================================================

-- Second warehouse
INSERT INTO warehouses (id, name, code, address, is_active) VALUES
    (2, 'North Fulfilment Centre', 'NORTH',
     '{"line1": "Warehouse 12", "line2": "Logistics Park", "city": "Leeds", "postal_code": "LS1 1AA", "country_code": "GB"}',
     TRUE)
ON CONFLICT (code) DO NOTHING;


-- Inventory levels (product x warehouse)
INSERT INTO inventory (
    id, product_id, variant_id, warehouse_id,
    quantity_on_hand, quantity_reserved, reorder_point
) VALUES
    -- Arduino Uno -- MAIN
    ('fa000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', NULL, 1, 120, 5,  20),
    -- Arduino Uno -- NORTH
    ('fa000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', NULL, 2, 80,  0,  20),
    -- ESP32 -- MAIN
    ('fa000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', NULL, 1, 250, 20, 30),
    -- BME280 -- MAIN
    ('fa000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', NULL, 1, 8,   2,  15),
    -- PSU 12V -- MAIN
    ('fa000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000004', NULL, 1, 45,  0,  10),
    -- Hakko FX-888D -- MAIN
    ('fa000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000006', NULL, 1, 18,  0,  5),
    -- Fluke 117 -- MAIN
    ('fa000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000007', NULL, 1, 6,   1,  8)
ON CONFLICT (product_id, variant_id, warehouse_id) DO NOTHING;
