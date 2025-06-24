const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const profilePictureStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'proyekWS/profiles', 
        
        allowed_formats: ['jpeg', 'png', 'jpg'],
        
        transformation: [{ width: 300, height: 300, crop: 'fill' }],

        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            return `profile-${req.user.id}-${uniqueSuffix}`;
        },
    },
});

// Buat instance multer khusus untuk upload ke Cloudinary
const uploadProfileToCloud = multer({ 
    storage: profilePictureStorage,
    limits: {
        fileSize: 2 * 1024 * 1024, // Batas ukuran file 2MB, sama seperti imageUploader Anda
    }
});

module.exports = {
    uploadProfileToCloud
};