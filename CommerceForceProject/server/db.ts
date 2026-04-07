import pg from 'pg';
const { Pool } = pg;

// Parse DECIMAL (1700) as float
pg.types.setTypeParser(1700, (val) => parseFloat(val));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/commerce'
});

export async function initDb() {
  let client;
  let retries = 20; // Increased retries for slower Docker startups
  while (retries > 0) {
    try {
      client = await pool.connect();
      console.log("Successfully connected to the database.");
      break;
    } catch (err: any) {
      console.log(`Waiting for database... (${retries} retries left). Error: ${err.message}`);
      retries -= 1;
      await new Promise(res => setTimeout(res, 3000));
    }
  }

  if (!client) {
    throw new Error("Could not connect to database after multiple retries");
  }

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS branding_config (
        id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL,
        domain TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        primary_color TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

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
