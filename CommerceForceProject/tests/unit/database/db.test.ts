import { describe, it, expect, beforeAll } from 'vitest';
import db, { initDb } from '../../../server/db';

describe('Database Layer Unit Tests', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('should have branding_config table with seed data', async () => {
    const result = await db.query("SELECT * FROM branding_config LIMIT 1");
    const branding = result.rows[0];
    expect(branding).toBeDefined();
    expect(branding.company_name).toBe('TechParts Pro');
  });

  it('should have feature_flags table with seed data', async () => {
    const result = await db.query("SELECT * FROM feature_flags");
    const flags = result.rows;
    expect(flags.length).toBeGreaterThan(0);
  });

  it('should allow inserting and retrieving a new warehouse', async () => {
    const id = 'test-uuid-123';
    await db.query("INSERT INTO warehouses (id, name, code) VALUES ($1, $2, $3)", [id, 'Test Warehouse', 'TEST-01']);
    
    const result = await db.query("SELECT * FROM warehouses WHERE id = $1", [id]);
    const warehouse = result.rows[0];
    expect(warehouse.name).toBe('Test Warehouse');
    expect(warehouse.code).toBe('TEST-01');
  });
});
