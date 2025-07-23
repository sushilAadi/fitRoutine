import React from 'react'

const PillButton = ({icon,title,onClick,className}) => {
  return (
    <button onClick={onClick} className={`btn rounded-pill text-nowrap ${className}`}>{icon}{title}</button>
  )
}

export default PillButton