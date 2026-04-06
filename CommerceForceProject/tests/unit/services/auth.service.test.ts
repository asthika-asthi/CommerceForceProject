import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { AuthService } from '../../../server/services/auth.service';

describe('AuthService Unit Tests', () => {
  beforeAll(async () => {
    await initDb();
  });

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  it('should register a new user', async () => {
    const result = await AuthService.register(testUser);
    expect(result.user.email).toBe(testUser.email);
    expect(result.user.name).toBe(testUser.name);
    expect(result.token).toBeDefined();
  });

  it('should not allow duplicate registration', async () => {
    await expect(AuthService.register(testUser)).rejects.toThrow('User already exists');
  });

  it('should login an existing user', async () => {
    const result = await AuthService.login({
      email: testUser.email,
      password: testUser.password
    });
    expect(result.user.email).toBe(testUser.email);
    expect(result.token).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    await expect(AuthService.login({
      email: testUser.email,
      password: 'wrongpassword'
    })).rejects.toThrow('Invalid credentials');
  });

  it('should verify a valid token', async () => {
    const { token } = await AuthService.login({
      email: testUser.email,
      password: testUser.password
    });
    const decoded = AuthService.verifyToken(token);
    expect(decoded?.email).toBe(testUser.email);
  });

  it('should return null for invalid token', () => {
    const decoded = AuthService.verifyToken('invalid-token');
    expect(decoded).toBeNull();
  });
});
