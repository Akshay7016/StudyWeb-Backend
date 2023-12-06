require("dotenv").config();

const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const Section = require("../models/Section");
const SubSection = require("../models/SubSection");

const fileUploader = require("../utils/fileUploader");
const { convertSecondsToDuration } = require("../utils/secondToDuration");

// createCourse
exports.createCourse = async (req, res) => {
    try {
        // fetch data from request body
        let {
            courseName,
            courseDescription,
            whatYouWillLearn,
            price,
            category,
            tags: _tags,
            status,
            instructions: _instructions
        } = req.body;

        // get thumbnail
        const thumbnail = req.files.thumbnailImage;

        // Convert the tag and instructions from stringified Array to Array
        const tags = JSON.parse(_tags)
        const instructions = JSON.parse(_instructions)

        // validation
        if (
            !courseName ||
            !courseDescription ||
            !whatYouWillLearn ||
            !price ||
            !category ||
            !tags.length ||
            !thumbnail ||
            !instructions.length
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        };

        if (!status || status === undefined) {
            status = "Draft";
        }

        // take instructor id (user who logged-in is Instructor) from req.user
        const instructorId = req.user.id;

        const instructorDetails = await User.findById(instructorId);

        if (!instructorDetails) {
            return res.status(404).json({
                success: false,
                message: "Instructor Details Not Found",
            });
        }

        // Check if the tag given is valid 
        const categoryDetails = await Category.findById({ _id: category });

        if (!categoryDetails) {
            return res.status(403).json({
                success: false,
                message: "Category details not found!"
            })
        };

        // Upload image/thumbnail to cloudinary
        const thumbnailImage = await fileUploader(thumbnail, process.env.FOLDER_NAME);

        // create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorId,
            whatYouWillLearn,
            price,
            category,
            tags,
            thumbnail: thumbnailImage.secure_url,
            status,
            instructions,
        });

        // add the newCourse id to the User Schema of the Instructor
        await User.findByIdAndUpdate(
            { _id: instructorId },
            {
                $push: {
                    courses: newCourse._id
                }
            },
            { new: true }
        );

        // add the newCourse id to the Categories
        await Category.findByIdAndUpdate(
            { _id: category },
            {
                $push: {
                    courses: newCourse._id
                }
            },
            { new: true }
        );

        // return response
        return res.status(200).json({
            success: true,
            message: "Course created successfully",
            data: newCourse
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating course",
            error: error.message
        });
    }
};

// Edit course Details
exports.editCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const updates = req.body;

        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: `Course not found`
            });
        };

        // If thumbnail image is found, update it
        if (req.files) {
            const thumbnail = req.files.thumbnailImage;
            const thumbnailImage = await fileUploader(thumbnail, process.env.FOLDER_NAME);
            course.thumbnail = thumbnailImage?.secure_url;
        };

        // Update only the fields that are present in the request body
        for (const key in updates) {
            if (updates.hasOwnProperty(key)) {
                if (key === "tags" || key === "instructions") {
                    course[key] = JSON.parse(updates[key]);
                } else {
                    course[key] = updates[key];
                }
            }
        };

        await course.save();

        const updatedCourse = await Course.findById(courseId)
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails"
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
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
            message: "Course updated successfully",
            data: updatedCourse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating course",
            error: error.message
        });
    }
};

// getAllCourses
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find(
            { status: "Published" },
            {
                courseName: true,
                price: true,
                thumbnail: true,
                instructor: true,
                ratingAndReviews: true,
                studentsEnrolled: true
            }).populate("instructor").exec();

        res.status(200).json({
            success: true,
            message: "All courses fetched successfully",
            data: allCourses
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching all courses",
            error: error.message
        });
    }
};

// getCourseDetails
exports.getCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;

        // find course details
        const courseDetails = await Course.findById(
            courseId
        )
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails"
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                }
            })
            .exec();

        // validation
        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Course not found`
            });
        }

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration);
                totalDurationInSeconds += timeDurationInSeconds;
            })
        });

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

        return res.status(200).json({
            success: true,
            message: "Course details fetched successfully",
            data: {
                courseDetails,
                totalDuration
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching specific course",
            error: error.message
        });
    }
};

// getFullCourseDetails => for particular user how much he had completed course
exports.getFullCourseDetails = async (req, res) => {
    try {
        const { courseId } = req.body;
        const userId = req.user.id;

        const courseDetails = await Course.findOne({
            _id: courseId
        })
            .populate({
                path: "instructor",
                populate: {
                    path: "additionalDetails"
                }
            })
            .populate("category")
            .populate("ratingAndReviews")
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                }
            })
            .exec();

        if (!courseDetails) {
            return res.status(404).json({
                success: false,
                message: `Course not found`,
            })
        }

        const courseProgressCount = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId
        });

        let totalDurationInSeconds = 0;
        courseDetails.courseContent.forEach((content) => {
            content.subSection.forEach((subSection) => {
                const timeDurationInSeconds = parseInt(subSection.timeDuration);
                totalDurationInSeconds += timeDurationInSeconds;
            })
        });

        const totalDuration = convertSecondsToDuration(totalDurationInSeconds);

        // return response
        return res.status(200).json({
            success: true,
            message: "getFullCourseDetails fetched successfully",
            data: {
                courseDetails,
                totalDuration,
                completedVideos: courseProgressCount?.completedVideos ? courseProgressCount?.completedVideos : []
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching full course details",
            error: error.message
        });
    }
};

// Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
    try {
        const instructorId = req.user.id;

        // find all courses belonging to the instructor
        const instructorCourses = await Course.find({
            instructor: instructorId
        })
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection"
                }
            })
            .sort({ createdAt: -1 });

        const courses = instructorCourses.map((course) => course.toObject());

        for (let i = 0; i < courses.length; i++) {
            let totalDurationInSeconds = 0;

            for (let j = 0; j < courses[i].courseContent.length; j++) {
                totalDurationInSeconds += courses[i].courseContent[j].subSection.reduce((acc, current) => acc + parseInt(current.timeDuration), 0);
            }
            courses[i].totalDuration = convertSecondsToDuration(totalDurationInSeconds);
        }

        // return response
        return res.status(200).json({
            success: true,
            message: "Instructor courses fetched successfully",
            data: courses
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve instructor courses",
            error: error.message
        });
    }
}

// Delete the course
exports.deleteCourse = async (req, res) => {
    try {
        const { courseId } = req.body;
        const instructorId = req.user.id;

        // Find the course
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: `Course not found`
            });
        };

        // Unenroll students from the course
        const studentsEnrolled = course.studentsEnrolled;
        for (const studentId of studentsEnrolled) {
            await User.findByIdAndUpdate(studentId, {
                $pull: {
                    courses: courseId
                }
            })
        };

        // Delete sections and sub-sections
        const courseSections = course.courseContent;
        for (const sectionId of courseSections) {
            // Delete sub-sections of the section
            const section = await Section.findById(sectionId);
            if (section) {
                const subSections = section.subSection;
                for (const subSectionId of subSections) {
                    await SubSection.findByIdAndDelete(subSectionId);
                }
            };

            // Delete the section
            await Section.findByIdAndDelete(sectionId);
        };

        // Delete courseId from Instructors courses array
        await User.findByIdAndUpdate(
            { _id: instructorId },
            {
                $pull: {
                    courses: courseId
                }
            },
            { new: true }
        );

        // Delete the course
        await Course.findByIdAndDelete(courseId);

        // return response
        return res.status(200).json({
            success: true,
            message: "Course deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete course",
            error: error.message
        });
    }
}