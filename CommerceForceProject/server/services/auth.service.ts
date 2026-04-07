import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../../src/shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev';

export class AuthService {
  static async register(data: RegisterData): Promise<AuthResponse> {
    const { email, password, name } = data;

    // Check if user exists
    const existingUserResult = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUserResult.rows[0]) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    // Default to 'customer' role (id 3)
    const customerRoleResult = await db.query('SELECT id FROM roles WHERE name = ?', ['customer']);
    const roleId = customerRoleResult.rows[0]?.id || 3;

    await db.query('INSERT INTO users (id, email, name, password_hash, role_id) VALUES (?, ?, ?, ?, ?)', 
      [userId, email, name, passwordHash, roleId]);

    const user = await this.getUserById(userId);
    const token = this.generateToken(user);

    return { user, token };
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    const userRecordResult = await db.query(`
      SELECT u.*, r.name as role 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.email = ?
    `, [email]);
    const userRecord = userRecordResult.rows[0];

    if (!userRecord) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, userRecord.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const user: User = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      credit_limit: userRecord.credit_limit ? Number(userRecord.credit_limit) : undefined,
      available_credit: userRecord.available_credit ? Number(userRecord.available_credit) : undefined
    };

    const token = this.generateToken(user);

    return { user, token };
  }

  static async getUserById(id: string): Promise<User> {
    const userRecordResult = await db.query(`
      SELECT u.*, r.name as role 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.id = ?
    `, [id]);
    const userRecord = userRecordResult.rows[0];

    if (!userRecord) {
      throw new Error('User not found');
    }

    return {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      credit_limit: userRecord.credit_limit ? Number(userRecord.credit_limit) : undefined,
      available_credit: userRecord.available_credit ? Number(userRecord.available_credit) : undefined
    };
  }

  private static generateToken(user: User): string {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}
