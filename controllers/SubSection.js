require("dotenv").config();

const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const fileUploader = require("../utils/fileUploader");

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
            videoUrl: videoDetails.secure_url
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
// TODO: add controller for updateSubSection

// deleteSubSection
// TODO: add controller for deleteSubSection