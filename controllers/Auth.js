const otpGenerator = require("otp-generator");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const OTP = require("../models/OTP");
const Profile = require("../models/Profile");

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
        // TODO: check js library which generates unique otp always
        let otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });

        // check unique otp or not
        // Because same otp can be generated for other user previously
        let result = await OTP.findOne({ otp });

        // if generated otp is not unique then generate new otp
        while (result) {
            otp = otpGenerator.generate(6, {
                upperCaseAlphabets: false,
                lowerCaseAlphabets: false,
                specialChars: false
            });

            result = await OTP.findOne({ otp });
        }

        // create otp entry in database
        await OTP.create({ email, otp });

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while sending otp: " + error.message
        })
    }
}

// signUp
exports.signUp = async (req, res) => {
    try {
        // TODO: confirmPassword and contactNumber fields are not present in User model
        const { firstName, lastName, email, password, confirmPassword, accountType, contactNumber, otp } = req.body;

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
        if (recentOtp.otp.length === 0) {
            return res.status(400).json({
                success: false,
                message: "OTP not found!"
            })
        }

        if (recentOtp.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

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
            contactNumber,
            password: hashedPassword,
            accountType,
            additionalDetails: profileDetails._id,
            image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
        })

        return res.status(200).json({
            success: true,
            user,
            message: "User registration successful!"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User cannot be registered. Please try again." + error.message
        })
    }
}

// logIn

// changePassword