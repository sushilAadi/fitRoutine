// Define this component, e.g., inside ExerciseCardSelected.jsx or import it

import React from 'react';
import toast from 'react-hot-toast';

 const ConfirmationToast = ({ t, message, onConfirm, onCancel }) => {
  // t: The toast object provided by react-hot-toast, contains the id

  const handleConfirm = () => {
    onConfirm();        // Execute the skip logic
    toast.dismiss(t.id); // Close the toast
  };

  const handleCancel = () => {
    if (onCancel) onCancel(); // Optional cancel action
    toast.dismiss(t.id);     // Close the toast
  };

  return (
    <div className="">
        {message}
        <div className="flex justify-between mt-2">
        <button className="px-2 py-1 w-[50%] text-white border-none bg-red-500" onClick={()=>handleConfirm()}>
          Yes, Skip
        </button>
        <button cdivlassName="px-2 py-1 w-[50%] text-white border-none bg-tprimary" onClick={() => handleCancel()}>
          Cancel
        </button>
        </div>
      </div>
  );
};

export default ConfirmationToast;