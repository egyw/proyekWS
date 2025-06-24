const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// untuk profile picture ===================================================================
const profilePictureStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: (req, file) => {
            const username = req.user && req.user.username ? req.user.username : 'unknown-user';
            return `proyekWS/profiles/${username}`; 
        },
        
        allowed_formats: ['jpeg', 'png', 'jpg'],
        
        transformation: [{ width: 300, height: 300, crop: 'fill' }],

        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            return `profile-${req.user.id}-${uniqueSuffix}`;
        },
    },
});

const uploadProfileToCloud = multer({ 
    storage: profilePictureStorage,
    limits: {
        fileSize: 2 * 1024 * 1024, // Batas ukuran file 2MB
    }
});

// untuk recipe ============================================================================
const recipeMediaStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        // Folder dinamis: simpan video di folder video, gambar di folder gambar
        folder: (req, file) => {
            if (file.mimetype.startsWith('video')) {
                return 'proyekWS/recipes/videos';
            }
            return 'proyekWS/recipes/images';
        },
        // 'auto' akan membiarkan Cloudinary mendeteksi apakah ini gambar atau video
        resource_type: 'auto', 
        allowed_formats: ['jpeg', 'png', 'jpg', 'mp4', 'mov', 'mkv', 'avi'], // Izinkan format gambar dan video
        public_id: (req, file) => {
            // Buat nama file unik
            const recipeTitle = req.body.title ? req.body.title.replace(/\s+/g, '-').toLowerCase() : 'recipe';
            return `${recipeTitle}-${req.user.id}-${Date.now()}`;
        }
    }
});

const uploadRecipeMediaToCloud = multer({
    storage: recipeMediaStorage,
    limits: {
        fileSize: 50 * 1024 * 1024, // Naikkan batas jadi 50MB untuk video
    }
});

module.exports = {
    cloudinary,
    uploadProfileToCloud,
    uploadRecipeMedia: () => uploadRecipeMediaToCloud.fields([
        { name: 'foodImage', maxCount: 1 },
        { name: 'foodVideo', maxCount: 1 }
    ])
};