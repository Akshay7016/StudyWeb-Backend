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

// verifySignature
exports.verifySignature = async (req, res) => {

    // webhook secret stored at backend
    const webhookSecret = "12345678";

    // get webhook secret from Razorpay
    const signature = req.headers("x-razorpay-signature");

    // convert BE webhook secret to encrypted form to compare with signature
    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    // now compare signature and digest, if equal then payment is authorized. Then find the course and enroll student in that course
    if (digest === signature) {
        // fetch courseId and userId from notes. As this call is coming from Razorpay to Backend, so it does not have any courseId and userId. But we have stored it in notes while order creation.  
        const { courseId, userId } = req.body.payload.payment.entity.notes;

        try {
            // find the course and enroll student in that course
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
                return res.status(500).json({
                    success: false,
                    message: "Course not found"
                })
            };

            // find the student and add the course into the courses list
            const enrolledStudent = await User.findByIdAndUpdate(
                userId,
                {
                    $push: {
                        courses: courseId
                    }
                },
                { new: true }
            );

            // now send the course enrollment mail to user
            await mailSender(
                enrolledStudent.email,
                "Congratulations, You are enrolled into new StudyWeb course",
                courseEnrollmentEmail(
                    enrolledCourse.courseName,
                    `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
                )
            );

            // return response
            return res.status(200).json({
                success: true,
                message: "Signature verified and course added"
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Something went wrong while enrolling student",
                error: error.message
            });
        }
    } else {
        return res.status(400).json({
            success: false,
            message: "Payment is not authorized",
            error: error.message
        });
    }
};