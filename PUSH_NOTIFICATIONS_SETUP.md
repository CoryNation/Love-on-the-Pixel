# Push Notifications Setup Guide

This guide will help you implement a cost-effective push notification system for your Love on the Pixel app using Firebase Cloud Messaging (FCM) and Supabase.

## 🎯 Features

✅ **Zero Ongoing Costs** - FCM is 100% free, Supabase Edge Functions included in free tier  
✅ **Works When App is Closed** - True mobile push notifications  
✅ **User Control** - Comprehensive notification preferences  
✅ **Frequency Limiting** - Daily or every-time options  
✅ **Rich Notifications** - Icons, actions, deep linking  

## 🚀 Quick Setup

### 1. Firebase Setup (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Add a web app to your project
4. Copy the config values to your `.env.local` file
5. Go to Project Settings > Cloud Messaging
6. Generate a Web Push certificate (VAPID key)
7. Copy the Server key for Supabase

### 2. Environment Variables

Create `.env.local` file with your Firebase values:

```bash
# Copy from firebase-env-template.txt and fill in your values
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
FIREBASE_SERVER_KEY=your_server_key_here
```

### 3. Database Setup

Run the SQL from `database-notification-system.sql` in your Supabase SQL editor.

### 4. Install Dependencies

```bash
npm install firebase
```

### 5. Deploy Edge Function

Deploy the `send-push-notification` function to Supabase:

```bash
supabase functions deploy send-push-notification
```

## 📱 How It Works

### User Flow
1. User opens app → FCM permission requested
2. User sets preferences in Notification Settings
3. FCM token stored in Supabase
4. When events happen → Supabase Edge Function sends FCM notification
5. User receives notification even when app is closed

### Cost Breakdown
- **FCM**: $0/month (unlimited notifications)
- **Supabase Edge Functions**: $0/month (included in free tier)
- **Database Storage**: $0/month (minimal data)
- **Total**: **$0/month**

## 🔧 Integration Points

### Send Notifications When:
- **New Invitation**: `notificationService.sendNotificationToUser(userId, {...})`
- **New Affirmation**: `notificationService.sendNotificationToUser(userId, {...})`
- **Card Treasured**: `notificationService.sendNotificationToUser(userId, {...})`

### Example Usage:

```typescript
import { notificationService } from '@/lib/notificationService';

// Send notification when someone receives a love note
await notificationService.sendNotificationToUser(
  recipientId,
  {
    title: 'New Love Note! 💕',
    body: `${senderName} just sent you an affirmation`,
    icon: '/heart-icon.png',
    tag: 'affirmation-received',
    data: { affirmationId: affirmation.id },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }
);
```

## 🎨 Customization

### Notification Icons
- Place icons in `public/` folder
- Update paths in service worker and Edge Function
- Recommended: 192x192px PNG for best quality

### Notification Actions
- Customize actions in the notification payload
- Handle clicks in the service worker
- Deep link to specific app sections

### Frequency Limits
- Users can choose "every time" or "once daily"
- System automatically enforces limits
- No duplicate notifications within 24 hours

## 🧪 Testing

### Test Notifications
1. Enable notifications in browser
2. Send test notification via Edge Function
3. Check delivery on mobile device
4. Verify frequency limiting works

### Debug Mode
- Check browser console for FCM errors
- Verify FCM token is stored in Supabase
- Test Edge Function in Supabase dashboard

## 🚨 Troubleshooting

### Common Issues

**"FCM not available"**
- Check Firebase config in `.env.local`
- Verify service worker is loaded
- Check browser console for errors

**"Permission denied"**
- User must manually enable notifications
- Check browser notification settings
- Request permission on app start

**"Token not found"**
- Verify FCM token is stored in database
- Check user notification preferences
- Ensure user is authenticated

### Performance Tips
- Store FCM tokens locally for faster access
- Batch notifications when possible
- Use tags to prevent duplicate notifications

## 📊 Monitoring

### Track Success Rates
- Monitor FCM delivery in Firebase Console
- Check Supabase Edge Function logs
- Track user engagement with notifications

### Analytics
- FCM provides delivery analytics
- Supabase logs function execution
- Custom tracking in notification payload

## 🔒 Security

### Data Protection
- FCM tokens are user-specific
- RLS policies protect user data
- Edge Function validates authentication

### Best Practices
- Never expose FCM server key in client code
- Validate all notification payloads
- Rate limit notification sending

## 🎉 Next Steps

1. **Deploy the system** following this guide
2. **Test with real users** to ensure reliability
3. **Monitor performance** and user engagement
4. **Iterate and improve** based on feedback

## 📞 Support

If you encounter issues:
1. Check Firebase Console for FCM errors
2. Review Supabase Edge Function logs
3. Verify environment variables are correct
4. Test with minimal configuration first

---

**Remember**: This system is designed to be cost-effective while providing professional-grade push notifications. FCM handles the heavy lifting, Supabase provides the infrastructure, and you get enterprise-quality notifications at zero ongoing cost! 🚀
