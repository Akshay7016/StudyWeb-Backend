const Category = require("../models/Category");

// createCategory
exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // validation
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        };

        // Add category entry in database
        const categoryDetails = await Category.create({ name, description });

        // return response
        return res.status(200).json({
            success: true,
            message: "Category created successfully",
            data: categoryDetails
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating category",
            error: error.message
        })
    }
};

// getAllCategories
exports.getAllCategories = async (req, res) => {
    try {
        // fetch all categories which contains name and description
        const allCategories = await Category.find({}, { name: true, description: true });

        return res.status(200).json({
            success: true,
            message: "All categories fetched successfully",
            data: allCategories
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching all categories",
            error: error.message
        })
    }
};

// categoryPageDetails
exports.categoryPageDetails = async (req, res) => {
    try {
        // get categoryId
        const { categoryId } = req.body;

        // find courses for specified ID
        const selectedCourses = await Category.findById(categoryId)
            .populate("courses")
            .exec();

        if (!selectedCourses) {
            return res.status(404).json({
                success: false,
                message: "Courses not found with specific category"
            });
        };

        // find courses other than specified ID
        // TODO: error in fetching different courses
        const differentCourses = await Category.findById({ _id: { $ne: categoryId } })
            .populate("courses")
            .exec();

        // TODO: find top selling courses and return in response

        // return response
        return res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            data: {
                selectedCourses,
                differentCourses
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching category page details",
            error: error.message
        })
    }
}