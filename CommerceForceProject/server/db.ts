import pg from 'pg';
const { Pool } = pg;

// Parse DECIMAL (1700) as float
pg.types.setTypeParser(1700, (val) => parseFloat(val));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/commerce'
});

export async function initDb() {
  const rawConnectionString = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/commerce';
  const connectionString = rawConnectionString.trim();
  
  if (!connectionString) {
    throw new Error('DATABASE_URL is empty or only contains whitespace');
  }

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch (err) {
    console.error(`Invalid DATABASE_URL: "${connectionString}"`);
    throw new Error(`Invalid database connection string format: ${connectionString}`);
  }

  console.log(`Attempting to connect to database: ${url.hostname}:${url.port || 5432}${url.pathname} as user: ${url.username}`);

  let client;
  let retries = 20;
  while (retries > 0) {
    try {
      client = await pool.connect();
      console.log(`Successfully connected to ${url.hostname}`);
      break;
    } catch (err: any) {
      console.log(`Waiting for database... (${retries} retries left). Error: ${err.message}`);
      retries -= 1;
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  if (!client) {
    throw new Error(`Could not connect to database at ${url.hostname} after multiple retries`);
  }

  try {
    console.log("Initializing database schema...");
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS branding_config (
        id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL,
        domain TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        favicon_url TEXT,
        primary_color TEXT,
        secondary_color TEXT,
        font_family TEXT,
        button_style TEXT DEFAULT 'rounded',
        background_style TEXT DEFAULT 'solid',
        background_value TEXT,
        hero_title TEXT,
        hero_subtitle TEXT,
        hero_image_url TEXT,
        hero_cta_text TEXT,
        hero_cta_link TEXT,
        featured_products TEXT DEFAULT '[]',
        layout_config TEXT DEFAULT '[]',
        footer_config TEXT DEFAULT '[]',
        footer_email TEXT,
        footer_address TEXT,
        footer_phone TEXT,
        footer_copyright TEXT,
        footer_use_brand_color INTEGER DEFAULT 0,
        social_links_enabled INTEGER DEFAULT 1,
        contact_page_enabled INTEGER DEFAULT 1,
        base_font_size INTEGER DEFAULT 16,
        hero_font_size INTEGER DEFAULT 48,
        heading_font_size INTEGER DEFAULT 32,
        content_font_size INTEGER DEFAULT 16,
        carousel_enabled INTEGER DEFAULT 0,
        carousel_images TEXT DEFAULT '[]',
        hero_enabled INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add missing columns if they don't exist
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='favicon_url') THEN
          ALTER TABLE branding_config ADD COLUMN favicon_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='button_style') THEN
          ALTER TABLE branding_config ADD COLUMN button_style TEXT DEFAULT 'rounded';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='background_style') THEN
          ALTER TABLE branding_config ADD COLUMN background_style TEXT DEFAULT 'solid';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='background_value') THEN
          ALTER TABLE branding_config ADD COLUMN background_value TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='hero_cta_text') THEN
          ALTER TABLE branding_config ADD COLUMN hero_cta_text TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='hero_cta_link') THEN
          ALTER TABLE branding_config ADD COLUMN hero_cta_link TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='footer_config') THEN
          ALTER TABLE branding_config ADD COLUMN footer_config TEXT DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='footer_email') THEN
          ALTER TABLE branding_config ADD COLUMN footer_email TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='footer_address') THEN
          ALTER TABLE branding_config ADD COLUMN footer_address TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='footer_copyright') THEN
          ALTER TABLE branding_config ADD COLUMN footer_copyright TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='footer_use_brand_color') THEN
          ALTER TABLE branding_config ADD COLUMN footer_use_brand_color INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='contact_page_enabled') THEN
          ALTER TABLE branding_config ADD COLUMN contact_page_enabled INTEGER DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='footer_phone') THEN
          ALTER TABLE branding_config ADD COLUMN footer_phone TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='social_links_enabled') THEN
          ALTER TABLE branding_config ADD COLUMN social_links_enabled INTEGER DEFAULT 1;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='payment_methods_config') THEN
          ALTER TABLE branding_config ADD COLUMN payment_methods_config TEXT DEFAULT '[]';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='branding_config' AND column_name='hero_enabled') THEN
          ALTER TABLE branding_config ADD COLUMN hero_enabled INTEGER DEFAULT 1;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS feature_flags (
        id SERIAL PRIMARY KEY,
        feature_key TEXT NOT NULL UNIQUE,
        enabled INTEGER DEFAULT 0,
        config_json TEXT DEFAULT '{}',
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        password_hash TEXT NOT NULL,
        role_id INTEGER REFERENCES roles(id),
        credit_limit DECIMAL DEFAULT 0,
        available_credit DECIMAL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        base_price DECIMAL NOT NULL,
        sale_percentage DECIMAL DEFAULT 0,
        image_url TEXT,
        images TEXT DEFAULT '[]',
        is_active INTEGER DEFAULT 1,
        allow_direct_buy INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        total_amount DECIMAL NOT NULL,
        shipping_address TEXT,
        payment_method TEXT DEFAULT 'prepaid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL REFERENCES orders(id),
        product_id TEXT NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL NOT NULL,
        total_price DECIMAL NOT NULL
      );

      CREATE TABLE IF NOT EXISTS warehouses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        location TEXT,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id TEXT PRIMARY KEY,
        warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
        product_id TEXT NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL DEFAULT 0,
        min_stock_level INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(warehouse_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS inventory_alerts (
        id TEXT PRIMARY KEY,
        warehouse_id TEXT NOT NULL REFERENCES warehouses(id),
        product_id TEXT NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        min_stock_level INTEGER NOT NULL,
        status TEXT DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS loyalty_points (
        user_id TEXT PRIMARY KEY REFERENCES users(id),
        points INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS loyalty_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        order_id TEXT REFERENCES orders(id),
        points INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rfqs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        total_quoted_amount DECIMAL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rfq_items (
        id TEXT PRIMARY KEY,
        rfq_id TEXT NOT NULL REFERENCES rfqs(id),
        product_id TEXT NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        target_price DECIMAL,
        quoted_price DECIMAL
      );

      CREATE TABLE IF NOT EXISTS email_logs (
        id TEXT PRIMARY KEY,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sent',
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS coupons (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        type TEXT NOT NULL,
        value DECIMAL NOT NULL,
        min_order_amount DECIMAL DEFAULT 0,
        min_quantity INTEGER DEFAULT 0,
        max_discount_amount DECIMAL,
        expiry_date TIMESTAMP,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        is_loyalty_only INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Seed basic data
      INSERT INTO roles (name, description) VALUES 
        ('superadmin', 'System wide access'),
        ('admin', 'Client administrator'),
        ('client', 'Client administrator (Alias)'),
        ('customer', 'Standard retail buyer')
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO branding_config (company_name, domain, primary_color) VALUES
        ('TechParts Pro', 'techpartspro.com', '#1A56DB')
      ON CONFLICT (domain) DO NOTHING;

      INSERT INTO feature_flags (feature_key, enabled, description) VALUES
        ('b2b_enabled', 1, 'Enable B2B specific features'),
        ('rfq_enabled', 1, 'Enable Request for Quote system'),
        ('loyalty_program', 1, 'Customer loyalty points system')
      ON CONFLICT (feature_key) DO NOTHING;

      INSERT INTO products (id, sku, name, base_price) VALUES
        ('a1000000-0000-0000-0000-000000000001', 'ARD-UNO-R3', 'Arduino Uno R3', 22.99),
        ('a1000000-0000-0000-0000-000000000002', 'ESP-32-DEV', 'ESP32 DevKit V1', 12.99),
        ('a1000000-0000-0000-0000-000000000007', 'FLK-117', 'Fluke 117 Multimeter', 149.99)
      ON CONFLICT (sku) DO NOTHING;

      -- Seed default superadmin (Password: admin123)
      INSERT INTO users (id, email, name, password_hash, role_id)
      SELECT 
        'u1000000-0000-0000-0000-000000000001',
        'admin@commerceforce.com',
        'System Admin',
        '$2b$10$9Bb97OTXagTL2voama4/WOdMBcTinBhztY1wuq0x07fWQgETTj8Pm', -- Real hash for admin123
        id
      FROM roles WHERE name = 'superadmin'
      ON CONFLICT (email) DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        role_id = EXCLUDED.role_id,
        name = EXCLUDED.name;
    `);
    await client.query('COMMIT');
    console.log("Database schema initialized successfully.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Failed to initialize database schema:", err);
    throw err;
  } finally {
    client.release();
  }
}

export const db = {
  query: (text: string, params?: any[]) => {
    let i = 0;
    const pgText = text.replace(/\?/g, () => `$${++i}`);
    return pool.query(pgText, params);
  },
  getClient: () => pool.connect(),
  queryWithClient: (client: any, text: string, params?: any[]) => {
    let i = 0;
    const pgText = text.replace(/\?/g, () => `$${++i}`);
    return client.query(pgText, params);
  }
};

export default db;
