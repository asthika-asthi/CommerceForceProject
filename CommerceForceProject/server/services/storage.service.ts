import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class StorageService {
  private static uploadDir = path.join(process.cwd(), 'uploads');

  static init() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Saves a file from a Multer buffer or temporary path
   */
  static async saveFile(file: Express.Multer.File, subDir: string = ''): Promise<string> {
    this.init();
    
    const targetDir = path.join(this.uploadDir, subDir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(targetDir, fileName);

    // If file is in buffer (memoryStorage)
    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if (file.path) {
      // If file is on disk (diskStorage)
      fs.renameSync(file.path, filePath);
    }

    // Return relative path for DB storage
    return subDir ? `${subDir}/${fileName}` : fileName;
  }

  /**
   * Deletes a file from the uploads directory
   */
  static async deleteFile(relativePath: string): Promise<void> {
    const filePath = path.join(this.uploadDir, relativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Generates a full public URL for a relative path
   */
  static getPublicUrl(relativePath: string): string {
    if (!relativePath) return '';
    if (relativePath.startsWith('http')) return relativePath;
    
    const baseUrl = process.env.APP_URL || '';
    return `${baseUrl}/uploads/${relativePath}`;
  }
}
