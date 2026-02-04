
import RNFS from 'react-native-fs';
import SHA1 from 'crypto-js/sha1';

/**
 * Cloudinary Full Configuration with API Key/Secret
 * Dùng để SIGNED UPLOAD (100% thành công, không cần Preset)
 */
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'dvwnd1eiz', 
  API_KEY: '612283224539323', 
  API_SECRET: '8lH7mOd4qgNLVSMJUycGnZad3lM', // Secret Key dùng để ký tên
};

export const uploadToCloudinary = (
  fileUri: string, 
  mimeType: string = 'image/jpeg',
  folder: string = 'FEPA/blogs'
): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log('[Cloudinary] Reading file for Signed Upload:', fileUri);
            const cleanPath = fileUri.startsWith('file://') ? fileUri.replace('file://', '') : fileUri;
            
            // 1. Đọc file -> Base64
            const base64Data = await RNFS.readFile(cleanPath, 'base64');
            const dataUri = `data:${mimeType};base64,${base64Data}`;
            
            // 2. Chuẩn bị tham số để ký tên (Signature)
            // QUAN TRỌNG: Các tham số ký phải sắp xếp theo Alphabet (trừ file, api_key, resource_type)
            const timestamp = Math.floor(Date.now() / 1000).toString();
            
            // Chuỗi cần ký: "folder=FEPA/blogs&timestamp=123456789" + API_SECRET
            const stringToSign = `folder=${folder}&timestamp=${timestamp}${CLOUDINARY_CONFIG.API_SECRET}`;
            const signature = SHA1(stringToSign).toString(); // Tạo chữ ký SHA-1

            console.log('[Cloudinary] Generated Signature:', signature);

            // 3. Đóng gói FormData
            const data = new FormData();
            data.append('file', dataUri);
            data.append('api_key', CLOUDINARY_CONFIG.API_KEY);
            data.append('timestamp', timestamp);
            data.append('folder', folder);
            data.append('signature', signature);
            // data.append('upload_preset', ... ); // BỎ cái này đi, vì dùng Signed Upload thì ko cần Preset nữa!

            // 4. Gửi Request
            const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.CLOUD_NAME}/image/upload`;
            console.log('[Cloudinary] POST to:', url);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', url);
            xhr.setRequestHeader('Accept', 'application/json');
            
            xhr.onload = () => {
                console.log(`[Cloudinary] Status: ${xhr.status}`);
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        console.log('[Cloudinary] SUCCESS:', response.secure_url);
                        resolve(response.secure_url);
                    } catch (e) {
                        reject(new Error('Invalid JSON from Cloudinary'));
                    }
                } else {
                    console.error('[Cloudinary] FAIL:', xhr.responseText);
                    reject(new Error(`Cloudinary Error: ${xhr.status} - ${xhr.responseText}`));
                }
            };

            xhr.onerror = (e) => reject(new Error('Network Error during Cloudinary Upload'));
            xhr.timeout = 60000;
            xhr.send(data);

        } catch (err: any) {
            console.error('[Cloudinary] Exception:', err);
            reject(new Error('Lỗi xử lý file: ' + err.message));
        }
    });
};
