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

export const sendMessageReplyEmail = async (email, originalMessage, replyText) => {
    const recipient = [{ email }];

    try {
        // Create the email HTML with the original message and reply
        const emailHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Response to Your Message</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
  <!-- Header -->
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #4CAF50;">
    <tr>
      <td style="padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Response to Your Message</h1>
      </td>
    </tr>
  </table>

  <!-- Content -->
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px;">
        <p>Hello,</p>
        <p>Thank you for contacting us. Here is our response to your inquiry:</p>
        
        <!-- Response box -->
        <table width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0; background-color: #ffffff; border-left: 4px solid #4CAF50;">
          <tr>
            <td style="padding: 15px;">
              <p style="margin: 0;">${replyText}</p>
            </td>
          </tr>
        </table>
        
        <p>For your reference, your original message was:</p>
        
        <!-- Original message box -->
        <table width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0; background-color: #f0f0f0;">
          <tr>
            <td style="padding: 15px;">
              <p style="margin: 0; color: #666; font-style: italic;">${originalMessage}</p>
            </td>
          </tr>
        </table>
        
        <p>If you have any further questions, please don't hesitate to contact us again.</p>
        <p>Best regards,<br>Animal Shelter Team</p>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
        <p style="margin: 5px 0 0 0;">If you need further assistance, please use our contact form on the website.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

        const response = await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: "Response to Your Message - Animal Shelter",
            html: emailHTML,
            category: "Message Reply"
        });

        console.log("Reply email sent successfully", response);
        return true;
    } catch (error) {
        console.error(`Error sending message reply email:`, error);
        throw new Error(`Error sending message reply email: ${error}`);
    }
};