const mongoose = require("mongoose");

const { deleteFileFromCloudinary } = require("../utils/deleteFileFromCloudinary");

const subSectionSchema = new mongoose.Schema({
    title: {
        type: String
    },
    timeDuration: {
        type: String
    },
    description: {
        type: String
    },
    videoUrl: {
        type: String
    },
    cloudinaryPath: {
        type: String
    }
});

// post hook
subSectionSchema.post("findOneAndDelete", async function (doc) {
    await deleteFileFromCloudinary(doc.cloudinaryPath);
});

module.exports = mongoose.model("SubSection", subSectionSchema);