const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const resizeImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const originalPath = req.file.path;

    const tempPath = originalPath + '.tmp';

    try {
        await sharp(originalPath)
            .resize(300, 300, {
                fit: 'contain', //bisa cover tapi agak kepotong // fill bikin gambarnya ke stretch kalau ukuran gambar lebih kecil dari 300x300
                position: 'center'
            })
            .toFormat('jpeg') 
            .jpeg({ quality: 90 }) 
            .toFile(tempPath); 

        fs.renameSync(tempPath, originalPath);

        const originalFilename = req.file.filename;
        const newFilename = path.parse(originalFilename).name + '.jpeg';
        
        const newFullPath = path.join(req.file.destination, newFilename);
        fs.renameSync(originalPath, newFullPath);
        
        req.file.filename = newFilename;
        req.file.path = newFullPath;
        
        next();
    } catch (error) {
        console.error("Gagal me-resize gambar:", error);
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
        }
        next(error);
    }
};

module.exports = resizeImage;