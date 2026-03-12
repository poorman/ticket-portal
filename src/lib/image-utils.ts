const MAX_DIMENSION = 1920;
const QUALITY = 0.8;

/**
 * Compress an image file using canvas.
 * Resizes to max 1920px on longest side and encodes as JPEG at 80% quality.
 * Falls back to original data URL if compression fails.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    // Skip non-raster formats
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Downscale if larger than max dimension
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to uncompressed
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Use JPEG for compression (much smaller than PNG for photos)
      // Keep PNG for images with transparency
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = outputType === 'image/jpeg' ? QUALITY : undefined;
      const dataUrl = canvas.toDataURL(outputType, quality);

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback to uncompressed
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    };

    img.src = url;
  });
}
