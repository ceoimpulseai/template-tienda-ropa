import { cloudinary } from '../../lib/cloudinary-config.js';

interface UploadResult {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export const uploadService = {
  async uploadImage(
    fileBuffer: Buffer,
    options: { folder?: string; publicId?: string; transformation?: Record<string, unknown> } = {}
  ): Promise<UploadResult> {
    const { folder = 'template-tienda-ropa', publicId, transformation } = options;

    return new Promise((resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        folder,
        resource_type: 'image',
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      if (transformation) {
        uploadOptions.transformation = transformation;
      }

      const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('No result from Cloudinary'));
          return;
        }

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      });

      uploadStream.end(fileBuffer);
    });
  },

  async deleteImage(publicId: string): Promise<void> {
    if (!publicId) return;

    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (result.result !== 'ok') {
          reject(new Error(`Failed to delete: ${result.result}`));
          return;
        }
        resolve();
      });
    });
  },

  generatePublicId(prefix: string = 'upload'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${timestamp}-${random}`;
  },
};