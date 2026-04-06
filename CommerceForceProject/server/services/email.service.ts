import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import db from '../db';
import { EmailLog } from '../../src/shared/types';

export class EmailService {
  private static transporter = (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) 
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

  /**
   * Sends an email and logs it to the database.
   * Integrates with SMTP if configured, otherwise falls back to console logging.
   */
  static async sendEmail(recipient: string, subject: string, body: string): Promise<EmailLog> {
    const id = uuidv4();
    let status: 'sent' | 'failed' = 'sent';

    try {
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"${process.env.SMTP_FROM_NAME || 'Commerce App'}" <${process.env.SMTP_FROM_EMAIL || 'noreply@example.com'}>`,
          to: recipient,
          subject: subject,
          text: body,
          html: body.replace(/\n/g, '<br>'), // Simple text to HTML conversion
        });
        console.log(`[Email Service] Actual email sent to ${recipient}: ${subject}`);
      } else {
        console.log(`[Email Service] SMTP not configured. Mock sending email to ${recipient}: ${subject}`);
      }
    } catch (error) {
      console.error(`[Email Service] Failed to send email to ${recipient}:`, error);
      status = 'failed';
    }

    // Log the email to the database
    await db.query(`
      INSERT INTO email_logs (id, recipient, subject, body, status)
      VALUES (?, ?, ?, ?, ?)
    `, [id, recipient, subject, body, status]);

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
