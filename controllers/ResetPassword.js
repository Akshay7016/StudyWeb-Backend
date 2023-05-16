const User = require("../models/User");
const mailSender = require("../utils/mailSender");

// resetPasswordToken
exports.resetPasswordToken = async (req, res) => {
    try {
        // fetch email from request body
        const { email } = req.body;

        // email validation and check user for this email
        if (!email) {
            return res.status(403).json({
                success: false,
                message: "Email is required"
            });
        };

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Your email is not registered with us"
            });
        };

        // generate token
        const token = crypto.randomUUID();

        // update User by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            { email },
            { token: token, resetPasswordExpires: Date.now() + 5 * 60 * 1000 },
            { new: true }
        );

        // create url
        const url = `https://localhost:3000/update-password/${token}`;

        // send mail containing the url
        await mailSender(
            email,
            "Password Reset Link",
            `Password reset link: ${url}`
        );

        // return response
        return res.status(200).json({
            success: true,
            message: "Email sent successfully, Please check email and update password"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while sending password reset mail"
        })
    }
};

// resetPassword