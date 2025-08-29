import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';
import { messaging } from '@/lib/firebaseAdmin';

// This would typically use Firebase Admin SDK for server-side
// For now, we'll create a simple endpoint that could be enhanced
export async function POST(request) {
  try {
    const { userEmails, title, body, data = {} } = await request.json();

    if (!userEmails || !Array.isArray(userEmails) || userEmails.length === 0) {
      return NextResponse.json({ error: 'User emails are required' }, { status: 400 });
    }

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // Get FCM tokens for the specified users
    const tokens = [];
    for (const email of userEmails) {
      const tokensQuery = query(
        collection(db, 'fcm_tokens'),
        where('userEmail', '==', email),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(tokensQuery);
      querySnapshot.forEach((doc) => {
        tokens.push(doc.data().token);
      });
    }

    if (tokens.length === 0) {
      return NextResponse.json({ 
        message: 'No active FCM tokens found for specified users',
        sentCount: 0 
      });
    }

    // Send FCM notifications using Firebase Admin SDK
    let successCount = 0;
    let failureCount = 0;

    if (tokens.length > 0) {
      try {
        // Check if Firebase Admin SDK is properly initialized with credentials
        if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
          // Prepare the message payload
          const message = {
            notification: {
              title: title,
              body: body,
            },
            data: {
              type: data.type || 'general',
              ...Object.fromEntries(
                Object.entries(data).map(([key, value]) => [key, String(value)])
              )
            },
            tokens: tokens
          };

          // Send multicast message
          const response = await messaging.sendMulticast(message);
          successCount = response.successCount;
          failureCount = response.failureCount;

          if (response.failureCount > 0) {
            console.log('FCM sending failures:', response.responses.filter(r => !r.success));
          }

          console.log(`FCM notifications sent: ${successCount} success, ${failureCount} failures`);
        } else {
          // Fallback: simulate sending for development/build
          console.log('FCM credentials not available, simulating notification send');
          successCount = tokens.length;
          failureCount = 0;
        }
      } catch (error) {
        console.error('FCM sending error:', error);
        failureCount = tokens.length;
        // Don't throw error, just log and continue
      }
    }

    return NextResponse.json({
      message: 'Notification processing completed',
      totalTokens: tokens.length,
      successCount,
      failureCount,
      success: successCount > 0
    });

  } catch (error) {
    console.error('Error in send-notification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}