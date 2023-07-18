const express = require("express");
const router = express.Router();

const {
    capturePayment,
    verifyPayment
} = require("../controllers/Payments");

const {
    auth,
    isStudent
} = require("../middlewares/auth");

// Route for capture/create order
router.post("/capturePayment", auth, isStudent, capturePayment);

// Route for verify signature
router.post("/verifyPayment", auth, isStudent, verifyPayment);

module.exports = router;