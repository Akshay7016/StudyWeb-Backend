const Category = require("../models/Category");

const getRandomInt = (max) => {
    return Math.floor(Math.random() * max);
};

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

        // get courses for specified category id
        const selectedCategory = await Category.findById(categoryId)
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews instructor",
            })
            .exec();

        if (!selectedCategory) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        };

        // Handle the case when there are no courses
        if (selectedCategory.courses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No courses found"
            })
        }

        // get courses for other categories
        const categoriesExceptSelected = await Category.find({ _id: { $ne: categoryId } });

        let differentCategory = await Category.findOne(
            categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
        ).populate({
            path: "courses",
            match: { status: "Published" },
            populate: "ratingAndReviews instructor",
        }).exec()


        // get top selling courses across all categories
        const allCategories = await Category.find({})
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: "ratingAndReviews instructor",
            }).exec();

        const allCourses = allCategories.flatMap((category) => category.courses);

        const mostSellingCourses = allCourses
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 10);

        // return response
        return res.status(200).json({
            success: true,
            message: "Courses fetched successfully",
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses
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