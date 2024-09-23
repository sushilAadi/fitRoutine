import React from 'react'
import './input.css'

const InputCs = ({ placeholder, onChange, value, name, min, max, type, disabled, pattern,required,className }) => {
    return (
        <input required={required} placeholder={placeholder} onChange={onChange} value={value} name={name} min={min} max={max} className={`input ${className}`} type={type} pattern={pattern} disabled={disabled} />

    )
}

export default InputCs