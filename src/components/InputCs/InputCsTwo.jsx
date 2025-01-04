import React from "react";

const InputCsTwo = ({placeholder, onChange, value, name, min, max, type, disabled, pattern,required,className,list,label}) => {
  return (
    <div className="coolinput">
      <label htmlFor="input" className="text">
        {label}
      </label>
      <input
        required={required} list={list} placeholder={placeholder} onChange={onChange} value={value} name={name} min={min} max={max}
        type={type} pattern={pattern} disabled={disabled}
        className={`input rounded-0  ${className}`}
      />
    </div>
  );
};

export default InputCsTwo;
