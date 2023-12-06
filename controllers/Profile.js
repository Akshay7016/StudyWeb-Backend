require("dotenv").config();

const Profile = require("../models/Profile");
const User = require("../models/User");
const Course = require("../models/Course");
const CourseProgress = require("../models/CourseProgress");

const fileUploader = require("../utils/fileUploader");
const { convertSecondsToDuration } = require("../utils/secondToDuration");

// updateProfile
exports.updateProfile = async (req, res) => {
    try {
        // fetch data
        const { firstName, lastName, dateOfBirth, about, gender, contactNumber } = req.body;

        // fetch user id from payload
        const { id } = req.user;

        // validation
        if (!firstName || !lastName || !dateOfBirth || !about || !gender || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        };

        // find profile(additionalDetails) id from user model
        const { additionalDetails } = await User.findById(id);

        // update Profile
        await Profile.findByIdAndUpdate(
            additionalDetails,
            {
                gender,
                dateOfBirth,
                about,
                contactNumber
            },
            { new: true }
        );

        // update user
        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                firstName,
                lastName
            },
            { new: true }
        ).populate("additionalDetails").exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            data: updatedUser
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating profile",
            error: error.message
        });
    }
};

// deleteAccount
exports.deleteAccount = async (req, res) => {
    try {
        // get user id from payload
        const { id } = req.user;

        // validation
        const userDetails = await User.findById(id);

        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: "User not found!"
            })
        };

        // delete user additionalDetails (Profile)
        await Profile.findByIdAndDelete(userDetails.additionalDetails);

        // unenroll user from all enrolled courses
        for (const courseId of userDetails.courses) {
            await Course.findByIdAndUpdate(
                courseId,
                {
                    $pull: {
                        studentsEnrolled: id
                    }
                },
                { new: true }
            )
        };

        // TODO: perform request scheduling (use CRON job to delete account after 5 days)

        // delete user
        await User.findByIdAndDelete(id);

        // return response
        return res.status(200).json({
            success: true,
            message: "User account deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting user account",
            error: error.message
        });
    }
};

// getUserDetails
exports.getUserDetails = async (req, res) => {
    try {
        // fetch user id from payload
        const { id } = req.user;

        // fetch user details from database
        const userDetails = await User.findById(id).populate("additionalDetails").exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "User details fetched successfully",
            data: userDetails
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching user details",
            error: error.message
        });
    }
};

// updateDisplayPicture
exports.updateDisplayPicture = async (req, res) => {
    try {
        // get user id
        const userId = req.user.id;

        // get new display picture
        const displayPicture = req.files.displayPicture;

        // upload image to cloudinary
        const newImage = await fileUploader(
            displayPicture,
            process.env.FOLDER_NAME,
            1000,
            1000
        );

        // update user schema
        const updatedProfile = await User.findByIdAndUpdate(
            userId,
            { image: newImage.secure_url },
            { new: true }
        ).populate("additionalDetails").exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            data: updatedProfile
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating profile picture",
            error: error.message
        });
    }
};

// getEnrolledCourses
exports.getEnrolledCourses = async (req, res) => {
    try {
        // get user id
        const userId = req.user.id;

        // find enrolled courses
        let userDetails = await User.findById(userId)
            .populate({
                path: "courses",
                populate: {
                    path: "courseContent",
                    populate: {
                        path: "subSection"
                    }
                }
            })
            .exec();

        userDetails = userDetails.toObject();
        let subSectionLength = 0;

        for (let i = 0; i < userDetails.courses.length; i++) {
            let totalDurationInSeconds = 0;
            subSectionLength = 0;

            for (let j = 0; j < userDetails.courses[i].courseContent.length; j++) {
                totalDurationInSeconds += userDetails.courses[i].courseContent[j].subSection.reduce((acc, current) => acc + parseInt(current.timeDuration), 0);

                userDetails.courses[i].totalDuration = convertSecondsToDuration(totalDurationInSeconds);

                subSectionLength += userDetails.courses[i].courseContent[j].subSection.length;
            }

            let courseProgressCount = await CourseProgress.findOne({
                courseID: userDetails.courses[i]._id,
                userId: userId
            });

            courseProgressCount = courseProgressCount?.completedVideos.length;

            if (subSectionLength === 0) {
                userDetails.courses[i].progressPercentage = 100
            } else {
                // To make it up to 2 decimal points
                const multiplier = Math.pow(10, 2);
                userDetails.courses[i].progressPercentage = Math.round((courseProgressCount / subSectionLength) * 100 * multiplier) / multiplier;
            }
        };

        // validation
        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find the user`
            })
        };

        // return response
        return res.status(200).json({
            success: true,
            message: "Successfully fetched the courses enrolled by the user",
            data: userDetails.courses
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching enrolled courses",
            error: error.message
        });
    }
};

// instructorDashboard
exports.instructorDashboard = async (req, res) => {
    try {
        // get instructor id
        const instructorId = req.user.id;

        const courseDetails = await Course.find({ instructor: instructorId }).sort({ createdAt: -1 });;

        const courseData = courseDetails.map((course) => {
            const totalStudentsEnrolled = course.studentsEnrolled.length;
            const totalAmountGenerated = totalStudentsEnrolled * course.price;

            // create a new object with the additional fields and return it
            return {
                _id: course._id,
                courseName: course.courseName,
                courseDescription: course.courseDescription,
                thumbnail: course.thumbnail,
                price: course.price,
                totalStudentsEnrolled,
                totalAmountGenerated
            };
        });

        // return response
        return res.status(200).json({
            success: true,
            message: "Instructor stats fetched successfully",
            data: courseData
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching instructor stats data",
            error: error.message
        })
    };
}