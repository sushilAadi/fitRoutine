"use client";
import React, { useContext, useState } from "react";
import { GlobalContext } from "@/context/GloablContext";
import { loadScript } from "@/utils/razorpayUtils";
import toast from "react-hot-toast";

const SecurePaymentComponent = ({ 
  onSuccess, 
  onFailure, 
  transactionId, 
  amount, 
  currency = "INR",
  description = "Payment",
  buttonText,
  buttonClassName,
  disabled = false
}) => {
  const { userDetailData, userId } = useContext(GlobalContext);
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrder = async (amount, currency) => {
    try {
      const response = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          receipt: `ord_${transactionId?.toString().slice(-8) || 'tx'}_${Date.now().toString().slice(-6)}`,
          notes: {
            transaction_id: transactionId,
            user_id: userId,
          }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create order');
      }

      return data;
    } catch (error) {
      // Log non-sensitive error information only
      if (process.env.NODE_ENV === 'development') {
        console.error('Order creation failed:', error.message);
      }
      throw error;
    }
  };

  const verifyPayment = async (paymentData) => {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: paymentData.razorpay_order_id,
          razorpay_payment_id: paymentData.razorpay_payment_id,
          razorpay_signature: paymentData.razorpay_signature,
          user_data: userDetailData,
          transaction_id: transactionId,
          amount: Number(amount), // Ensure amount is a number
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.verified) {
        throw new Error(data.error || 'Payment verification failed');
      }

      return data;
    } catch (error) {
      // Log non-sensitive error information only
      if (process.env.NODE_ENV === 'development') {
        console.error('Payment verification failed:', error.message);
      }
      throw error;
    }
  };

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      toast.error("Invalid payment amount");
      return;
    }

    if (isNaN(Number(amount))) {
      toast.error("Payment amount must be a valid number");
      return;
    }

    if (!userDetailData?.userName || !userDetailData?.userEmail) {
      toast.error("User information is incomplete");
      return;
    }


    setIsProcessing(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load");
      }

      // Create order
      const orderData = await createOrder(amount, currency);

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Need FIT AI",
        description: description,
        image: "https://your-logo-url.com/logo.png",
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // Verify payment on server
            const verificationResult = await verifyPayment(response);
            
            // Payment verified successfully
            toast.success("Payment verified successfully!");
            
            // Call success callback with verification data
            if (onSuccess) {
              onSuccess({
                ...response,
                verified: true,
                ...verificationResult
              });
            }
          } catch (verificationError) {
            // Log non-sensitive error information only
            if (process.env.NODE_ENV === 'development') {
              console.error("Payment verification error:", verificationError.message);
            }
            toast.error("Payment verification failed. Please contact support.");
            
            // Call failure callback
            if (onFailure) {
              onFailure({
                error: verificationError.message,
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id
              });
            }
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast.error("Payment cancelled");
          }
        },
        prefill: {
          name: userDetailData.userName,
          email: userDetailData.userEmail,
          contact: userDetailData.userPhone || "",
        },
        theme: {
          color: "#F37254",
        },
        timeout: 300, // 5 minutes timeout
        retry: {
          enabled: true,
          max_count: 3
        }
      };

      // Open Razorpay checkout
      const paymentObject = new window.Razorpay(options);
      
      paymentObject.on('payment.failed', function (response) {
        // Log non-sensitive error information only
        if (process.env.NODE_ENV === 'development') {
          console.error('Payment failed:', response.error?.code);
        }
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setIsProcessing(false);
        
        if (onFailure) {
          onFailure({
            error: response.error.description,
            code: response.error.code,
            metadata: response.error.metadata
          });
        }
      });

      paymentObject.open();

    } catch (error) {
      // Log non-sensitive error information only
      if (process.env.NODE_ENV === 'development') {
        console.error("Payment initialization error:", error.message);
      }
      toast.error(error.message || "Payment initialization failed");
      setIsProcessing(false);
      
      if (onFailure) {
        onFailure({
          error: error.message,
          stage: 'initialization'
        });
      }
    }
  };

  const defaultButtonClass = "w-full px-4 py-2 font-semibold text-white transition duration-200 bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button
      onClick={handlePayment}
      disabled={disabled || isProcessing}
      className={buttonClassName || defaultButtonClass}
    >
      {isProcessing ? (
        <span className="flex items-center justify-center">
          <svg className="w-4 h-4 mr-2 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4h-4z" />
          </svg>
          Processing...
        </span>
      ) : (
        buttonText || `Pay ₹${amount}`
      )}
    </button>
  );
};

export default SecurePaymentComponent;