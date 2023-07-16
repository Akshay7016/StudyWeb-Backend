const cloudinary = require("cloudinary").v2;

exports.deleteFileFromCloudinary = (file) => {
    cloudinary.uploader.destroy(
        file,
        {
            resource_type: 'video',
            invalidate: true
        })
};