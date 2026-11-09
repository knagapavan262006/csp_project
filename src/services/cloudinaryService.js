const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export const uploadCertificateToCloudinary = async (file, onProgress) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error('Cloudinary is not configured. Set the cloud name and unsigned upload preset.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress((event.loaded / event.total) * 100);
    });

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`);
    xhr.onload = () => {
      let result;
      try {
        result = JSON.parse(xhr.responseText);
      } catch {
        reject(new Error('Cloudinary returned an unreadable response.'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300 && result.secure_url) {
        resolve(result);
        return;
      }

      reject(new Error(result.error?.message || `Cloudinary upload failed with status ${xhr.status}.`));
    };

    xhr.onerror = () => reject(new Error('Network error while uploading to Cloudinary.'));
    xhr.send(formData);
  });
};
