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
    <Offcanvas 
      className={`${customStyle} duration-500 h-full`} 
      show={sidebar?show:showProps} 
      onHide={handleCloseProps} 
      backdrop={true}
      scroll={false}
      style={{ height: '100vh', maxHeight: '100vh' }}
      {...props}
    >
        <Offcanvas.Body className='p-0 duration-500 h-full overflow-hidden'>
          {children}
        </Offcanvas.Body>
      </Offcanvas>
  )
}

export default OffCanvasComp