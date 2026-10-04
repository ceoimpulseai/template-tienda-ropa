import type { Request, Response, NextFunction } from 'express';
import { uploadService } from './upload.service.js';

export const uploadController = {
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'NO_FILE_UPLOADED' });
      }

      const { folder, publicId } = req.body;

      const result = await uploadService.uploadImage(req.file.buffer, {
        folder: folder ?? 'template-tienda-ropa',
        publicId: publicId ?? uploadService.generatePublicId('img'),
      });

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  async uploadMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'NO_FILES_UPLOADED' });
      }

      const { folder } = req.body;

      const results = await Promise.all(
        files.map((file, index) =>
          uploadService.uploadImage(file.buffer, {
            folder: folder ?? 'template-tienda-ropa',
            publicId: uploadService.generatePublicId(`img-${index}`),
          })
        )
      );

      res.status(201).json(results);
    } catch (err) {
      next(err);
    }
  },

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        return res.status(400).json({ error: 'MISSING_PUBLIC_ID' });
      }

      await uploadService.deleteImage(publicId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
};