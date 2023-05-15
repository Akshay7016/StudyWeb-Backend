const mongoose = require("mongoose");

const mailSender = require("../utils/mailSender");

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 5 * 60
    }
});

const sendVerificationMail = async (email, otp) => {
    await mailSender(email, "Verification mail from StudyWeb", otp)
};

// pre middleware
OTPSchema.pre("save", async (next) => {
    await sendVerificationMail(this.email, this.otp);
    next();
})

module.exports = mongoose.model("OTP", OTPSchema);