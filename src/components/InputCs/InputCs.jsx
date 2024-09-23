import React from 'react'
import './input.css'

const InputCs = ({ placeholder, onChange, value, name, min, max, type, disabled, pattern,required,className,list }) => {
    return (
        <input required={required} list={list} placeholder={placeholder} onChange={onChange} value={value} name={name} min={min} max={max} className={`input ${className}`} type={type} pattern={pattern} disabled={disabled} />

    )
}

export default InputCs