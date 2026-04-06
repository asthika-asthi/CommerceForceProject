import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../../../server/db';
import { EmailService } from '../../../server/services/email.service';

describe('EmailService Unit Tests', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('should send and log an email', async () => {
    const recipient = 'test@example.com';
    const subject = 'Test Subject';
    const body = 'Test Body';

    const log = await EmailService.sendEmail(recipient, subject, body);

    expect(log.recipient).toBe(recipient);
    expect(log.subject).toBe(subject);
    expect(log.body).toBe(body);
    expect(log.status).toBe('sent');
    expect(log.id).toBeDefined();
  });

  it('should retrieve all email logs', async () => {
    const logs = await EmailService.getAllLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].recipient).toBe('test@example.com');
  });

  it('should retrieve logs by recipient', async () => {
    const recipient = 'user@example.com';
    await EmailService.sendEmail(recipient, 'Hello', 'World');
    
    const logs = await EmailService.getLogsByRecipient(recipient);
    expect(logs.length).toBe(1);
    expect(logs[0].recipient).toBe(recipient);
  });
});
