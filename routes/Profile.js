const express = require("express");
const router = express.Router();

const { auth } = require("../middlewares/auth");

const {
    deleteAccount,
    updateProfile,
    getUserDetails,
    updateDisplayPicture,
    getEnrolledCourses
} = require("../controllers/Profile");

// ********************************************************************************************************
//                                      Profile routes
// ********************************************************************************************************

// Delete user account
router.delete("/deleteProfile", auth, deleteAccount);

// update profile
router.put("/updateProfile", auth, updateProfile);

// get user details
router.get("/getUserDetails", auth, getUserDetails);

// get enrolled courses
router.get("/getEnrolledCourses", auth, getEnrolledCourses);

// update display picture
router.put("/updateDisplayPicture", auth, updateDisplayPicture);

module.exports = router;