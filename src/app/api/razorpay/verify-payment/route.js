import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_data,
      transaction_id,
      amount
    } = await request.json();

    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Payment verification request:', {
        amount,
        amountType: typeof amount,
        transaction_id,
        razorpay_payment_id: razorpay_payment_id?.substring(0, 10) + '...'
      });
    }

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification data' },
        { status: 400 }
      );
    }

    // Validate data format and sanitize inputs
    const sanitizedOrderId = String(razorpay_order_id).trim();
    const sanitizedPaymentId = String(razorpay_payment_id).trim();
    const sanitizedSignature = String(razorpay_signature).trim();

    // Validate Razorpay ID format (basic validation)
    const razorpayIdPattern = /^[a-zA-Z0-9_]+$/;
    if (!razorpayIdPattern.test(sanitizedOrderId) || 
        !razorpayIdPattern.test(sanitizedPaymentId) || 
        !sanitizedSignature) {
      return NextResponse.json(
        { error: 'Invalid payment verification data format' },
        { status: 400 }
      );
    }

    // Validate amount is positive number (convert string to number if needed)
    if (amount !== undefined && amount !== null) {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (typeof numAmount !== 'number' || isNaN(numAmount) || numAmount <= 0) {
        console.error('Amount validation failed:', { 
          amount, 
          amountType: typeof amount, 
          numAmount, 
          numAmountType: typeof numAmount 
        });
        return NextResponse.json(
          { error: `Invalid amount value: ${amount} (type: ${typeof amount})` },
          { status: 400 }
        );
      }
    }

    // Verify signature using sanitized values
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = sanitizedOrderId + '|' + sanitizedPaymentId;
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === sanitizedSignature;

    if (!isAuthentic) {
      return NextResponse.json(
        { error: 'Payment verification failed', verified: false },
        { status: 400 }
      );
    }

    // Payment is verified, save to database
    const finalAmount = amount ? (typeof amount === 'string' ? parseFloat(amount) : amount) : 0;
    const paymentData = {
      userId: user_data?.userIdCl || 'N/A',
      userName: user_data?.userName || 'N/A',
      userEmail: user_data?.userEmail || 'N/A',
      transactionId: transaction_id || 'N/A',
      amount: finalAmount,
      currency: 'INR',
      status: 'verified',
      razorpayPaymentId: sanitizedPaymentId,
      razorpayOrderId: sanitizedOrderId,
      razorpaySignature: sanitizedSignature,
      timestamp: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    };

    // Save to Firebase
    await setDoc(doc(db, 'payments', sanitizedPaymentId), paymentData);

    return NextResponse.json({
      verified: true,
      payment_id: sanitizedPaymentId,
      order_id: sanitizedOrderId,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    // Log detailed error server-side only
    console.error('Payment verification error:', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      paymentId: razorpay_payment_id || 'unknown'
    });
    
    // Return generic error message to client
    return NextResponse.json(
      { error: 'Payment verification failed. Please contact support.', verified: false },
      { status: 500 }
    );
  }
}