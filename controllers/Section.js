const Section = require("../models/Section");
const Course = require("../models/Course");

// createSection
exports.createSection = async (req, res) => {
    try {
        // fetch data
        const { sectionName, courseId } = req.body;

        // validation
        if (!sectionName || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        };

        const courseDetails = await Course.findById(courseId);

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Course with ID ${courseId} not found.`,
            });
        };

        // create section
        const newSection = await Section.create({ sectionName });

        // update Course schema with section ObjectID
        const updatedCourseDetails = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    courseContent: newSection._id
                }
            },
            { new: true }
        ).populate({
            path: "courseContent",
            populate: {
                path: "subSection"
            }
        }).exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "Section created successfully",
            data: updatedCourseDetails
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating section",
            error: error.message
        });
    }
};

// updateSection
exports.updateSection = async (req, res) => {
    try {
        // fetch data
        const { sectionName, sectionId } = req.body;

        // validation
        if (!sectionName || !sectionId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        };

        // update entry in database
        const updatedSection = await Section.findByIdAndUpdate(sectionId, { sectionName }, { new: true });

        // return response
        return res.status(200).json({
            success: true,
            message: "Section updated successfully",
            data: updatedSection
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating section",
            error: error.message
        });
    }
};

// deleteSection
exports.deleteSection = async (req, res) => {
    try {
        // get id -> assuming that we are passing ID in params
        const { sectionId } = req.params;

        // delete entry from database
        await Section.findByIdAndDelete(sectionId);

        // TODO: do we need to delete the sectioId entry from the Course Schema, if yes then pass courseId with req body

        // return response
        return res.status(200).json({
            success: true,
            message: "Section deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting section",
            error: error.message
        });
    }
}