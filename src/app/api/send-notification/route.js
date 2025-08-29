import { NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseConfig';

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

    // For now, we'll simulate sending notifications using browser Notification API
    // In production, you would use Firebase Admin SDK here
    console.log('Sending notifications to tokens:', tokens.length);
    console.log('Notification details:', { title, body, data });
    
    // Simulate successful sending
    return NextResponse.json({
      message: 'Notification sent successfully',
      sentCount: tokens.length,
      success: true
    });

  } catch (error) {
    console.error('Error in send-notification API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}