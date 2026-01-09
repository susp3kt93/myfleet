import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists (for fallback local storage)
const uploadDir = 'uploads/profiles';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Use memory storage for Vercel Blob compatibility
// Files will be available as req.file.buffer
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});
