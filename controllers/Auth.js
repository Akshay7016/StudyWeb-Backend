require("dotenv").config();
const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");

const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate")

// sendOTP
exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // check if user already exists
        const checkUserPresent = await User.findOne({ email });

        // if user already exists then return a response
        if (checkUserPresent) {
            return res.status(401).json({
                success: false,
                message: "User already registered"
            })
        }

        // generate otp
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        // create otp entry in database
        await OTP.create({ email, otp });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while sending otp",
            error: error.message
        })
    }
};

// signUp
exports.signUp = async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, accountType, otp } = req.body;

        // validation
        if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
            return res.status(403).json({
                success: false,
                message: "All fields are required"
            })
        }

        // match password and confirmPassword
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "password and confirmPassword must be same, please try again!"
            })
        }

        // check user already exist or not
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists!"
            })
        }

        // find most recent otp stored for email from OTP model
        const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

        // validate otp
        if (recentOtp.length === 0) {
            return res.status(400).json({
                success: false,
                message: "OTP not found!"
            })
        }

        // check otp present in database and otp entered by user are same
        if (recentOtp[0].otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // FIXME: check why approved use and checking is wrong
        let approved = "";
        approved = approved === "Instructor" ? false : true

        // create Profile entry in database as we need it for additionalDetails field. After that we can refer profile entry to edit additional details.
        const profileDetails = await Profile.create({
            gender: null,
            dateOfBirth: null,
            about: null,
            contactNumber: null
        });

        // add user entry in database
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            accountType,
            approved: approved,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        });

        // TODO: after successful signup send mail to user

        return res.status(200).json({
            success: true,
            user,
            message: "User registration successful!"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User cannot be registered. Please try again.",
            error: error.message
        })
    }
};

// logIn
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // validation
        if (!email || !password) {
            return res.status(403).json({
                success: false,
                message: "All fields are required, Please try again!"
            })
        }

        // check user exist or not
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User is not registered, Please register first"
            })
        }

        // check password and generate JWT token
        if (await bcrypt.compare(password, user.password)) {
            const payload = {
                email: user.email,
                id: user._id,
                accountType: user.accountType
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "24h"
            });

            user.token = token;
            user.password = undefined;

            // create cookie and send response
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true
            };

            return res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: "User logged in successfully!"
            })
        }
        else {
            return res.status(401).json({
                success: false,
                message: "Password is incorrect!"
            })
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Log in failure, Please try again!",
            error: error.message
        })
    }
};

// changePassword
exports.changePassword = async (req, res) => {
    try {
        const { id } = req.user;
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        const userDetails = await User.findById(id);

        // validate old password
        const isPasswordMatch = await bcrypt.compare(oldPassword, userDetails.password);

        if (!isPasswordMatch) {
            // If old password does not match, return a 401 (Unauthorized) error
            return res.status(401).json({
                success: false,
                message: "The password is incorrect"
            });
        }

        // validation
        if (!newPassword || !confirmNewPassword) {
            return res.status(403).json({
                success: false,
                message: "All fields are required, Please try again!"
            })
        };

        // check newPassword and confirmNewPassword are same or not
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({
                success: false,
                message: "newPassword and confirmNewPassword must be same, please try again!"
            })
        };

        // Hashed password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // update password in database
        const updatedDetails = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });

        // send mail - password updated
        await mailSender(
            updatedDetails.email,
            "Password change request successful",
            passwordUpdated(updatedDetails.email, `${updatedDetails.firstName} ${updatedDetails.lastName}`)
        );

        // return response
        return res.status(200).json({
            success: true,
            message: "Password updated successfully!"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating account password",
            error: error.message
        })
    }
};