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
        );
        // TODO: use populate to replace section/subSection both in the updatedCourseDetails

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