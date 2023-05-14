const otpGenerator = require("otp-generator");

const User = require("../models/User");
const OTP = require("../models/OTP");

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

        res.status(200).json({
            success: true,
            message: "OTP sent successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong while sending otp: " + error.message
        })
    }
}

// signUp

// logIn

// changePassword