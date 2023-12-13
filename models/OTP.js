const mongoose = require("mongoose");

const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate")

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
        expires: 5 * 60 // The document will be automatically deleted after 5 minutes of its creation time
    }
});

const sendVerificationMail = async (email, otp) => {
    await mailSender(email, "Verification OTP for Signup", emailTemplate(otp))
};

// pre middleware
OTPSchema.pre("save", async function (next) {
    // Only send an email when a new document is created
    if (this.isNew) {
        // await sendVerificationMail(this.email, this.otp);
    }
    next();
})

module.exports = mongoose.model("OTP", OTPSchema);