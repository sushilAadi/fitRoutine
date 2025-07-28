import React from 'react'

const InputBlk = ({title,name, placeholder,onChange,value,inputClass,type="text",required,disabled}) => {
  return (
    <div>
              <label htmlFor="" className="text-[#8a8a8a] mb-1 whitespace-nowrap ">
                {title}
              </label>
              <input
                type={type}
                name={name}
                placeholder={placeholder}
                onChange={onChange}
                className={`text-white block w-100 p-1 h-[36px] rounded-1 bg-[#2a2929] !outline-none !border-none ${inputClass}`}
                value={value}
                required={required}
                disabled={disabled}
                autoComplete='off'
                
              />
            </div>
  )
}

export default InputBlk