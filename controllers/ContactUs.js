const { contactUsEmail } = require("../mail/templates/contactFormEmail");
const { contactFormResponse } = require("../mail/templates/ContactFormResponse");
const mailSender = require("../utils/mailSender");

exports.contactUsController = async (req, res) => {
    const { email, firstName, lastName, message, countryCode, phoneNumber } = req.body;

    try {
        // Send mail to user
        await mailSender(
            email,
            "Your response sent successfully",
            contactUsEmail(email, firstName, lastName, message, phoneNumber, countryCode)
        );

        // send mail to product owner
        await mailSender(
            "studyweb.contact@gmail.com",
            "Help require for our precious customer",
            contactFormResponse(email, firstName, lastName, message, phoneNumber, countryCode)
        );

        return res.status(200).json({
            success: true,
            message: "Mail sent successfully"
        });
    } catch (error) {
        return res.status(501).json({
            success: false,
            message: "Something went wrong...",
            error: error.message
        })
    }
};