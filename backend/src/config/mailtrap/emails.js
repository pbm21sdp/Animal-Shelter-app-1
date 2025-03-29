import {mailtrapClient, sender} from "./mailtrap.config.js";
import {
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE,
    VERIFICATION_EMAIL_TEMPLATE
} from "./emailTemplate.js";
import {response} from "express";

export const sendVerficationEmail = async (email, verificationToken) => {

    const recipient = [{email}]

    try{
        const response = await mailtrapClient.send({
            from:sender,
            to: recipient,
            subject:"Verify your email",
            html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}",verificationToken),
            category: "Email Verification"
        })

        console.log("Email sent successufly", response)
    }catch (error){
        console.error(`Error sending verification`, error);
        throw new Error(`Error sending verification email: ${error}`)
    }
};

export const sendWelcomeEmail = async (email, name) => {

    const recipicent = [{ email }];

    try{

        await mailtrapClient.send({
            from: sender,
            to: recipicent,
            template_uuid: "2f891c23-4e23-403e-8cef-9db2b172ca18",
            template_variables: {
                "company_info_name": "Animal Shelter",
                "name": name,
            },

        });

        console.log("Welcome email sent successfully", response);

    } catch (error){

    }


};

export const sendPasswordResetEmail = async (email, resetURL) => {

    const recipient = [{ email }];

    try{
        const response = await mailtrapClient.send({
            from:sender,
            to:recipient,
            subject:"Reset your password",
            html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category:"Password Reset",
        })


    } catch (error) {
        console.log(`Error sending password reset email`, error);
        throw new Error(`Error sending password reset email: ${error}`);
    }
}

export const sendResetSuccessEmail = async (email) => {

    const recipient = [{email}];

    try{
        const response = mailtrapClient.send({
            from:sender,
            to:recipient,
            subject:"Password reset successful",
            html: PASSWORD_RESET_SUCCESS_TEMPLATE,
            category: "Password Reset"
        })

        console.log("Password reset email sent successfully", response);
    }catch (error) {
        console.error(`Error sending password reset success email`, error);
        throw new Error(`Error sending password reset success email: ${error}`);
    }
}