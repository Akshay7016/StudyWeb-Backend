const express = require("express");
const router = express.Router();

const {
    createCourse,
    getAllCourses,
    getCourseDetails,
    editCourse,
    getFullCourseDetails,
    getInstructorCourses,
    deleteCourse
} = require("../controllers/Course");

const {
    createCategory,
    getAllCategories,
    categoryPageDetails
} = require("../controllers/Category");

const {
    createSection,
    updateSection,
    deleteSection
} = require("../controllers/Section");

const {
    createSubSection,
    updateSubSection,
    deleteSubSection
} = require("../controllers/SubSection");

const {
    createRatingAndReview,
    getAverageRating,
    getAllRatingAndReview
} = require("../controllers/RatingAndReview");

const {
    auth,
    isStudent,
    isInstructor,
    isAdmin
} = require("../middlewares/auth");

// ********************************************************************************************************
//                                      Course routes
// ********************************************************************************************************

// Courses can only be created by Instructors
router.post("/createCourse", auth, isInstructor, createCourse);

// Edit course details
router.put("/editCourse", auth, isInstructor, editCourse)

// Add a section to course
router.post("/addSection", auth, isInstructor, createSection);

// Update a section
router.put("/updateSection", auth, isInstructor, updateSection);

// Delete a section
router.delete("/deleteSection", auth, isInstructor, deleteSection);

// Edit sub section
router.put("/updateSubSection", auth, isInstructor, updateSubSection);

// Delete sub section
router.delete("/deleteSubSection", auth, isInstructor, deleteSubSection);

// Add a sub section to section
router.post("/addSubSection", auth, isInstructor, createSubSection);

// Get all courses under a specific instructor
router.get("/getInstructorCourses", auth, isInstructor, getInstructorCourses);

// Get all registered courses
router.get("/getAllCourses", getAllCourses);

// Get detail of specific course
router.get("/getCourseDetails", getCourseDetails);

// Get details for a specific course with specific user
router.get("/getFullCourseDetails", auth, getFullCourseDetails);

// Delete a course
router.delete("/deleteCourse", auth, isInstructor, deleteCourse);

// ********************************************************************************************************
//                                      Category routes (Only by Admin)
// ********************************************************************************************************

// create category
router.post("/createCategory", auth, isAdmin, createCategory);

// show all categories
router.get("/getAllCategories", getAllCategories);

// get category page details
router.get("/getCategoryPageDetails", categoryPageDetails)

// ********************************************************************************************************
//                                      Rating and Review
// ********************************************************************************************************

// create rating and review
router.post("/createRatingAndReview", auth, isStudent, createRatingAndReview);

// get average rating
router.get("/getAverageRating", getAverageRating);

// get all ratings and reviews
router.get("/getAllRatingAndReview", getAllRatingAndReview);

module.exports = router;