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
        await Category.create({ name, description });

        // return response
        return res.status(200).json({
            success: true,
            message: "Category created successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating category"
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
            message: "Something went wrong while fetching all categories"
        })
    }
};

