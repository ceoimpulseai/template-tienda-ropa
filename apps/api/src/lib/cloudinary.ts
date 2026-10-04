import { env } from '../config/env.js';

export function buildCloudinaryUrl(
  publicId: string | null | undefined,
  options: { width?: number; height?: number; crop?: string; quality?: string } = {}
): string | null {
  if (!publicId || !env.CLOUDINARY_CLOUD_NAME) return null;

  const { width, height, crop = 'fill', quality = 'auto' } = options;
  const baseUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload`;

  const transformations = [
    quality ? `q_${quality}` : null,
    crop ? `c_${crop}` : null,
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
  ]
    .filter(Boolean)
    .join(',');

  const transformStr = transformations ? `${transformations}/` : '';

  return `${baseUrl}/${transformStr}${publicId}`;
}

export function buildCloudinaryThumbnailUrl(publicId: string | null | undefined): string | null {
  return buildCloudinaryUrl(publicId, { width: 400, height: 400, crop: 'fill', quality: 'auto:good' });
}

export function buildCloudinaryPreviewUrl(publicId: string | null | undefined): string | null {
  return buildCloudinaryUrl(publicId, { width: 800, height: 800, crop: 'limit', quality: 'auto:good' });
}

export function buildCloudinaryFullUrl(publicId: string | null | undefined): string | null {
  return buildCloudinaryUrl(publicId, { crop: 'limit', quality: 'auto:best' });
}