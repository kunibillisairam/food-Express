# Admin Update Notifications - Implementation Guide

## Overview
When administrators update user account details, the system now automatically sends notifications and emails to affected users. This ensures transparency and security.

## Notification Triggers

### 1. **Username Change** 🔔
**Trigger:** Admin changes a user's username  
**Notification Sent:** Push notification + Email  
**Email Contains:**
- Old username
- New username
- Instructions to use new username for login
- Security warning

**Example:**
```
Title: 🔔 Username Updated
Body: Your username has been changed to "newuser123" by an administrator.
```

---

### 2. **Password Reset** 🔐
**Trigger:** Admin resets a user's password  
**Notification Sent:** Push notification + Email  
**Email Contains:**
- New temporary password: `password123`
- Instructions to change password immediately
- Security warning

**Example:**
```
Title: 🔐 Password Reset
Body: Your password has been reset by an administrator. Please check your email for the new password.
```

---

### 3. **Wallet Balance Update** 💰
**Trigger:** Admin credits or debits user's wallet  
**Notification Sent:** Push notification + Email  
**Email Contains:**
- Transaction type (Credit/Debit)
- Amount changed
- Reason for change
- New wallet balance
- Link to transaction history

**Example (Credit):**
```
Title: 💰 Wallet Credit
Body: ₹500 has been credited to your wallet. Reason: Compensation for order delay
```

**Example (Debit):**
```
Title: 💸 Wallet Debit
Body: ₹100 has been debited from your wallet. Reason: Refund adjustment
```

---

## Technical Implementation

### Backend Changes

#### 1. Helper Function: `notifyUserOnAdminUpdate()`
**Location:** `server/server.js` (after `createDefaultAdmin()`)

**Parameters:**
- `user` - User object from database
- `updateType` - Type of update: `'username'`, `'password'`, or `'wallet'`
- `details` - Object containing update-specific details

**Functionality:**
- Sends FCM push notifications to all user devices
- Sends HTML-formatted email to user's registered email
- Handles errors gracefully (won't crash if FCM or email fails)
- Logs all notification attempts

---

#### 2. Updated Endpoints

##### **PUT /api/users/:id** (User Details Update)
**Changes:**
- Fetches original user data before update
- Compares old vs new values
- Sends notification if username changed
- Sends notification if wallet balance changed

**Code Flow:**
```javascript
1. Get original user data
2. Validate and update user
3. If username changed → Send username notification
4. If wallet changed → Send wallet notification
5. Return updated user
```

##### **PUT /api/users/:id/reset-password** (Password Reset)
**Changes:**
- Sends password reset notification after successful reset

**Code Flow:**
```javascript
1. Find user
2. Reset password to "password123"
3. Send password reset notification
4. Return success
```

##### **POST /api/admin/users/:id/transaction** (Wallet Management)
**Changes:**
- Sends wallet notification after credit/debit
- Only sends for wallet and compensation targets (not for credits/XP)

**Code Flow:**
```javascript
1. Find user
2. Apply transaction (credit/debit)
3. Save user
4. If target is wallet → Send wallet notification
5. Return updated user
```

---

## Email Templates

All emails use responsive HTML templates with:
- Gradient headers with emojis
- Clean white content area
- Highlighted important information
- Security warnings
- Professional branding

### Color Schemes:
- **Username Update:** Purple gradient (#667eea → #764ba2)
- **Password Reset:** Pink gradient (#f093fb → #f5576c)
- **Wallet Update:** Blue gradient (#4facfe → #00f2fe)

---

## Push Notification Details

### FCM Message Structure:
```javascript
{
  tokens: [user's FCM tokens],
  notification: {
    title: "🔔 Title",
    body: "Notification message"
  },
  data: {
    type: 'admin_update',
    updateType: 'username|password|wallet',
    timestamp: ISO timestamp
  }
}
```

### Multi-Device Support:
- Sends to all registered user devices
- Uses both `fcmTokens` array and legacy `fcmToken` field
- Filters out invalid tokens
- Logs success/failure counts

---

## Environment Variables Required

For email notifications to work:
```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-specific-password
```

For push notifications:
- Firebase Admin SDK must be initialized
- User must have registered FCM tokens

---

## Testing Instructions

### Test Username Update:
1. Login as admin
2. Go to Users tab
3. Click "Edit" on a user
4. Change username
5. Click "Save"
6. **Expected:** User receives push notification + email

### Test Password Reset:
1. Login as admin
2. Go to Users tab
3. Find a user
4. Click "Reset Password" (if available) or use API directly
5. **Expected:** User receives push notification + email with new password

### Test Wallet Credit:
1. Login as admin
2. Go to Users tab
3. Click "Manage" on a user
4. Enter amount (e.g., 500) and reason (e.g., "Compensation")
5. Click "+ Credit Wallet"
6. **Expected:** User receives push notification + email

### Test Wallet Debit:
1. Same as above but click "- Debit Wallet"
2. **Expected:** User receives push notification + email

---

## Console Logs

All notification attempts are logged:

```
[Admin Update Notification] Sending to <username> for <type>
[FCM] Admin update notification sent: X success, Y failed
[Email] Admin update notification sent to <email>
```

Or if skipped:
```
[FCM Skip] No valid tokens for user: <username>
[Email Skip] No email configured for user: <username>
```

Errors are also logged:
```
[FCM Error] Failed to send admin update notification: <error>
[Email Error] Failed to send admin update notification: <error>
```

---

## Security Considerations

1. **Email Verification:** Emails include security warnings
2. **Password Exposure:** Temporary password sent via email only (not push notification)
3. **Audit Trail:** All transactions logged in user's transaction history
4. **Error Handling:** Notification failures don't block the update operation

---

## Future Enhancements

Potential improvements:
- [ ] Admin can customize notification message
- [ ] User preferences for notification types
- [ ] SMS notifications for critical changes
- [ ] Notification history in user profile
- [ ] Admin dashboard showing notification delivery status

---

## Files Modified

1. **server/server.js**
   - Added `notifyUserOnAdminUpdate()` helper function
   - Updated `PUT /api/users/:id` endpoint
   - Updated `PUT /api/users/:id/reset-password` endpoint
   - Updated `POST /api/admin/users/:id/transaction` endpoint

---

## Troubleshooting

### Notifications not received?
1. Check console logs for errors
2. Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`
3. Verify user has valid email in database
4. Check user has registered FCM tokens
5. Verify Firebase Admin SDK is initialized

### Email not sent?
1. Check Gmail app-specific password is correct
2. Verify "Less secure app access" is enabled (if using regular password)
3. Check email address is valid in user profile
4. Look for email errors in console logs

### Push notification not received?
1. Verify user has granted notification permission
2. Check user has valid FCM tokens in database
3. Verify Firebase Admin SDK is initialized
4. Check device is online and app is installed

---

## API Response Examples

### Successful Update:
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "username": "newusername",
    "email": "user@example.com",
    "walletBalance": 500,
    ...
  }
}
```

### Error Response:
```json
{
  "message": "Username already taken"
}
```

---

## Summary

✅ **Username changes** → Notification + Email  
✅ **Password resets** → Notification + Email  
✅ **Wallet updates** → Notification + Email  
✅ **Multi-device support**  
✅ **Beautiful HTML emails**  
✅ **Graceful error handling**  
✅ **Comprehensive logging**  

The system now provides complete transparency for all admin actions affecting user accounts!
