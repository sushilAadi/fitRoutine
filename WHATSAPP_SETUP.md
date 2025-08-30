# WhatsApp Business Cloud API Setup Guide

## Overview
This guide will help you set up WhatsApp Business Cloud API for sending notifications to users and admins without requiring formal business registration or GST.

## Prerequisites
- ✅ Facebook account (which you have)
- ✅ WhatsApp number (which you have)
- ✅ WhatsApp Business app installed (which you have)
- ✅ Vercel deployment (which you have)
- ❌ NO business registration required
- ❌ NO GST required

## Step-by-Step Setup

### Step 1: Create Meta Business Account
1. Go to [business.facebook.com](https://business.facebook.com)
2. Click "Create Account"
3. Choose "Create a Business Account"
4. Fill in details:
   - **Business Name**: Your app name (e.g., "FitApp Notifications")
   - **Your Name**: Your personal name
   - **Business Email**: Your email address
5. Verify your email
6. **Important**: You can use personal details - Meta allows individual developers

### Step 2: Access Meta for Developers
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Login with your Facebook account
3. Click "My Apps" → "Create App"
4. Choose "Business" as app type
5. Fill app details:
   - **App Name**: "FitApp WhatsApp Integration"
   - **Contact Email**: Your email
   - **Business Account**: Select the one you created in Step 1

### Step 3: Add WhatsApp Product
1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set Up"
3. You'll see WhatsApp Business Platform setup page

### Step 4: Phone Number Setup
1. In WhatsApp setup, you'll see "Phone Numbers"
2. You have two options:
   
   **Option A: Use Test Number (Recommended for beginners)**
   - Meta provides a test phone number
   - Can send messages to up to 5 verified numbers
   - Good for development and testing
   
   **Option B: Add Your Own Number**
   - Use your personal WhatsApp Business number
   - Need to verify ownership
   - Better for production

3. For testing, choose Option A first

### Step 5: Get Access Token and Phone Number ID
1. In WhatsApp Business Platform:
   - Note down your **Phone Number ID**
   - Generate a **temporary access token** (valid for 24 hours)
   - Later you'll create a permanent token

### Step 6: Test API Connection
1. Use Meta's API explorer or curl to test:
```bash
curl -X POST \
  https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages \
  -H 'Authorization: Bearer {ACCESS_TOKEN}' \
  -H 'Content-Type: application/json' \
  -d '{
    "messaging_product": "whatsapp",
    "to": "YOUR_WHATSAPP_NUMBER_WITH_COUNTRY_CODE",
    "type": "text",
    "text": {
      "body": "Hello from your app!"
    }
  }'
```

### Step 7: Create Message Templates (Important!)
WhatsApp requires pre-approved templates for business messaging:

1. Go to WhatsApp Manager
2. Click "Message Templates"
3. Create templates like:
   - **Welcome Message**: "Hello {{1}}, welcome to FitApp!"
   - **Order Confirmation**: "Your order #{{1}} has been confirmed"
   - **Admin Alert**: "System alert: {{1}}"

4. Wait for approval (usually 24-48 hours)

### Step 8: Set Up Webhooks (For Vercel)
1. In your Vercel app, create webhook endpoint:
   - Create `/api/whatsapp-webhook.js`
   - This will receive delivery status and user replies

2. In Meta dashboard:
   - Go to WhatsApp → Configuration
   - Set Webhook URL: `https://your-app.vercel.app/api/whatsapp-webhook`
   - Set Verify Token: Create a random string

### Step 9: Generate Permanent Access Token
1. Go to App Settings → Basic
2. Note your **App ID** and **App Secret**
3. Create a system user:
   - Go to Business Settings → System Users
   - Create new system user
   - Assign WhatsApp permissions
   - Generate permanent token

### Step 10: Environment Variables for Vercel
Add these to your Vercel environment variables:
```
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_webhook_verify_token
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
```

## Important Notes

### Free Tier Limits
- **1,000 conversations per month** (conversation = 24-hour window)
- After free tier: ~$0.005-0.009 per message (very cheap)
- No setup or monthly fees

### Message Types Allowed
- **Template Messages**: Pre-approved templates only
- **Session Messages**: Free-form replies within 24 hours of user message
- **Service Messages**: Order confirmations, updates, etc.

### Compliance Tips
- Don't spam users
- Always provide opt-out mechanism
- Use templates for marketing messages
- Keep session messages relevant

## Verification Requirements

### For Personal Use (Your Case)
- **No business documents needed**
- **No GST required**
- Use personal name and email
- Meta allows individual developers

### If Asked for Business Verification Later
- You can skip initially
- Only required for high-volume usage
- Can verify later when scaling

## Common Issues & Solutions

### Issue: Phone Number Not Verified
- **Solution**: Make sure you own the WhatsApp Business number
- Use the verification process in Meta Business Manager

### Issue: Templates Rejected
- **Solution**: Follow WhatsApp template guidelines
- Avoid promotional language in non-marketing templates
- Use proper placeholders

### Issue: Messages Not Delivering
- **Solution**: Check if using approved templates
- Verify recipient number format (+country_code)
- Check webhook for error messages

## Enrollment Notification Integration

### Current Issue
The existing Google Cloud FCM notifications are not working reliably. Users and mentors are not receiving enrollment notifications consistently.

### WhatsApp Integration for Enrollment Notifications
When a user enrolls with a mentor and completes payment, the system should:
1. **Admin Notification**: Send WhatsApp message to admin(s) about new enrollment with payment details
2. **Mentor Notification**: Send WhatsApp message to mentor about their new student

### Required Message Templates for Enrollment
Create these templates in WhatsApp Manager using **UTILITY > Custom** category:

1. **Admin Enrollment Alert**
   - **Name**: `admin_enrollment_alert`
   - **Category**: Utility > Custom (Send messages about an existing order or account)
   - **Template**: `💰 New Enrollment Alert! {{1}} has enrolled with mentor {{2}}. Payment of ₹{{3}} received. Please review and approve the enrollment.`

2. **Mentor New Student**
   - **Name**: `mentor_new_student`  
   - **Category**: Utility > Custom (Send messages about an existing order or account)
   - **Template**: `🎉 Congratulations! {{1}} has enrolled for your training program. Payment of ₹{{2}} completed. Welcome your new student and start their fitness journey!`

### Why Utility Category?
- Enrollment notifications are about existing accounts/services
- Payment amount is informational, not a transaction
- Perfect for order confirmations and service updates

### Implementation Steps
1. Create message templates in WhatsApp Manager
2. Wait for template approval (24-48 hours)
3. Create `/api/whatsapp-webhook.js` endpoint
4. Replace `sendEnrollmentNotifications` function to use WhatsApp API instead of FCM
5. Update environment variables with WhatsApp credentials
6. Test with real enrollment flow

## Next Steps After Setup
1. Test with your own number first
2. Create templates for enrollment notifications (see above)
3. Implement WhatsApp notification service to replace FCM
4. Set up proper error handling and fallback logic
5. Monitor usage in Meta Business Manager

## Cost Planning
- Start with free tier (1,000 conversations/month)
- Scale gradually - costs are very low
- Monitor usage in Meta dashboard
- Set up billing alerts

## Support Resources
- [WhatsApp Business Platform Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [WhatsApp Business API Status](https://developers.facebook.com/status/)

---

**Remember**: You don't need formal business registration for development and small-scale usage. Meta allows individual developers to use the platform for legitimate app notifications.