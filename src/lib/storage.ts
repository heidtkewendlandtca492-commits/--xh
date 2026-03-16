export async function uploadFile(file: File, path: string, onProgress?: (progress: number) => void): Promise<{ url: string, originalUrl?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default'); // Using the default unsigned preset name
  formData.append('folder', path);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/duzcr0ovw/auto/upload`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        const originalUrl = response.secure_url;
        let url = originalUrl;
        
        // If it's an image, create a compressed URL for preview
        if (response.resource_type === 'image') {
          // Insert transformation parameters: q_auto:low (quality), f_auto (format), w_800 (width limit)
          const parts = originalUrl.split('/upload/');
          if (parts.length === 2) {
            url = `${parts[0]}/upload/q_auto:low,f_auto,w_800/${parts[1]}`;
          }
        }
        
        resolve({ url, originalUrl });
      } else {
        console.error('Cloudinary upload error:', xhr.responseText);
        reject(new Error('Upload failed: ' + xhr.responseText));
      }
    };

    xhr.onerror = () => {
      console.error('Cloudinary network error');
      reject(new Error('Upload failed due to network error'));
    };
    
    xhr.send(formData);
  });
}
