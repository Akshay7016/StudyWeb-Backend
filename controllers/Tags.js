const Tag = require("../models/Tag");

// createTag
exports.createTag = async (req, res) => {
    try {
        const { name, description } = req.body;

        // validation
        if (!name || !description) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        };

        // Add tag entry in database
        await Tag.create({ name, description });

        // return response
        return res.status(200).json({
            success: true,
            message: "Tag created successfully",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while creating tag"
        })
    }
};

// getAllTags
exports.getAllTags = async (req, res) => {
    try {
        // fetch all tags which contains name and description
        const allTags = await Tag.find({}, { name: true, description: true });

        return res.status(200).json({
            success: true,
            message: "All tags fetched successfully",
            data: allTags
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong while fetching all tags"
        })
    }
};

