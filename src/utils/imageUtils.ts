/**
 * Utility functions for image processing and profile pictures
 */

export const processProfilePicture = async (
  file: File | Blob,
  maxSize: number = 512,
  quality: number = 0.88
): Promise<{ blob: Blob; dataUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.onload = () => {
        try {
          // Calculate center square crop
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;

          const canvas = document.createElement('canvas');
          const targetSize = Math.min(minDim, maxSize);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              blob: file,
              dataUrl: typeof reader.result === 'string' ? reader.result : '',
            });
            return;
          }

          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            targetSize,
            targetSize
          );

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, dataUrl });
              } else {
                resolve({ blob: file, dataUrl });
              }
            },
            'image/jpeg',
            quality
          );
        } catch {
          resolve({
            blob: file,
            dataUrl: typeof reader.result === 'string' ? reader.result : '',
          });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};
