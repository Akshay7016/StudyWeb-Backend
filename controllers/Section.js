const Section = require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");

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
        const { sectionName, sectionId, courseId } = req.body;

        // validation
        if (!sectionName || !sectionId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        };

        // update entry in database
        await Section.findByIdAndUpdate(sectionId, { sectionName }, { new: true });

        const courseDetails = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection"
                }
            })
            .exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "Section updated successfully",
            data: courseDetails
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

        const { sectionId, courseId } = req.body;

        // validation
        if (!sectionId || !courseId) {
            return res.status(404).json({
                success: false,
                message: "sectionId and courseId is required"
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

        // check whether course with id present or not
        const courseDetails = await Course.findById(courseId);

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Course not found`
            });
        };

        // Delete sub-sections corresponding to sectionId
        const subSections = sectionDetails.subSection;
        for (const subSectionId of subSections) {
            await SubSection.findByIdAndDelete(subSectionId);
        };

        // delete entry from database
        await Section.findByIdAndDelete(sectionId);

        // delete section id from Course schema
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $pull: {
                    courseContent: sectionId
                }
            },
            { new: true }
        )
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection"
                }
            })
            .exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "Section deleted successfully",
            data: updatedCourse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting section",
            error: error.message
        });
    }
}