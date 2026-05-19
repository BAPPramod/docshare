import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/pjpeg',
  'image/x-png'
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

const isAllowedFile = (file: Express.Multer.File): boolean => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return true;
  }
  // Browsers often send empty or generic mime types during multi-file selection
  if (!file.mimetype || file.mimetype === 'application/octet-stream') {
    return ALLOWED_EXTENSIONS.has(ext);
  }
  return ALLOWED_EXTENSIONS.has(ext);
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (isAllowedFile(file)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for "${file.originalname}". Only PDF, JPG, and PNG are allowed.`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});
