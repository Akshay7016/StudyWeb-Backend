const mongoose = require("mongoose");

const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");

// createRatingAndReview
exports.createRatingAndReview = async (req, res) => {
    try {
        // get user id
        const userId = req.user.id;

        // fetch data from request body
        const { rating, review, courseId } = req.body;

        // check whether user is enrolled or not
        const isUserEnrolled = await Course.findOne({
            _id: courseId,
            studentsEnrolled: { $eleMatch: { $eq: userId } }
        });

        if (!isUserEnrolled) {
            return res.status(404).json({
                success: false,
                message: "User is not enrolled into the course"
            });
        }

        // check if user already reviewed the course
        const alreadyReviewed = await RatingAndReview.findOne({
            user: userId,
            course: courseId
        });

        if (alreadyReviewed) {
            return res.status(403).json({
                success: false,
                message: "Course is already reviewed by the user"
            })
        };

        // create rating and review
        const ratingAndReview = await RatingAndReview.create({
            rating,
            review,
            user: userId,
            course: courseId
        });

        // update the course with this rating and review
        const updatedCourse = await Course.findByIdAndUpdate(
            courseId,
            {
                $push: {
                    ratingAndReviews: ratingAndReview._id
                }
            },
            { new: true }
        );

        // return response
        return res.status(200).json({
            success: true,
            message: "Rating and review added for course",
            data: updatedCourse
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating rating and review for course",
            error: error.message
        });
    }
};

// getAverageRating
exports.getAverageRating = async (req, res) => {
    try {
        // get course id
        const { courseId } = req.body;

        // calculate average rating using aggregate function. Aggregate function returns array
        const result = await RatingAndReview.aggregate([
            {
                $match: {
                    course: new mongoose.Types.ObjectId(courseId)
                }
            },
            {
                // if we don't know on which property we want group then specify null
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" }
                }
            }
        ]);

        // return rating
        if (result.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Average rating fetched successfully",
                data: rating[0].averageRating
            });
        };

        // if no rating found for the course
        return res.status(200).json({
            success: true,
            message: "Average rating is 0, No rating has been given till now for the course",
            data: 0
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching average rating and review for course",
            error: error.message
        });
    }
};