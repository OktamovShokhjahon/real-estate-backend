# Email Notifications for Comments

## Overview

The application now includes automatic email notifications when someone comments on a user's property or tenant review. This feature helps users stay engaged and informed about activity on their posts.

## How It Works

### When Notifications Are Sent

1. **Property Reviews**: When someone comments on a property review, the original author receives an email notification
2. **Tenant Reviews**: When someone comments on a tenant review, the original author receives an email notification

### Notification Conditions

Notifications are only sent when:

- The review author exists and has a verified email address
- The commenter is not the same person as the review author (no self-notifications)
- The review author has not disabled email notifications (`emailNotifications` field is not `false`)

### Email Content

Each notification includes:

- **Subject**: "New comment on your [property/tenant] review from [Commenter Name]"
- **Personalized greeting**: Uses the review author's first name
- **Comment preview**: First 100 characters of the comment (truncated if longer)
- **Commenter name**: Full name of the person who commented
- **Direct link**: Button/link to view the full comment and reply
- **Professional styling**: HTML email with proper formatting

## User Controls

### Notification Preferences

Users can control their email notifications through:

1. **Dashboard Settings**: Visit `/dashboard` and use the notification toggle
2. **API Endpoints**:
   - `GET /user/notifications` - Get current notification settings
   - `PATCH /user/notifications` - Update notification preferences

### Default Behavior

- New users have email notifications enabled by default (`emailNotifications: true`)
- Users can disable notifications at any time
- Disabled notifications can be re-enabled

## Technical Implementation

### Backend Routes

- **Property Comments**: `POST /property/reviews/:id/comments`
- **Tenant Comments**: `POST /tenant/reviews/:id/comments`

### Email Configuration

The email system uses:

- **Service**: Gmail SMTP
- **Configuration**: Environment variables (`EMAIL_USER`, `EMAIL_PASSWORD`)
- **Error Handling**: Graceful failure - comment creation succeeds even if email fails

### Database Schema

User model includes:

```javascript
emailNotifications: {
  type: Boolean,
  default: true,
}
```

## Error Handling

### Email Failures

If email sending fails:

- The error is logged to console
- Comment creation continues normally
- No error is returned to the user
- The system remains functional

### Common Issues

1. **Gmail Authentication**: Requires App Password setup (see EMAIL_SETUP.md)
2. **Network Issues**: Temporary failures are handled gracefully
3. **Invalid Emails**: System validates email addresses before sending

## Testing

### Manual Testing

1. Create a property or tenant review
2. Comment on the review with a different user account
3. Check the review author's email for notification
4. Verify the email contains correct information and styling

### Logging

The system logs:

- When email notifications are sent
- Success confirmations
- Error details for debugging

## Future Enhancements

Potential improvements:

- Email templates customization
- Notification frequency controls
- Push notifications
- Notification history
- Bulk notification preferences
