require("dotenv").config();
const mongoose = require("mongoose");

const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedToplogy: true
        });

        console.log("Database connection successful");
    } catch (error) {
        console.log("Error in database connection: ", error.message);
        process.exit(1);
    }
};

module.exports = dbConnect;