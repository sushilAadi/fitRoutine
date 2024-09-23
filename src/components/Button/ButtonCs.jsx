import React from 'react'
import './button.css'

const ButtonCs = ({ title = "Add title", onClick, type,className }) => {
    return (
        <button className={`btnCs px-4 ${className}`} onClick={onClick} type={type}>{title}</button>
    )
}

export default ButtonCs