import { saveAs } from 'file-saver';

/**
 * Downloads a file directly to the user's computer.
 * Handles remote URLs (Cloudinary, S3, etc.) by fetching them as blobs.
 */
export const downloadFile = async (fileUrl, fileName = 'certificate') => {
  if (!fileUrl) return;

  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Fetch failed');
    const blob = await response.blob();
    saveAs(blob, fileName);
  } catch (error) {
    console.warn('Direct blob fetch failed, falling back to window download:', error);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
