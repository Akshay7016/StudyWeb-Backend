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
            studentsEnrolled: { $elemMatch: { $eq: userId } }
        });

        if (!isUserEnrolled) {
            return res.status(404).json({
                success: false,
                message: "You are not enrolled into the course"
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
                message: "You have already added Rating and Reviews"
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
        await Course.findByIdAndUpdate(
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
            message: "Rating and review added to the course",
            data: ratingAndReview
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

// getAllRatingAndReview
exports.getAllRatingAndReview = async (req, res) => {
    try {
        const allRatingAndReviews = await RatingAndReview.find({})
            .sort({ rating: "desc" })
            .populate({
                path: "user",
                select: "firstName lastName email image" // as we are using {firstName:true}, it is also same with different syntax
            })
            .populate({
                path: "course",
                select: "courseName"
            })
            .exec();

        return res.status(200).json({
            success: true,
            message: "All ratings and reviews fetched successfully",
            data: allRatingAndReviews
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching all ratings and reviews",
            error: error.message
        });
    }
};