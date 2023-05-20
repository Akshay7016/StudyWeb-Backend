const Profile = require("../models/Profile");
const User = require("../models/User");

// updateProfile
exports.updateProfile = async (req, res) => {
    try {
        // fetch data
        const { dateOfBirth = "", about = "", gender, contactNumber } = req.body;

        // fetch user id from payload
        const { id } = req.user;

        // validation
        if (!gender || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        };

        // find profile(additionalDetails) id from user model
        const { additionalDetails } = await User.findById(id);

        // update Profile
        const updatedProfile = await Profile.findByIdAndUpdate(
            additionalDetails,
            {
                gender,
                dateOfBirth,
                about,
                contactNumber
            },
            { new: true }
        );

        // return response
        return res.status(200).json({
            success: true,
            message: "User profile updated successfully",
            data: updatedProfile
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating profile",
            error: error.message
        });
    }
};