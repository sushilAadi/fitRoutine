// Define this component, e.g., inside ExerciseCardSelected.jsx or import it

import React from 'react';
import toast from 'react-hot-toast';

 const ConfirmationToast = ({ t, message, onConfirm, onCancel, confirmText = "Yes, Skip", cancelText = "Cancel" }) => {
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
    <div className={`${
      t.visible ? 'animate-enter' : 'animate-leave'
    } max-w-md w-full h-[60px] bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 flex items-center justify-between px-4`}>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{message}</p>
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-2 ml-3">
        <button 
          className="px-3 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600 transition-colors" 
          onClick={handleConfirm}
        >
          {confirmText}
        </button>
        <button 
          className="px-3 py-1 text-xs text-white bg-gray-600 rounded hover:bg-gray-700 transition-colors" 
          onClick={handleCancel}
        >
          {cancelText}
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="ml-1 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ConfirmationToast;