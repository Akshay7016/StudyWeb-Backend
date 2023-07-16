require("dotenv").config();

const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");

const fileUploader = require("../utils/fileUploader");

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

// getAllCourses
exports.getAllCourses = async (req, res) => {
    try {
        const allCourses = await Course.find({}, {
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
                    path: "subSection"
                }
            })
            .exec();

        // validation
        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with courseId: ${courseId}`
            });
        }

        return res.status(200).json({
            success: true,
            message: "Course details fetched successfully",
            data: courseDetails
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching specific course",
            error: error.message
        });
    }
};