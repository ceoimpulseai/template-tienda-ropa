import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireBusiness } from '../../middleware/requireBusiness.js';
import { requirePermission } from '../../middleware/requirePermission.js';
import { uploadController } from './upload.controller.js';

export const uploadRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  },
});

uploadRoutes.use(requireAuth, requireBusiness);

uploadRoutes.post(
  '/image',
  requirePermission('upload:create'),
  upload.single('file'),
  uploadController.uploadImage
);

uploadRoutes.post(
  '/images',
  requirePermission('upload:create'),
  upload.array('files', 10),
  uploadController.uploadMultiple
);

uploadRoutes.delete(
  '/image/:publicId',
  requirePermission('upload:delete'),
  uploadController.deleteImage
);