const SubSection = require("../models/SubSection");
const CourseProgress = require("../models/CourseProgress");

exports.updateCourseProgress = async (req, res) => {
    try {
        const { courseId, subSectionId } = req.body;
        const userId = req.user.id;

        // check if the subSection is valid
        const subSection = await SubSection.findById(subSectionId);

        if (!subSection) {
            return res.status(404).json({
                success: false,
                message: "Sub section not found"
            });
        };

        // find the course progress document for the user and course
        let courseProgress = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId
        });

        if (!courseProgress) {
            return res.status(404).json({
                success: false,
                message: "Course progress does not exist"
            });
        }

        // If course progress exists, check if the subSection is already completed
        if (courseProgress?.completedVideos?.includes(subSectionId)) {
            return res.status(400).json({
                success: false,
                message: "SubSection already completed"
            });
        }

        // if subSection not present then push the subSection into the completedVideos array
        courseProgress.completedVideos.push(subSectionId);

        // save the updated course progress
        await courseProgress.save();

        // return response
        return res.status(200).json({
            success: true,
            message: "Course progress updated"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating course progress",
            error: error.message
        });
    }
};