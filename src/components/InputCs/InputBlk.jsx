import React from 'react'

const InputBlk = ({title,name, placeholder,onChange,value,inputClass,type="text"}) => {
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
                className={`text-white block w-100 p-1 rounded-1 bg-[#2a2929] !outline-none !border-none ${inputClass}`}
                value={value}
                
              />
            </div>
  )
}

export default InputBlk