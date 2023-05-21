const mongoose = require("mongoose");

const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");

// capture the payment and initiate the razorpay order
exports.capturePayment = async (req, res) => {
    try {
        // get courseId and userID
        const { courseId } = req.body;
        const userId = req.user.id;

        // validation
        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "CourseId is required"
            });
        };

        // courseDetail validation
        const courseDetails = await Course.findById(courseId);

        if (!courseDetails) {
            return res.status(400).json({
                success: false,
                message: `Could not find course with Id: ${courseId}`
            });
        };

        // check whether user already enrolled for that course
        const uid = new mongoose.Types.ObjectId(userId);  // as our userID is in String format, so convert it into ObjectId

        if (courseDetails.studentsEnrolled.includes(uid)) {
            return res.status(403).json({
                success: false,
                message: "Student already enrolled into the course"
            });
        };

        // create order
        const options = {
            amount: courseDetails.price * 100,
            currency: "INR",
            receipt: Math.random(Date.now()).toString(),
            notes: {
                courseId,
                userId
            }
        };

        try {
            const paymentResponse = await instance.orders.create(options);

            return res.status(200).json({
                success: true,
                message: "Order created successfully",
                data: {
                    courseName: courseDetails.courseName,
                    courseDescription: courseDetails.courseDescription,
                    thumbnail: courseDetails.thumbnail,
                    orderId: paymentResponse.id,
                    currency: paymentResponse.currency,
                    amount: paymentResponse.amount
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Could not initiate order",
                error: error.message
            })
        };
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating an order",
            error: error.message
        });
    }
};