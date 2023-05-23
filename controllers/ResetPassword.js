const bcrypt = require("bcrypt");

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
                message: `This email: ${email} is not registered with us. Please enter valid email`
            });
        };

        // generate token
        const token = crypto.randomBytes(20).toString("hex");

        // update User by adding token and expiration time
        const updatedDetails = await User.findOneAndUpdate(
            { email },
            { token: token, resetPasswordExpires: Date.now() + 3600000 },
            { new: true }
        );

        // create url
        const url = `https://localhost:3000/update-password/${token}`;

        // send mail containing the url
        // TODO: use mail template
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
        });
    }
};

// resetPassword
exports.resetPassword = async (req, res) => {
    try {
        // fetch data
        const { token, password, confirmPassword } = req.body;

        // validation
        if (!password || !confirmPassword) {
            return res.send(403).json({
                success: false,
                message: "All fields are required, Please try again!"
            })
        };

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "password and confirmPassword must be same, please try again!"
            })
        };

        // get user details from database using token
        const userDetails = await User.findOne({ token });

        // if no entry - invalid token
        if (!userDetails) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            })
        };

        // check for token timeout/expiry
        if (userDetails.resetPasswordExpires < Date.now()) {
            return res.status(403).json({
                success: false,
                message: "Token is expired, Please regenerate the token"
            })
        };

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // update password in database
        await User.findOneAndUpdate(
            { token },
            { password: hashedPassword },
            { new: true }
        )
        // return response
        return res.status(200).json({
            success: true,
            message: "Password reset successful"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while resetting password "
        })
    }
}