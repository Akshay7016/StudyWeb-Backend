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