import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';
import {
  uploadDocument,
  getDocuments,
  viewDocument,
  downloadDocument,
  deleteDocument
} from '../controllers/documentController';

const router = Router();

router.use(authenticate);

const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
    next();
  });
};

router.post('/', handleUpload, uploadDocument);
router.get('/', getDocuments);
router.get('/:id/view', viewDocument);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

export default router;