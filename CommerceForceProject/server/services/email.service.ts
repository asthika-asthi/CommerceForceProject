import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { EmailLog } from '../../src/shared/types';

export class EmailService {
  /**
   * Sends an email and logs it to the database.
   * In a production environment, this would integrate with an SMTP service or API (e.g., SendGrid, Mailgun).
   */
  static async sendEmail(recipient: string, subject: string, body: string): Promise<EmailLog> {
    const id = uuidv4();
    const status = 'sent'; // In a real system, this could be 'pending', 'failed', etc.

    // Log the email to the database
    await db.query(`
      INSERT INTO email_logs (id, recipient, subject, body, status)
      VALUES (?, ?, ?, ?, ?)
    `, [id, recipient, subject, body, status]);

    // Mock sending logic
    console.log(`[Email Service] Sending email to ${recipient}: ${subject}`);

    return {
      id,
      recipient,
      subject,
      body,
      status,
      sent_at: new Date().toISOString()
    };
  }

  static async getAllLogs(): Promise<EmailLog[]> {
    const result = await db.query('SELECT * FROM email_logs ORDER BY sent_at DESC');
    return result.rows as EmailLog[];
  }

  static async getLogsByRecipient(recipient: string): Promise<EmailLog[]> {
    const result = await db.query('SELECT * FROM email_logs WHERE recipient = ? ORDER BY sent_at DESC', [recipient]);
    return result.rows as EmailLog[];
  }
}
