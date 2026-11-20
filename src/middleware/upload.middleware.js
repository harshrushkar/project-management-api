const multer = require("multer");

// Store uploaded files temporarily in memory
const storage = multer.memoryStorage();

// Configure multer
const upload = multer({
    storage: storage,

    limits: {
        files: 10,
        fileSize: 10 * 1024 * 1024, // Maximum 10 MB per file
    },

    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            // Images
            "image/jpeg",
            "image/png",
            "image/webp",

            // Documents
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

            // Excel
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ];

        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type"));
        }
    },
});

module.exports = upload;