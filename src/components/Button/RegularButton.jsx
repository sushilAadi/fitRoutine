import React from 'react'

const RegularButton = ({title, onClick, isDisabled,className}) => {
  return (
    <button
        onClick={onClick}
        disabled={isDisabled}
        className={`w-full py-2 mb-2 text-white transition-colors rounded-full ${className} ${
          isDisabled
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-900 hover:bg-gray-800"
        }`}
      >
        {title}
      </button>
  )
}

export default RegularButton