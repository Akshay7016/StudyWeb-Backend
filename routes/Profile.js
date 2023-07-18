const express = require("express");
const router = express.Router();

const { auth, isInstructor } = require("../middlewares/auth");

const {
    deleteAccount,
    updateProfile,
    getUserDetails,
    updateDisplayPicture,
    getEnrolledCourses,
    instructorDashboard
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

// get instructor dashboard stats
router.get("/instructorDashboard", auth, isInstructor, instructorDashboard);

module.exports = router;