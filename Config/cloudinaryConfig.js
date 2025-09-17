import multer from 'multer';
import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFileToCloudinary = async (file) => {
  const options = {
    resource_type: file.mimetype.startsWith('video') ? 'video' : 'image',
  };

  return new Promise((resolve, reject) => {
    const uploader = file.mimetype.startsWith('video')
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;

    uploader(file.path, options, (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return reject(error); // ❌ reject instead of fallback
      }

      if (!result || !result.secure_url) {
        return reject(new Error('Cloudinary did not return secure_url'));
      }

      console.log('✅ Cloudinary upload successful:', result.secure_url);

      // delete local file after upload
      fs.unlink(file.path, () => {});

      resolve(result); // ✅ real Cloudinary response
    });
  });
};


const multerMiddleware = multer({dest: 'uploads/'}).single('media');

export { uploadFileToCloudinary, multerMiddleware };