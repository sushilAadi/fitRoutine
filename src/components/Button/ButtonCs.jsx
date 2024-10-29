import React from 'react'
import './button.css'

const ButtonCs = ({ title = "Add title", onClick, type,className,icon,disabled }) => {
    return (
        <button disabled={disabled} className={`${disabled ? "btnCsDisabled":"btnCs"} px-4 !rounded-full ${className}`} onClick={onClick} type={type}>{title} {icon}</button>
    )
}

export default ButtonCs