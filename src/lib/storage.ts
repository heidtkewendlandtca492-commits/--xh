export async function uploadFile(file: File, path: string, onProgress?: (progress: number) => void): Promise<string> {
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
        resolve(response.secure_url);
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
