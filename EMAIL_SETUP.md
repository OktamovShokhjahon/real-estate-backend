# Email Setup Instructions

## Gmail Authentication Issue

The error you're seeing is because Gmail requires an "Application-specific password" for SMTP authentication, not your regular Gmail password.

## How to Fix This

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to Security
3. Enable 2-Step Verification if not already enabled

### Step 2: Generate an App Password

1. Go to Google Account settings > Security
2. Find "App passwords" (you'll only see this if 2FA is enabled)
3. Click on "App passwords"
4. Select "Mail" as the app
5. Click "Generate"
6. Copy the 16-character password that appears

### Step 3: Set Environment Variables

Create a `.env` file in the backend directory with:

```
EMAIL_USER=selfteachuz@gmail.com
EMAIL_PASSWORD=your_16_character_app_password_here
```

### Step 4: Restart Your Server

After setting the environment variables, restart your Node.js server.

## Alternative Solutions

### Option 1: Use a Different Email Service

You can modify `backend/utils/email.js` to use a different email service like:

- SendGrid
- Mailgun
- AWS SES

### Option 2: Use Gmail OAuth2

For production, consider using Gmail OAuth2 instead of app passwords.

## Testing

To test if the email setup works, you can add a test endpoint to your server:

```javascript
app.get("/api/test-email", async (req, res) => {
  try {
    await sendEmail({
      to: "test@example.com",
      subject: "Test Email",
      text: "This is a test email",
      html: "<h1>Test Email</h1><p>This is a test email</p>",
    });
    res.json({ message: "Email sent successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Security Note

- Never commit your `.env` file to version control
- The `.env` file should be in your `.gitignore`
- App passwords are more secure than regular passwords for this use case
