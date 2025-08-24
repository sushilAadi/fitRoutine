import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Validate required environment variables
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error('Missing required Razorpay environment variables');
}

// Initialize Razorpay with validated credentials
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = await request.json();

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Generate unique receipt if not provided (max 40 chars)
    const orderReceipt = receipt || `ord_${Date.now().toString().slice(-8)}_${Math.random().toString(36).substr(2, 6)}`;

    // Create order
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: orderReceipt,
      notes,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });

  } catch (error) {
    // Log detailed error server-side only
    console.error('Error creating Razorpay order:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    // Return generic error message to client
    return NextResponse.json(
      { error: 'Unable to process payment request. Please try again.' },
      { status: 500 }
    );
  }
}