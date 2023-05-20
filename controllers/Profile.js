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

// deleteAccount
exports.deleteAccount = async (req, res) => {
    try {
        // get user id from payload
        const { id } = req.user;

        // validation
        const userDetails = await User.findById(id);

        if (!userDetails) {
            return res.status(400).json({
                success: false,
                message: "User not found!"
            })
        };

        // delete user additionalDetails (Profile)
        await Profile.findByIdAndDelete(userDetails.additionalDetails);

        // TODO: unenroll user from all enrolled courses
        // TODO: perform request scheduling (use CRON job to delete account after 5 days)

        // delete user
        await User.findByIdAndDelete(id);

        // return response
        return res.status(200).json({
            success: true,
            message: "User account deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting user account",
            error: error.message
        });
    }
};

// getUserDetails
exports.getUserDetails = async (req, res) => {
    try {
        // fetch user id from payload
        const { id } = req.user;

        // fetch user details from database
        const userDetails = await User.findById(id).populate("additionalDetails").exec();

        // return response
        return res.status(200).json({
            success: true,
            message: "User details fetched successfully",
            data: userDetails
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching user details",
            error: error.message
        });
    }
}