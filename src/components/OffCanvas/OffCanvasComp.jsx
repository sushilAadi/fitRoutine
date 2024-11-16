'use client'
import { GlobalContext } from '@/context/GloablContext';
import React, { useContext } from 'react'
import Offcanvas from 'react-bootstrap/Offcanvas';

const OffCanvasComp = ({customStyle,sidebar,handleClose,showProps, children, ...props}) => {
  const {handleOpenClose,show} = useContext(GlobalContext)

  const handleCloseProps=()=>{
    if(sidebar){
      handleOpenClose()
    }else{
      handleClose()
    }
  }
  
  return (
    <Offcanvas className={`${customStyle} duration-500`} show={sidebar?show:showProps} onHide={handleCloseProps} {...props}>
        <Offcanvas.Body className='p-0 duration-500'>
          {children}
        </Offcanvas.Body>
      </Offcanvas>
  )
}

export default OffCanvasComp