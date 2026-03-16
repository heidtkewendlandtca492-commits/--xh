import imageCompression from 'browser-image-compression';

export async function uploadFile(file: File, path: string, onProgress?: (progress: number) => void): Promise<{ url: string, originalUrl?: string }> {
  let fileToUpload = file;
  
  // Cloudinary free tier limit is 10MB (10485760 bytes)
  const MAX_FILE_SIZE = 10485760;
  
  if (file.size > MAX_FILE_SIZE) {
    if (file.type.startsWith('image/')) {
      try {
        console.log(`File size is ${file.size} bytes, compressing to fit 10MB limit...`);
        const options = {
          maxSizeMB: 9.5, // Target slightly under 10MB
          maxWidthOrHeight: 4096, // Reasonable max dimension
          useWebWorker: true
        };
        fileToUpload = await imageCompression(file, options);
        console.log(`Compressed file size: ${fileToUpload.size} bytes`);
      } catch (error) {
        console.error('Image compression failed:', error);
        throw new Error('图片过大且自动压缩失败，请手动压缩至 10MB 以下再上传。');
      }
    } else {
      throw new Error(`文件大小超过 10MB 限制。当前大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  const formData = new FormData();
  formData.append('file', fileToUpload);
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
        try {
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
        } catch (err) {
          console.error('Failed to parse Cloudinary response:', err);
          reject(new Error('Failed to parse upload response'));
        }
      } else {
        console.error('Cloudinary upload error:', xhr.status, xhr.responseText);
        let errorMsg = xhr.responseText;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed.error && parsed.error.message) {
            errorMsg = parsed.error.message;
          }
        } catch (e) {}
        reject(new Error(`上传失败 (${xhr.status}): ${errorMsg}`));
      }
    };

    xhr.onerror = () => {
      console.error('Cloudinary network error. Status:', xhr.status, 'Response:', xhr.responseText);
      reject(new Error('网络错误或被浏览器插件拦截，上传失败。请检查网络连接或关闭广告拦截插件。'));
    };
    
    xhr.send(formData);
  });
}
