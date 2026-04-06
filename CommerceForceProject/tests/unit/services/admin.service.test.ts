import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { AdminService } from '../../../server/services/admin.service';

describe('AdminService Unit Tests', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('should fetch dashboard stats', async () => {
    const stats = await AdminService.getDashboardStats();
    expect(stats).toHaveProperty('totalProducts');
    expect(stats).toHaveProperty('activeUsers');
    expect(stats.totalProducts).toBeGreaterThan(0);
  });

  it('should fetch branding configuration', async () => {
    const branding = await AdminService.getBranding();
    expect(branding.company_name).toBe('TechParts Pro');
  });

  it('should update branding configuration', async () => {
    const newName = 'Updated TechParts';
    await AdminService.updateBranding({ company_name: newName });
    
    const branding = await AdminService.getBranding();
    expect(branding.company_name).toBe(newName);
  });

  it('should toggle feature flags', async () => {
    const flagKey = 'loyalty_program';
    await AdminService.toggleFeatureFlag(flagKey, true);
    
    const flags = await AdminService.getFeatureFlags();
    const flag = flags.find(f => f.feature_key === flagKey);
    expect(flag?.enabled).toBe(1);
  });
});
