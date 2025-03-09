"use client";
import React, { useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import { loadScript } from "@/utils/razorpayUtils";
import { db } from "@/firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

const PaymentComponent = ({ onSuccess, transactionId,amount }) => {
  const { userDetailData } = useContext(GlobalContext);

  const handlePayment = async () => {
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount*100, // Amount in paise (2 INR *100)
      currency: "INR",
      name: "Need FIT AI",
      description: "Workout and Meal Plan",
      image: "https://your-logo-url.com/logo.png",
      order_id: "", // This will be generated on the server-side in a real app
      handler: async function (response) {
        
      
        // Check if razorpay_payment_id is available
        if (!response.razorpay_payment_id) {
          console.error("Razorpay payment ID is missing in the response.");
          return; // Exit the function if payment ID is missing
        }
      
        const paymentData = {
          userId: userDetailData.userIdCl || "N/A",
          userName: userDetailData.userName || "N/A",
          userEmail: userDetailData.userEmail || "N/A",
          transactionId: transactionId || "N/A",
          amount: amount,
          currency: "INR",
          status: "success",
          razorpayPaymentId: response.razorpay_payment_id || "N/A", // Fallback if missing
          razorpayOrderId: response.razorpay_order_id || "N/A", // Fallback if missing
          razorpaySignature: response.razorpay_signature || "N/A", // Fallback if missing
          timestamp: new Date().toISOString(),
        };
      
        console.log("Payment Data:", paymentData); // Log paymentData before saving
      
        try {
          // Only call setDoc if razorpay_payment_id is available
          await setDoc(doc(db, "payments", response.razorpay_payment_id), paymentData);
          onSuccess(); // Ensure this is called
        } catch (error) {
          console.error("Error storing payment details:", error);
        }
      },
      prefill: {
        name: userDetailData.userName,
        email: userDetailData.userEmail,
      },
      theme: {
        color: "#F37254",
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };

  return (
    <button
      onClick={handlePayment}
      className="w-full px-4 py-2 font-semibold text-white transition duration-200 bg-red-500 rounded-lg hover:bg-red-600"
    >
      Pay ₹20 to Unlock Plan
    </button>
  );
};

export default PaymentComponent;