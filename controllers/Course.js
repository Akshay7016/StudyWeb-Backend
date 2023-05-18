const Course = require("../models/Course");
const Category = require("../models/Category");
const User = require("../models/User");

const fileUploader = require("../utils/fileUploader");

// createCourse
exports.createCourse = async (req, res) => {
    try {
        // fetch data from request body
        const { courseName, courseDescription, whatYouWillLearn, price, category, tags } = req.body;

        // get thumbnail
        const thumbnail = req.files.thumbnailImage;

        // validation
        if (!courseName || !courseDescription || !whatYouWillLearn || !price || !category || !tags || !thumbnail) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        };

        // take instructor id (user who logged-in is Instructor) from req.user
        const instructorId = req.user.id;

        // validation on category -> require for backend testing -> may be get invalid category id from request
        const categoryDetails = await Category.findById({ _id: category });

        if (!categoryDetails) {
            return res.status(403).json({
                success: false,
                message: "Category details not found!"
            })
        };

        // Upload image/thumbnail to cloudinary
        const thumbnailImage = await fileUploader(thumbnail, "Thumbnail");

        // create an entry for new course
        const newCourse = await Course.create({
            courseName,
            courseDescription,
            instructor: instructorId,
            whatYouWillLearn,
            price,
            category,
            tags,
            thumbnail: thumbnailImage.secure_url
        });

        // add the newCourse id to the User Schema -> courses field
        await User.findByIdAndUpdate(
            { _id: instructorId },
            {
                $push: {
                    courses: newCourse._id
                }
            },
            { new: true }
        );

        // add the newCourse id to the Category Schema -> course field
        await Category.findByIdAndUpdate(
            { _id: category },
            {
                $push: {
                    course: newCourse._id
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
            message: "Something went wrong while creating course"
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
            tags: true
        }).populate("instructor").exec();

        res.status(200).json({
            success: true,
            message: "All courses fetched successfully",
            data: allCourses
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching all courses"
        });
    }
};