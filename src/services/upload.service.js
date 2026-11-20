
const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const uploadToCloudinary = (fileBuffer, folder = "project-management") => {
    return new Promise((resolve, reject) => {

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    resourceType: result.resource_type,
                    bytes: result.bytes,
                });
            }
        );

        Readable.from(fileBuffer).pipe(uploadStream);
    });
};

module.exports = {
    uploadToCloudinary,
};
