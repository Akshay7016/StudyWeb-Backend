require("dotenv").config();

const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const fileUploader = require("../utils/fileUploader");
const { deleteFileFromCloudinary } = require("../utils/deleteFileFromCloudinary");

// createSubSection
exports.createSubSection = async (req, res) => {
    try {
        // fetch data
        const { sectionId, title, description } = req.body;

        // extract video file
        const video = req.files.videoFile;

        // validation
        if (!sectionId || !title || !description || !video) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        };

        // upload video to cloudinary
        const videoDetails = await fileUploader(video, process.env.FOLDER_NAME);

        // create sub section in database
        const subSectionDetails = await SubSection.create({
            title,
            timeDuration: `${videoDetails.duration}`,
            description,
            videoUrl: videoDetails.secure_url,
            cloudinaryPath: videoDetails.public_id
        });

        // update Section with sub-section objectId
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            {
                $push: {
                    subSection: subSectionDetails._id
                }
            },
            { new: true }
        ).populate("subSection").exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "Sub section created successfully",
            data: updatedSection
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating sub section",
            error: error.message
        });
    }
};

// updateSubSection
exports.updateSubSection = async (req, res) => {
    try {
        const { sectionId, subSectionId, title, description } = req.body;

        const subSection = await SubSection.findById(subSectionId);

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "Sub section not found"
            });
        };

        if (title !== undefined) {
            subSection.title = title;
        }

        if (description !== undefined) {
            subSection.description = description;
        }

        if (req.files && req.files.videoFile !== undefined) {
            const video = req.files.videoFile;
            const uploadDetails = await fileUploader(video, process.env.FOLDER_NAME);

            // Delete old video from cloudinary and then update the video
            await deleteFileFromCloudinary(subSection.cloudinaryPath);

            subSection.videoUrl = uploadDetails.secure_url;
            subSection.timeDuration = `${uploadDetails.duration}`;
            subSection.cloudinaryPath = uploadDetails.public_id;
        }

        await subSection.save();

        // find updated section and return it
        const updatedSection = await Section.findById(sectionId).populate("subSection").exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "Sub section details updated successfully",
            data: updatedSection
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating sub section",
            error: error.message
        });
    }
};

// deleteSubSection
exports.deleteSubSection = async (req, res) => {
    try {
        const { sectionId, subSectionId } = req.body;

        // validation
        if (!sectionId || !subSectionId) {
            return res.status(404).json({
                success: false,
                message: "sectionId and subSectionId is required"
            });
        };

        // check whether section with id present or not
        const sectionDetails = await Section.findById(sectionId);

        if (!sectionDetails) {
            return res.status(404).json({
                success: false,
                message: `Section not found`
            });
        };

        // check whether sub section with id present or not
        const subSectionDetails = await SubSection.findById(subSectionId);

        if (!subSectionDetails) {
            return res.status(404).json({
                success: false,
                message: `Sub section not found`
            });
        };

        // delete sub section
        await SubSection.findByIdAndDelete(subSectionId);

        // delete sub section id from section schema
        const updatedSection = await Section.findByIdAndUpdate(
            sectionId,
            {
                $pull: {
                    subSection: subSectionId
                }
            },
            { new: true }
        ).populate("subSection").exec();

        return res.status(200).json({
            success: true,
            message: "Sub section deleted successfully",
            data: updatedSection
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting sub section",
            error: error.message
        });
    }
};