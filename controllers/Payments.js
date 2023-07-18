const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();

const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const mailSender = require("../utils/mailSender");
const { courseEnrollmentEmail } = require("../mail/templates/courseEnrollmentEmail");
const { paymentSuccessEmail } = require("../mail/templates/paymentSuccessEmail");

// capture the payment and initiate the razorpay order
exports.capturePayment = async (req, res) => {
    try {
        // get courseId and userID
        const { courses } = req.body;
        const userId = req.user.id;

        if (courses.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide course id"
            })
        };

        let total_amount = 0;

        for (const courseId of courses) {
            // find the course by its id
            const courseDetails = await Course.findById(courseId);

            // If the course is not found, return an error
            if (!courseDetails) {
                return res.status(400).json({
                    success: false,
                    message: `Could not find course`
                });
            };

            // Check if the user is already enrolled in the course
            const uid = new mongoose.Types.ObjectId(userId);
            if (courseDetails.studentsEnrolled.includes(uid)) {
                return res.status(400).json({
                    success: false,
                    message: "Student is already enrolled"
                })
            };

            // Add the price of the course to the total amount
            total_amount += courseDetails.price;
        }

        // create order
        const options = {
            amount: total_amount * 100,
            currency: "INR",
            receipt: Math.random(Date.now()).toString(),
        };

        try {
            // Initiate the payment using Razorpay
            const paymentResponse = await instance.orders.create(options);

            return res.status(200).json({
                success: true,
                message: "Order created successfully",
                data: paymentResponse
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

// verify the payment
exports.verifyPayment = async (req, res) => {
    const razorpay_order_id = req.body?.razorpay_order_id;
    const razorpay_payment_id = req.body?.razorpay_payment_id;
    const razorpay_signature = req.body?.razorpay_signature;
    const courses = req.body?.courses;

    const userId = req.user.id;

    if (
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature ||
        !courses ||
        !userId
    ) {
        return res.status(404).json({
            success: false,
            message: "All fields are required"
        })
    };

    let body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest("hex");

    if (expectedSignature === razorpay_signature) {
        await enrollStudents(courses, userId, res);
        return res.status(200).json({
            success: true,
            message: "Payment Verified"
        })
    };

    return res.status(400).json({
        success: false,
        message: "Payment failed"
    })
};

// enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
    if (!courses || !userId) {
        return res.status(400).json({
            success: false,
            message: "Please provide courses and user"
        })
    };

    for (const courseId of courses) {
        try {
            // Find the course and enroll the student in it
            const enrolledCourse = await Course.findByIdAndUpdate(
                courseId,
                {
                    $push: {
                        studentsEnrolled: userId
                    }
                },
                { new: true }
            );

            if (!enrolledCourse) {
                return res.status(400).json({
                    success: false,
                    message: "Course not found"
                })
            };

            const courseProgress = await CourseProgress.create({
                courseID: courseId,
                userId: userId,
                completedVideos: []
            });

            // Find the student and add the course to their list of enrolled courses
            const enrolledStudent = await User.findByIdAndUpdate(
                userId,
                {
                    $push: {
                        courses: courseId,
                        courseProgress: courseProgress._id
                    }
                },
                { new: true }
            );

            // Send an email notification to the enrolled student
            await mailSender(
                enrolledStudent.email,
                `Successfully enrolled into ${enrolledCourse.courseName}`,
                courseEnrollmentEmail(
                    enrolledCourse.courseName,
                    `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
                )
            )
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong while enrolling student into course",
                error: error.message
            })
        }
    }
}

// Send payment success email
exports.sendPaymentSuccessEmail = async (req, res) => {
    try {
        const { orderId, paymentId, amount } = req.body;
        const userId = req.user.id;

        if (!orderId || !paymentId || !amount || !userId) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        };

        const enrolledStudent = await User.findById(userId);

        await mailSender(
            enrolledStudent.email,
            "Payment Received",
            paymentSuccessEmail(
                `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
                amount / 100,
                orderId,
                paymentId
            )
        );
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Could not send payment successful email",
            error: error.message
        })
    }
};