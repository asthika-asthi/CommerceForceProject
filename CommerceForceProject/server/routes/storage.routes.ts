import { Router } from 'express';
import multer from 'multer';
import { StorageService } from '../services/storage.service.ts';
import { isAuthenticated, isAdmin } from '../middleware/auth.middleware.ts';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB general limit
  }
});

// GET /api/storage/files - List all stored assets
router.get('/files', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const files = await StorageService.listFiles('assets');
    res.json(files);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/storage/upload - Upload new asset
router.post('/upload', isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'application/pdf'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type. Only images and PDFs are allowed.' });
    }

    // PDF specific size limit (50MB) vs others (10MB)
    const isPdf = req.file.mimetype === 'application/pdf' || req.file.originalname.toLowerCase().endsWith('.pdf');
    const limit = isPdf ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (req.file.size > limit) {
      return res.status(400).json({ 
        error: `File too large. Max size for ${isPdf ? 'PDFs' : 'images'} is ${isPdf ? '50MB' : '10MB'}.` 
      });
    }

    const relativePath = await StorageService.saveFile(req.file, 'assets');
    const url = `/uploads/${relativePath}`;
    
    res.json({ 
      success: true, 
      url,
      name: relativePath.split('/').pop(),
      path: relativePath
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/storage/files/:filename - Delete asset
router.delete('/files/:filename', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    // Security check: ensure they are only deleting from assets
    if (filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    await StorageService.deleteFile(`assets/${filename}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
