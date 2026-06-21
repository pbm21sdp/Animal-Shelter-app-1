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

export const sendDonationConfirmationEmail = async (email, amount, organizationName) => {
    const recipient = [{ email }];
    const org = organizationName || 'Paws Community Fund';
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#FAF7F4;font-family:'DM Sans',Arial,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#FAF7F4;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellspacing="0" cellpadding="0" style="background:#fff;border:1px solid rgba(45,31,20,0.1);border-radius:6px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#2D1F14;padding:28px 40px;">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:22px;color:#FAF7F4;font-weight:700;">Paws Animal Shelter</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <div style="width:56px;height:56px;border-radius:50%;background:rgba(192,122,74,0.12);display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
            <span style="font-size:28px;">🐾</span>
          </div>
          <h2 style="font-family:Georgia,serif;font-size:22px;color:#2D1F14;text-align:center;margin:0 0 12px;">Thank you for your donation!</h2>
          <p style="color:#6B5144;font-size:15px;line-height:1.6;text-align:center;margin:0 0 28px;">
            Your contribution to <strong>${org}</strong> helps animals find their forever homes.
          </p>
          <table width="100%" cellspacing="0" cellpadding="0" style="background:rgba(192,122,74,0.08);border-left:3px solid #C07A4A;border-radius:4px;margin-bottom:28px;">
            <tr><td style="padding:18px 22px;">
              <div style="font-family:Georgia,serif;font-size:26px;font-weight:700;color:#2D1F14;">${amount} €</div>
              <div style="font-size:13px;color:#6B5144;margin-top:4px;">Donation amount</div>
            </td></tr>
          </table>
          <p style="color:#6B5144;font-size:14px;line-height:1.6;margin:0;">
            Your payment was processed securely through Stripe. No further action is required on your part.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(45,31,20,0.08);text-align:center;">
          <p style="margin:0;font-size:12px;color:#A89080;">This is an automated message from Paws Animal Shelter. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
        await mailtrapClient.send({
            from: sender,
            to: recipient,
            subject: `Donation confirmed – ${amount} € to ${org}`,
            html,
            category: 'Donation Confirmation',
        });
        console.log('Donation confirmation email sent to', email);
    } catch (error) {
        console.error('Error sending donation confirmation email:', error);
    }
};