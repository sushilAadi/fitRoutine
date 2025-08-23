"use client";
import React, { useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecurePaymentComponent from "@/components/SecurePaymentComponent";
import toast from "react-hot-toast";

/**
 * @deprecated This component uses insecure payment handling.
 * Use SecurePaymentComponent instead for production applications.
 * 
 * This component is kept for backward compatibility but should be replaced.
 */
const PaymentComponent = ({ onSuccess, onFailure, transactionId, amount }) => {
  const { userDetailData, userId } = useContext(GlobalContext);

  const handleSuccess = (paymentData) => {
    console.log('Payment verified:', paymentData);
    if (onSuccess) {
      onSuccess(paymentData);
    }
  };

  const handleFailure = (errorData) => {
    console.error('Payment failed:', errorData);
    if (onFailure) {
      onFailure(errorData);
    }
  };

  return (
    <SecurePaymentComponent
      onSuccess={handleSuccess}
      onFailure={handleFailure}
      transactionId={transactionId}
      amount={amount}
      description="Workout and Meal Plan"
      buttonText={`Pay ₹${amount} to Unlock Plan`}
    />
  );
};

export default PaymentComponent;