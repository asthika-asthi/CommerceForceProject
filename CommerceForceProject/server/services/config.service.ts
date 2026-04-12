import fs from 'fs';
import path from 'path';

export class ConfigService {
  private static configDir = path.join(process.cwd(), 'config');

  static async getLandingConfig(client: string = 'default'): Promise<any> {
    return this.loadConfig(client, 'landing.json');
  }

  static async getCategoryConfig(client: string = 'default'): Promise<any> {
    return this.loadConfig(client, 'category.json');
  }

  static async getBrandingConfig(client: string = 'default'): Promise<any> {
    return this.loadConfig(client, 'branding.json');
  }

  static async getPaymentsConfig(client: string = 'default'): Promise<any> {
    return this.loadConfig(client, 'payments.json');
  }

  static async saveBrandingConfig(data: any, client: string = 'default'): Promise<void> {
    await this.saveConfig(client, 'branding.json', data);
  }

  static async saveLandingConfig(data: any, client: string = 'default'): Promise<void> {
    await this.saveConfig(client, 'landing.json', data);
  }

  static async savePaymentsConfig(data: any, client: string = 'default'): Promise<void> {
    await this.saveConfig(client, 'payments.json', data);
  }

  private static async loadConfig(client: string, filename: string): Promise<any> {
    const filePath = path.join(this.configDir, client, filename);
    const defaultPath = path.join(this.configDir, 'default', filename);

    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      
      if (fs.existsSync(defaultPath)) {
        const content = fs.readFileSync(defaultPath, 'utf-8');
        return JSON.parse(content);
      }

      return null;
    } catch (err) {
      console.error(`Error loading config ${filename} for client ${client}:`, err);
      return null;
    }
  }

  private static async saveConfig(client: string, filename: string, data: any): Promise<void> {
    const clientDir = path.join(this.configDir, client);
    const filePath = path.join(clientDir, filename);

    try {
      if (!fs.existsSync(clientDir)) {
        fs.mkdirSync(clientDir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error saving config ${filename} for client ${client}:`, err);
      throw err;
    }
  }
}
