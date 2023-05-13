require("dotenv").config();
const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        await transporter.sendMail({
            from: "StudyWeb",
            to: email,
            subject: title,
            html: body
        });

    } catch (error) {
        console.log("Error occur while sending mail: ", error.message);
    }
};

module.exports = mailSender;
