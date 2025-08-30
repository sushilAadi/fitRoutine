import { NextResponse } from 'next/server';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token_here';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('Webhook verification attempt:', { mode, token, challenge });

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new Response(challenge, { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  console.log('Webhook verification failed');
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

    // Handle different webhook events
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(entry => {
        entry.changes?.forEach(change => {
          if (change.field === 'messages') {
            const { messages, statuses } = change.value;

            // Handle message status updates (delivered, read, failed, etc.)
            if (statuses) {
              statuses.forEach(status => {
                console.log(`Message ${status.id} status: ${status.status}`);
                // You can update your database here with delivery status
              });
            }

            // Handle incoming messages (user replies)
            if (messages) {
              messages.forEach(message => {
                console.log(`Received message from ${message.from}: ${message.text?.body || 'Media message'}`);
                // Handle user replies here if needed
              });
            }
          }
        });
      });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}