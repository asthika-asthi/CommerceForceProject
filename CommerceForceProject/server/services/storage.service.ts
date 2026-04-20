import fs from 'fs';
import path from 'path';

export class StorageService {
  private static uploadDir = path.join(process.cwd(), 'uploads');

  static init() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    // Pre-create assets directory for centralized management
    const assetsDir = path.join(this.uploadDir, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
  }

  private static normalizeFileName(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const nameWithoutExt = path.basename(fileName, path.extname(fileName));
    
    let normalized = nameWithoutExt
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // spaces to hyphens
      .replace(/[^a-z0-9-]/g, '')     // remove non-alphanumeric (except hyphens)
      .replace(/-+/g, '-')             // collapse multiple hyphens
      .replace(/^-+|-+$/g, '');       // trim hyphens from start/end
    
    if (!normalized) {
      normalized = 'file';
    }
    
    return `${normalized}${ext}`;
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

    const fileName = this.normalizeFileName(file.originalname);
    const filePath = path.join(targetDir, fileName);

    // Duplicate detection - case-insensitive check (already handled by normalization to lowercase)
    if (fs.existsSync(filePath)) {
      throw new Error(`Resource with ID '${fileName}' already exists.`);
    }

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
   * Lists files in a subdirectory of uploads
   */
  static async listFiles(subDir: string = ''): Promise<{ name: string; url: string; size: number; mtime: Date }[]> {
    const targetDir = path.join(this.uploadDir, subDir);
    if (!fs.existsSync(targetDir)) return [];

    const files = fs.readdirSync(targetDir);
    const result = [];

    for (const file of files) {
      const filePath = path.join(targetDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        const relativePath = subDir ? `${subDir}/${file}` : file;
        result.push({
          name: file,
          url: `/uploads/${relativePath}`,
          size: stats.size,
          mtime: stats.mtime
        });
      }
    }

    return result.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
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
