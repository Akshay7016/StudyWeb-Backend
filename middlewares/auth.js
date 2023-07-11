require("dotenv").config();
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// auth
exports.auth = async (req, res, next) => {
    try {
        const token = req.body.token || req.cookies.token || req.header("Authorization").replace("Bearer ", "");

        if (!token || token === undefined) {
            return res.status(401).json({
                success: false,
                message: "Token is missing!"
            })
        }

        // Verify token
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decode;
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Token is expired, Please login again"
            })
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Something went wrong while verifying the token"
        })
    }
};

// isStudent
exports.isStudent = async (req, res, next) => {
    try {
        const { accountType } = req.user;

        if (accountType !== "Student") {
            return res.status(401).json({
                success: false,
                message: "This is protected route for Students only "
            })
        };

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role cannot be verified, Please try again"
        })
    }
};

// isInstructor
exports.isInstructor = async (req, res, next) => {
    try {
        const { accountType } = req.user;

        if (accountType !== "Instructor") {
            return res.status(401).json({
                success: false,
                message: "This is protected route for Instructors only "
            })
        };

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role cannot be verified, Please try again"
        })
    }
};

// isAdmin
exports.isAdmin = async (req, res, next) => {
    try {
        const { accountType } = req.user;

        if (accountType !== "Admin") {
            return res.status(401).json({
                success: false,
                message: "This is protected route for Admins only "
            })
        };

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "User role cannot be verified, Please try again"
        })
    }
};