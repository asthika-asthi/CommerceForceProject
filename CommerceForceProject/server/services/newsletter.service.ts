import db from '../db';
import { v4 as uuidv4 } from 'uuid';

export class NewsletterService {
  static async subscribe(email: string) {
    // Check if table exists, create if not
    await db.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      const id = uuidv4();
      await db.query('INSERT INTO newsletter_subscribers (id, email) VALUES (?, ?)', [id, email]);
      return { success: true };
    } catch (error: any) {
      if (error.message.includes('UNIQUE')) {
        return { success: true, message: 'Already subscribed' };
      }
      throw error;
    }
  }
}
