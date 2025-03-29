export const VERIFICATION_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <!-- Simplified header (no gradient) -->
  <table width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="background-color: #4CAF50; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Verify Your Email</h1>
      </td>
    </tr>
  </table>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello,</p>
    <p>Thank you for signing up! Your verification code is:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4CAF50;">{verificationCode}</span>
    </div>
    <p>Enter this code on the verification page to complete your registration.</p>
    <p>This code will expire in 15 minutes for security reasons.</p>
    <p>If you didn't create an account with us, please ignore this email.</p>
    <p>Best regards,<br>Animal Shelter Team</p>
  </div>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_SUCCESS_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <!-- Header (replaced gradient with solid color + table layout) -->
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #4CAF50;">
    <tr>
      <td style="padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset Successful</h1>
      </td>
    </tr>
  </table>

  <!-- Content -->
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px;">
        <p style="margin: 0 0 16px 0;">Hello,</p>
        <p style="margin: 0 0 16px 0;">We're writing to confirm that your password has been successfully reset.</p>
        
        <!-- Checkmark with bulletproof styling -->
        <table cellspacing="0" cellpadding="0" style="margin: 30px auto;">
          <tr>
            <td align="center" style="background-color: #4CAF50; width: 50px; height: 50px; border-radius: 50%; font-size: 30px; color: white;">
              ✓
            </td>
          </tr>
        </table>

        <p style="margin: 0 0 16px 0;">If you did not initiate this password reset, please contact our support team immediately.</p>
        <p style="margin: 0 0 8px 0;">For security reasons, we recommend that you:</p>
        <ul style="margin: 0 0 16px 20px; padding: 0;">
          <li style="margin-bottom: 8px;">Use a strong, unique password</li>
          <li style="margin-bottom: 8px;">Enable two-factor authentication if available</li>
          <li style="margin-bottom: 8px;">Avoid using the same password across multiple sites</li>
        </ul>
        <p style="margin: 0 0 16px 0;">Thank you for helping us keep your account secure.</p>
        <p style="margin: 0;">Best regards,<br>Animal Shelter Team</p>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
        <p style="margin: 0;">This is an automated message, please do not reply to this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const PASSWORD_RESET_REQUEST_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 0;">
  <!-- Header with solid color (gradients often fail in emails) -->
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #4CAF50;">
    <tr>
      <td style="padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Password Reset</h1>
      </td>
    </tr>
  </table>

  <!-- Content -->
  <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f9f9f9; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px;">
        <p>Hello,</p>
        <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
        <p>To reset your password, click the button below:</p>
        
        <!-- Bulletproof button (works even if CSS is blocked) -->
        <table cellspacing="0" cellpadding="0" style="margin: 30px auto;">
          <tr>
            <td align="center" style="border-radius: 5px; background-color: #4CAF50;">
              <a href="{resetURL}" style="display: inline-block; padding: 12px 20px; color: white; text-decoration: none; font-weight: bold;">Reset Password</a>
            </td>
          </tr>
        </table>

        <p>This link will expire in 1 hour for security reasons.</p>
        <p>Best regards,<br>Animal Shelter Team</p>
      </td>
    </tr>
  </table>

  <!-- Footer -->
  <table width="100%" cellspacing="0" cellpadding="0">
    <tr>
      <td style="text-align: center; padding: 20px; color: #888; font-size: 0.8em;">
        <p>This is an automated message, please do not reply to this email.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`;